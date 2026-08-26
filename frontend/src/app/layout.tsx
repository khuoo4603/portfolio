import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "../styles/globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const themeInitScript = `
(() => {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  let theme = systemTheme;

  try {
    const storedTheme = window.localStorage.getItem("portfolio-theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      theme = storedTheme;
    }
  } catch {
    // 시스템 테마 유지
  }

  document.documentElement.dataset.theme = theme;
})();
`;

export const metadata: Metadata = {
  title: "김현우 | Backend / Infrastructure",
  description: "Backend / Infrastructure 개발자 김현우 포트폴리오",
};

// 전체 페이지 Theme과 Font Foundation 적용
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-theme="light" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${instrumentSans.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
