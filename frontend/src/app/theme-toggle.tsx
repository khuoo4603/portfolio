"use client";

type PortfolioTheme = "light" | "dark";

// Theme DOM 반영과 사용자 선택값 저장
function applyTheme(theme: PortfolioTheme) {
  document.documentElement.dataset.theme = theme;

  try {
    window.localStorage.setItem("portfolio-theme", theme);
  } catch {
    // Browser 저장소 제한 환경의 Theme 전환 유지
  }
}

// Root Snapshot 없이 Theme 선택값 즉시 전환
export default function ThemeToggle() {
  // 현재 Theme 반전과 Browser 저장
  const handleThemeToggle = () => {
    const root = document.documentElement;
    const nextTheme: PortfolioTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  };

  return (
    <button
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
