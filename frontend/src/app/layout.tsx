import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { getDefaultOgImageUrl, getPublicSiteOrigin } from "@/lib/metadata/public-metadata";
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
  let theme = "dark";

  try {
    const storedTheme = window.localStorage.getItem("portfolio-theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      theme = storedTheme;
    }
  } catch {
    // 저장소 접근 제한 환경의 Dark 기본값 유지
  }

  document.documentElement.dataset.theme = theme;
})();
`;

// Main Public Metadata 구성
export function generateMetadata(): Metadata {
  const image = getDefaultOgImageUrl(getPublicSiteOrigin());

  return {
    title: "김현우 | Backend / Infrastructure",
    description: "Backend / Infrastructure 개발자 김현우 포트폴리오",
    openGraph: {
      images: image ? [{ url: image }] : undefined,
    },
    twitter: image ? {
      card: "summary_large_image",
      images: [image],
    } : undefined,
  };
}

// 전체 페이지 Theme과 Font Foundation 적용
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-theme="dark" suppressHydrationWarning className="h-full antialiased">
      <body className={`${instrumentSans.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} min-h-full flex flex-col`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {children}
      </body>
    </html>
  );
}
