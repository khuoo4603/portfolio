import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ThemeToggle, { calculateThemeReveal } from "./theme-toggle";

const root = document.documentElement;
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
const originalStartViewTransition = Object.getOwnPropertyDescriptor(document, "startViewTransition");
const originalRootAnimate = Object.getOwnPropertyDescriptor(root, "animate");

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

afterEach(() => {
  cleanup();
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
