import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPerformanceSnapshot,
  resetPerformanceModeForTests,
  startPerformanceRuntime,
} from "@/lib/performance/performance-mode";

import ThemeToggle, { calculateThemeReveal } from "./theme-toggle";

const root = document.documentElement;
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
const originalStartViewTransition = Object.getOwnPropertyDescriptor(document, "startViewTransition");
const originalRootAnimate = Object.getOwnPropertyDescriptor(root, "animate");
type FrameCallback = (timestamp: number) => void;

function createFrameDriver() {
  let nextId = 0;
  const callbacks = new Map<number, FrameCallback>();

  return {
    requestAnimationFrame(callback: FrameCallback) {
      const id = ++nextId;
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number) {
      callbacks.delete(id);
    },
    flush(timestamp: number) {
      const callback = callbacks.entries().next().value as [number, FrameCallback] | undefined;
      if (!callback) return;
      callbacks.delete(callback[0]);
      callback[1](timestamp);
    },
  };
}

function flushPerformanceWindow(
  driver: ReturnType<typeof createFrameDriver>,
  start: number,
  interval: number,
) {
  let timestamp = start;
  driver.flush(timestamp);
  for (let index = 0; index < 4; index += 1) {
    timestamp += interval;
    driver.flush(timestamp);
  }
  return timestamp;
}

function startTestPerformanceRuntime(driver: ReturnType<typeof createFrameDriver>) {
  startPerformanceRuntime({
    requestAnimationFrame: driver.requestAnimationFrame,
    cancelAnimationFrame: driver.cancelAnimationFrame,
    getVisibility: () => "visible",
    measurementFrames: 4,
    lowWindowStreak: 2,
    highWindowStreak: 2,
    cooldownMs: 0,
    windowGapMs: 0,
  });
}

function setReducedMotion(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: reduced }),
  });
}

function setViewTransition(callback: ReturnType<typeof vi.fn>) {
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: callback,
  });
}

function restoreProperty(target: object, key: string, descriptor?: PropertyDescriptor) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
    return;
  }

  Reflect.deleteProperty(target, key);
}

beforeEach(() => {
  resetPerformanceModeForTests();
});

afterEach(() => {
  cleanup();
  resetPerformanceModeForTests();
  document.documentElement.removeAttribute("data-theme");
  window.localStorage.removeItem("portfolio-theme");
  restoreProperty(window, "matchMedia", originalMatchMedia);
  restoreProperty(document, "startViewTransition", originalStartViewTransition);
  restoreProperty(root, "animate", originalRootAnimate);
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("calculates a circle that reaches the farthest viewport corner", () => {
    expect(calculateThemeReveal({ left: 10, top: 20, width: 40, height: 20 }, 200, 100)).toEqual({
      x: 30,
      y: 30,
      radius: Math.hypot(170, 70),
    });
  });

  it("applies the theme immediately without View Transition support and preserves child controls", () => {
    setReducedMotion(false);
    render(
      <ThemeToggle className="admin-theme-control">
        <span>Theme</span>
      </ThemeToggle>,
    );

    const button = screen.getByRole("button", { name: "색상 테마 전환" });
    expect(button).toHaveClass("theme-toggle", "admin-theme-control");

    fireEvent.click(screen.getByText("Theme"));

    expect(root.dataset.theme).toBe("dark");
  });

  it("applies the theme immediately when reduced motion is preferred", () => {
    setReducedMotion(true);
    const startViewTransition = vi.fn();
    setViewTransition(startViewTransition);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "색상 테마 전환" }));

    expect(root.dataset.theme).toBe("dark");
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("applies Lite themes immediately, persists them, and accepts repeated clicks", () => {
    const driver = createFrameDriver();
    startTestPerformanceRuntime(driver);
    const timestamp = flushPerformanceWindow(driver, 0, 40);
    flushPerformanceWindow(driver, timestamp, 40);
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });

    setReducedMotion(false);
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    });
    const animate = vi.fn();
    setViewTransition(startViewTransition);
    Object.defineProperty(root, "animate", { configurable: true, value: animate });
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "색상 테마 전환" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(root.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("portfolio-theme")).toBe("light");
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
  });

  it("reads the latest automatic mode for each theme transition", async () => {
    const driver = createFrameDriver();
    startTestPerformanceRuntime(driver);
    setReducedMotion(false);
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    });
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() });
    setViewTransition(startViewTransition);
    Object.defineProperty(root, "animate", { configurable: true, value: animate });
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "색상 테마 전환" });
    fireEvent.click(button);
    await waitFor(() => expect(animate).toHaveBeenCalledTimes(1));

    let timestamp = flushPerformanceWindow(driver, 0, 40);
    timestamp = flushPerformanceWindow(driver, timestamp, 40);
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "lite" });
    fireEvent.click(button);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(root.dataset.theme).toBe("light");

    timestamp = flushPerformanceWindow(driver, timestamp, 16);
    flushPerformanceWindow(driver, timestamp, 16);
    expect(getPerformanceSnapshot()).toEqual({ effectiveMode: "high" });
    fireEvent.click(button);
    await waitFor(() => expect(startViewTransition).toHaveBeenCalledTimes(2));
  });

  it("reveals the next theme from the toggle with a root View Transition", async () => {
    setReducedMotion(false);
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    });
    const animate = vi.fn().mockReturnValue({ finished: Promise.resolve() });
    setViewTransition(startViewTransition);
    Object.defineProperty(root, "animate", { configurable: true, value: animate });
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "색상 테마 전환" });
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      width: 40,
      height: 20,
    } as DOMRect);

    fireEvent.click(button);

    await waitFor(() => expect(animate).toHaveBeenCalledTimes(1));

    expect(root.dataset.theme).toBe("dark");
    expect(animate).toHaveBeenCalledWith(
      {
        clipPath: [
          "circle(0px at 30px 30px)",
          `circle(${Math.hypot(window.innerWidth - 30, window.innerHeight - 30)}px at 30px 30px)`,
        ],
      },
      expect.objectContaining({
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
        pseudoElement: "::view-transition-new(root)",
      }),
    );
  });

  it("ignores clicks while the reveal animation is running", async () => {
    setReducedMotion(false);
    let finishAnimation: (() => void) | undefined;
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    });
    const animate = vi.fn().mockReturnValue({
      finished: new Promise<void>((resolve) => {
        finishAnimation = resolve;
      }),
    });
    setViewTransition(startViewTransition);
    Object.defineProperty(root, "animate", { configurable: true, value: animate });
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "색상 테마 전환" });
    fireEvent.click(button);
    await waitFor(() => expect(animate).toHaveBeenCalledTimes(1));
    fireEvent.click(button);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    finishAnimation?.();
  });
});
