import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPerformanceMonitor,
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

function createMonitorOptions(driver: ReturnType<typeof createFrameDriver>, visibility: () => DocumentVisibilityState = () => "visible") {
  return {
    requestAnimationFrame: driver.requestAnimationFrame,
    cancelAnimationFrame: driver.cancelAnimationFrame,
    getVisibility: visibility,
    measurementFrames: 4,
    lowWindowStreak: 2,
    highWindowStreak: 2,
    cooldownMs: 0,
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

  it("uses high as the initial effective mode", () => {
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "high" });
  });

  it.each(["high", "lite"] as const)("ignores legacy stored %s preference", (stored) => {
    const legacyStorageKey = ["portfolio", "performance", "mode"].join("-");
    window.localStorage.setItem(legacyStorageKey, stored);
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const driver = createFrameDriver();

    startPerformanceRuntime(createMonitorOptions(driver));

    expect(getItem).not.toHaveBeenCalled();
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "high" });
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

  it("returns to high only after two consecutive healthy windows", () => {
    const driver = createFrameDriver();
    const changes: EffectivePerformanceMode[] = [];
    const monitor = createPerformanceMonitor((mode) => changes.push(mode), createMonitorOptions(driver));

    monitor.start();
    let timestamp = flushWindow(driver, 0, 40, 4);
    timestamp = flushWindow(driver, timestamp, 40, 4);
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

  it("does not downgrade a 40 FPS window only because Long Tasks were observed", () => {
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
      const timestamp = flushWindow(driver, 0, 25, 4);
      emitLongTasks?.();
      flushWindow(driver, timestamp, 25, 4);

      expect(changes).toEqual([]);
    } finally {
      if (originalObserver) {
        Object.defineProperty(window, "PerformanceObserver", originalObserver);
      } else {
        Reflect.deleteProperty(window, "PerformanceObserver");
      }
    }
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

  it("starts automatic measurements from high and applies detected lite mode", () => {
    const driver = createFrameDriver();
    startPerformanceRuntime(createMonitorOptions(driver));
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "high" });

    const timestamp = flushWindow(driver, 0, 40, 30);
    flushWindow(driver, timestamp, 40, 30);

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
