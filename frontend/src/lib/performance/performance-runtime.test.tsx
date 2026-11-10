import { cleanup, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetPerformanceModeForTests,
  startPerformanceRuntime,
  stopPerformanceRuntime,
} from "./performance-mode";
import PerformanceRuntime from "./performance-runtime";

const originalRequestAnimationFrame = Object.getOwnPropertyDescriptor(window, "requestAnimationFrame");
const originalCancelAnimationFrame = Object.getOwnPropertyDescriptor(window, "cancelAnimationFrame");

function installFrameDriver() {
  let nextId = 0;
  const pending = new Set<number>();
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: vi.fn(() => {
      const id = ++nextId;
      pending.add(id);
      return id;
    }),
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    value: vi.fn((id: number) => pending.delete(id)),
  });
  return pending;
}

function restoreProperty(target: object, key: string, descriptor?: PropertyDescriptor) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
    return;
  }
  Reflect.deleteProperty(target, key);
}

describe("Performance Runtime", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.performance;
    delete window.__PORTFOLIO_PERFORMANCE__;
    resetPerformanceModeForTests();
  });

  afterEach(() => {
    cleanup();
    stopPerformanceRuntime();
    window.localStorage.clear();
    delete document.documentElement.dataset.performance;
    delete window.__PORTFOLIO_PERFORMANCE__;
    restoreProperty(window, "requestAnimationFrame", originalRequestAnimationFrame);
    restoreProperty(window, "cancelAnimationFrame", originalCancelAnimationFrame);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("runs one monitor instance and cleans its RAF in Strict Mode", async () => {
    const pending = installFrameDriver();
    const addEventListener = vi.spyOn(document, "addEventListener");
    const removeEventListener = vi.spyOn(document, "removeEventListener");
    const view = render(<StrictMode><PerformanceRuntime /></StrictMode>);

    await waitFor(() => expect(pending.size).toBe(1));
    view.unmount();

    expect(pending.size).toBe(0);
    expect(addEventListener.mock.calls.filter(([type]) => type === "visibilitychange")).toHaveLength(2);
    expect(removeEventListener.mock.calls.filter(([type]) => type === "visibilitychange")).toHaveLength(2);
  });

  it("exposes development diagnostics without adding a user-facing debug UI", () => {
    vi.stubEnv("NODE_ENV", "development");
    installFrameDriver();

    startPerformanceRuntime();

    expect(window.__PORTFOLIO_PERFORMANCE__?.getSnapshot()).toEqual({ effectiveMode: "high" });
    expect(window.__PORTFOLIO_PERFORMANCE__?.getDiagnostics()).toMatchObject({
      effectiveMode: "high",
      frameCount: 0,
      lastModeChangeReason: null,
    });
  });
});
