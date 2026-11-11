import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPerformanceMonitor,
  detectGraphicsCapability,
  getPerformanceDiagnostics,
  getPerformanceSnapshot,
  resetPerformanceModeForTests,
  startPerformanceRuntime,
  stopPerformanceRuntime,
  type EffectivePerformanceMode,
} from "./performance-mode";

type FrameCallback = (timestamp: number) => void;

function createFrameDriver() {
  let nextId = 0;
  const callbacks = new Map<number, FrameCallback>();
  const cancelled: number[] = [];

  return {
    requestAnimationFrame(callback: FrameCallback) {
      const id = ++nextId;
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number) {
      cancelled.push(id);
      callbacks.delete(id);
    },
    flush(timestamp: number) {
      const callback = callbacks.entries().next().value as [number, FrameCallback] | undefined;
      if (!callback) return;
      callbacks.delete(callback[0]);
      callback[1](timestamp);
    },
    pending() {
      return callbacks.size;
    },
    cancelled,
  };
}

function flushWindow(
  driver: ReturnType<typeof createFrameDriver>,
  start: number,
  interval: number,
  frames: number,
) {
  let timestamp = start;
  driver.flush(timestamp);
  for (let index = 0; index < frames; index += 1) {
    timestamp += interval;
    driver.flush(timestamp);
  }
  return timestamp;
}

function flushIntervals(
  driver: ReturnType<typeof createFrameDriver>,
  start: number,
  intervals: number[],
) {
  let timestamp = start;
  driver.flush(timestamp);
  for (const interval of intervals) {
    timestamp += interval;
    driver.flush(timestamp);
  }
  return timestamp;
}

function createMonitorOptions(driver: ReturnType<typeof createFrameDriver>, visibility: () => DocumentVisibilityState = () => "visible") {
  return {
    requestAnimationFrame: driver.requestAnimationFrame,
    cancelAnimationFrame: driver.cancelAnimationFrame,
    getVisibility: visibility,
    measurementFrames: 4,
    lowWindowStreak: 2,
    highWindowStreak: 3,
    cooldownMs: 0,
    windowGapMs: 0,
    canRecoverToHigh: () => true,
    initialMode: "high" as const,
  };
}

describe("performance mode store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.performance;
    resetPerformanceModeForTests();
  });

  afterEach(() => {
    stopPerformanceRuntime();
    vi.restoreAllMocks();
    window.localStorage.clear();
    delete document.documentElement.dataset.performance;
  });

  it("uses lite as the initial effective mode before the GPU check", () => {
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });
  });

  it.each(["high", "lite"] as const)("ignores legacy stored %s preference", (stored) => {
    const legacyStorageKey = ["portfolio", "performance", "mode"].join("-");
    window.localStorage.setItem(legacyStorageKey, stored);
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const driver = createFrameDriver();

    startPerformanceRuntime(createMonitorOptions(driver));

    expect(getItem).not.toHaveBeenCalled();
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });
  });

  it("switches to lite only after two consecutive low-performance windows", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));

    monitor.start();
    const timestamp = flushWindow(driver, 0, 40, 4);
    expect(changes).toEqual([]);
    flushWindow(driver, timestamp, 40, 4);

    expect(changes).toEqual(["lite"]);
  });

  it("does not treat one dropped frame as a performance downgrade", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));

    monitor.start();
    let timestamp = flushWindow(driver, 0, 16, 3);
    timestamp += 180;
    driver.flush(timestamp);
    flushWindow(driver, timestamp, 16, 2);

    expect(changes).toEqual([]);
  });

  it("returns to high only after three consecutive healthy windows", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));

    monitor.start();
    let timestamp = flushWindow(driver, 0, 40, 4);
    timestamp = flushWindow(driver, timestamp, 40, 4);
    expect(changes).toEqual(["lite"]);
    timestamp = flushWindow(driver, timestamp, 16, 4);
    expect(changes).toEqual(["lite"]);
    timestamp = flushWindow(driver, timestamp, 16, 4);
    expect(changes).toEqual(["lite"]);
    flushWindow(driver, timestamp, 16, 4);

    expect(changes).toEqual(["lite", "high"]);
  });

  it("pauses hidden-document measurements and resumes after visibility returns", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    let visibility: DocumentVisibilityState = "hidden";
    const monitor = createPerformanceMonitor(
      (mode) => changes.push(mode),
      createMonitorOptions(driver, () => visibility),
    );

    monitor.start();
    driver.flush(0);
    expect(driver.pending()).toBe(0);
    expect(changes).toEqual([]);

    visibility = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    const timestamp = flushWindow(driver, 0, 40, 4);
    flushWindow(driver, timestamp, 40, 4);

    expect(changes).toEqual(["lite"]);
  });

  it("does not downgrade a stable 60 FPS window only because Long Tasks were observed", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    let emitLongTasks: (() => void) | undefined;
    class MockPerformanceObserver {
      static supportedEntryTypes = ["longtask"];
      observe = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => [] as PerformanceEntryList);
      constructor(callback: PerformanceObserverCallback) {
        emitLongTasks = () => callback({ getEntries: () => [{}, {}] } as PerformanceObserverEntryList, this);
      }
    }
    const originalObserver = Object.getOwnPropertyDescriptor(window, "PerformanceObserver");
    Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: MockPerformanceObserver });

    try {
      const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));
      monitor.start();
      expect(emitLongTasks).toBeDefined();
      emitLongTasks?.();
      const timestamp = flushWindow(driver, 0, 16, 4);
      emitLongTasks?.();
      flushWindow(driver, timestamp, 16, 4);

      expect(changes).toEqual([]);
    } finally {
      if (originalObserver) {
        Object.defineProperty(window, "PerformanceObserver", originalObserver);
      } else {
        Reflect.deleteProperty(window, "PerformanceObserver");
      }
    }
  });

  it("uses frame delay distribution and Long Tasks as sustained low-performance evidence", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    let emitLongTasks: (() => void) | undefined;
    class MockPerformanceObserver {
      static supportedEntryTypes = ["longtask"];
      observe = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => [] as PerformanceEntryList);
      constructor(callback: PerformanceObserverCallback) {
        emitLongTasks = () => callback({ getEntries: () => [{}] } as PerformanceObserverEntryList, this);
      }
    }
    const originalObserver = Object.getOwnPropertyDescriptor(window, "PerformanceObserver");
    Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: MockPerformanceObserver });

    try {
      const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));
      monitor.start();
      const delayedIntervals = [16, 32, 16, 32];
      emitLongTasks?.();
      const timestamp = flushIntervals(driver, 0, delayedIntervals);
      emitLongTasks?.();
      flushIntervals(driver, timestamp, delayedIntervals);

      expect(changes).toEqual(["lite"]);
      expect(getPerformanceDiagnostics()).toMatchObject({
        effectiveMode: "lite",
        longFrameCount: 2,
        longTaskCount: 1,
        lastModeChangeReason: "frame-delay-distribution",
      });
    } finally {
      if (originalObserver) {
        Object.defineProperty(window, "PerformanceObserver", originalObserver);
      } else {
        Reflect.deleteProperty(window, "PerformanceObserver");
      }
    }
  });

  it("uses interaction activity to qualify a single delayed frame", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));

    monitor.start();
    document.dispatchEvent(new Event("scroll"));
    const delayedIntervals = [16, 32, 16, 16];
    const timestamp = flushIntervals(driver, 0, delayedIntervals);
    document.dispatchEvent(new Event("scroll"));
    flushIntervals(driver, timestamp, delayedIntervals);

    expect(changes).toEqual(["lite"]);
  });

  it("works when PerformanceObserver does not support Long Task entries", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    const originalObserver = Object.getOwnPropertyDescriptor(window, "PerformanceObserver");
    Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: undefined });

    try {
      const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));
      monitor.start();
      const timestamp = flushWindow(driver, 0, 40, 4);
      flushWindow(driver, timestamp, 40, 4);
      expect(changes).toEqual(["lite"]);
    } finally {
      if (originalObserver) {
        Object.defineProperty(window, "PerformanceObserver", originalObserver);
      } else {
        Reflect.deleteProperty(window, "PerformanceObserver");
      }
    }
  });

  it("starts automatic measurements from lite and keeps lite after low-performance detection", () => {
    const driver = createFrameDriver();
    startPerformanceRuntime(createMonitorOptions(driver));
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });

    const timestamp = flushWindow(driver, 0, 40, 30);
    flushWindow(driver, timestamp, 40, 30);

    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });
  });

  it.each([
    ["hardware", "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060, D3D11)"],
    ["software", "Google SwiftShader"],
    ["unknown", "Generic WebGL Renderer"],
  ] as const)("classifies %s renderer evidence conservatively", (expected, renderer) => {
    const getExtension = vi.fn((name: string) => {
      if (name === "WEBGL_debug_renderer_info") {
        return { UNMASKED_RENDERER_WEBGL: 0x9246 };
      }
      if (name === "WEBGL_lose_context") {
        return { loseContext: vi.fn() };
      }
      return null;
    });
    const context = {
      RENDERER: 0x1f01,
      getExtension,
      getParameter: vi.fn(() => renderer),
    } as unknown as WebGLRenderingContext;
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context);

    expect(detectGraphicsCapability()).toMatchObject({
      capability: expected,
      renderer,
    });
    expect(getContext).toHaveBeenCalledWith("webgl2", expect.any(Object));
    expect(getExtension).toHaveBeenCalledWith("WEBGL_lose_context");
  });

  it("promotes to high only after a confirmed hardware renderer and checks GPU once", () => {
    const context = {
      getExtension: vi.fn((name: string) => name === "WEBGL_debug_renderer_info"
        ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
        : name === "WEBGL_lose_context" ? { loseContext: vi.fn() } : null),
      getParameter: vi.fn(() => "ANGLE (Intel, Intel(R) UHD Graphics, D3D11)"),
    } as unknown as WebGLRenderingContext;
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context);

    startPerformanceRuntime(createMonitorOptions(createFrameDriver()));
    startPerformanceRuntime(createMonitorOptions(createFrameDriver()));

    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "high" });
    expect(getPerformanceDiagnostics()).toMatchObject({
      effectiveMode: "high",
      gpuCapability: "hardware",
      gpuRenderer: "ANGLE (Intel, Intel(R) UHD Graphics, D3D11)",
      lastModeChangeReason: "gpu-hardware-confirmed",
    });
    expect(getContext).toHaveBeenCalledTimes(1);
  });

  it.each([
    "Google SwiftShader",
    "Generic WebGL Renderer",
  ])("keeps %s environments in lite mode after healthy RAF windows", (renderer) => {
    const context = {
      getExtension: vi.fn((name: string) => name === "WEBGL_debug_renderer_info"
        ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
        : name === "WEBGL_lose_context" ? { loseContext: vi.fn() } : null),
      getParameter: vi.fn(() => renderer),
    } as unknown as WebGLRenderingContext;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const driver = createFrameDriver();

    startPerformanceRuntime(createMonitorOptions(driver));
    let timestamp = flushWindow(driver, 0, 16, 4);
    timestamp = flushWindow(driver, timestamp, 16, 4);
    flushWindow(driver, timestamp, 16, 4);

    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });
  });

  it("recovers to high only after stable RAF windows on confirmed hardware", () => {
    const context = {
      getExtension: vi.fn((name: string) => name === "WEBGL_debug_renderer_info"
        ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
        : name === "WEBGL_lose_context" ? { loseContext: vi.fn() } : null),
      getParameter: vi.fn(() => "ANGLE (AMD, Radeon RX 6800, D3D11)"),
    } as unknown as WebGLRenderingContext;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const driver = createFrameDriver();

    startPerformanceRuntime(createMonitorOptions(driver));
    let timestamp = flushWindow(driver, 0, 40, 4);
    timestamp = flushWindow(driver, timestamp, 40, 4);
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });
    timestamp = flushWindow(driver, timestamp, 16, 4);
    timestamp = flushWindow(driver, timestamp, 16, 4);
    flushWindow(driver, timestamp, 16, 4);

    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "high" });
  });

  it("keeps lite when WebGL context creation fails", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("context unavailable");
    });

    expect(detectGraphicsCapability()).toEqual({ capability: "unknown", renderer: null });
  });

  it("does not recover to high without confirmed hardware evidence", () => {
    const lowDriver = createFrameDriver();
    startPerformanceRuntime(createMonitorOptions(lowDriver));
    let timestamp = flushWindow(lowDriver, 0, 40, 4);
    flushWindow(lowDriver, timestamp, 40, 4);
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });

    stopPerformanceRuntime();
    const healthyDriver = createFrameDriver();
    startPerformanceRuntime(createMonitorOptions(healthyDriver));
    timestamp = flushWindow(healthyDriver, 0, 16, 4);
    timestamp = flushWindow(healthyDriver, timestamp, 16, 4);
    flushWindow(healthyDriver, timestamp, 16, 4);

    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });
  });

  it("cancels pending measurements and disconnects the observer on stop", () => {
    const driver = createFrameDriver();
    const disconnect = vi.fn();
    class MockPerformanceObserver {
      static supportedEntryTypes = ["longtask"];
      observe = vi.fn();
      disconnect = disconnect;
    }
    const originalObserver = Object.getOwnPropertyDescriptor(window, "PerformanceObserver");
    Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: MockPerformanceObserver });

    try {
      const monitor = createPerformanceMonitor(() => undefined, createMonitorOptions(driver));
      monitor.start();
      expect(driver.pending()).toBe(1);
      monitor.stop();
      expect(driver.cancelled).toHaveLength(1);
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      if (originalObserver) {
        Object.defineProperty(window, "PerformanceObserver", originalObserver);
      } else {
        Reflect.deleteProperty(window, "PerformanceObserver");
      }
    }
  });
});
