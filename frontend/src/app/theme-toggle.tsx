"use client";

import { useRef } from "react";

type PortfolioTheme = "light" | "dark";

const THEME_TRANSITION_DURATION = 520;
const THEME_TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

// Theme 전환 Origin과 Viewport 전체를 덮는 반경 계산
export function calculateThemeReveal(
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  viewportWidth: number,
  viewportHeight: number,
) {
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const horizontalDistance = Math.max(x, viewportWidth - x);
  const verticalDistance = Math.max(y, viewportHeight - y);

  return {
    x,
    y,
    radius: Math.hypot(horizontalDistance, verticalDistance),
  };
}

// Theme DOM 반영과 사용자 선택값 저장
function applyTheme(theme: PortfolioTheme) {
  document.documentElement.dataset.theme = theme;

  try {
    window.localStorage.setItem("portfolio-theme", theme);
  } catch {
    // Browser 저장소 제한 환경의 Theme 전환 유지
  }
}

// View Transition 기반 Light·Dark Theme 전환 제어
export default function ThemeToggle() {
  const themeToggleRef = useRef<HTMLButtonElement>(null);
  const themeTransitionRunningRef = useRef(false);

  // 현재 Theme 반전과 Circle Reveal 전환 제어
  const handleThemeToggle = async () => {
    if (themeTransitionRunningRef.current) {
      return;
    }

    const root = document.documentElement;
    const nextTheme: PortfolioTheme = root.dataset.theme === "dark" ? "light" : "dark";
    const button = themeToggleRef.current;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (
      typeof document.startViewTransition !== "function"
      || isReducedMotion
      || !button
      || typeof root.animate !== "function"
    ) {
      applyTheme(nextTheme);
      return;
    }

    const { x, y, radius } = calculateThemeReveal(
      button.getBoundingClientRect(),
      window.innerWidth,
      window.innerHeight,
    );
    let themeApplied = false;

    themeTransitionRunningRef.current = true;

    try {
      const transition = document.startViewTransition(() => {
        applyTheme(nextTheme);
        themeApplied = true;
      });
      const transitionFinished = transition.finished.catch(() => undefined);

      await transition.ready;

      const animation = root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: THEME_TRANSITION_DURATION,
          easing: THEME_TRANSITION_EASING,
          fill: "both",
          pseudoElement: "::view-transition-new(root)",
        },
      );

      await Promise.all([transitionFinished, animation.finished]);
    } catch {
      if (!themeApplied) {
        applyTheme(nextTheme);
      }
    } finally {
      themeTransitionRunningRef.current = false;
    }
  };

  return (
    <button
      ref={themeToggleRef}
      className="theme-toggle"
      type="button"
      onClick={handleThemeToggle}
      aria-label="색상 테마 전환"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle className="theme-toggle-orbit" cx="12" cy="12" r="7.5" />
        <path className="theme-toggle-half" d="M12 4.5a7.5 7.5 0 0 1 0 15Z" />
        <path className="theme-toggle-axis" d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
      </svg>
    </button>
  );
}
