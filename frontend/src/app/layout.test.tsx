import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Instrument_Sans: () => ({ variable: "" }),
  JetBrains_Mono: () => ({ variable: "" }),
  Space_Grotesk: () => ({ variable: "" }),
}));

import RootLayout, { generateMetadata } from "./layout";

const originalPublicSiteUrl = process.env.PUBLIC_SITE_URL;

// 초기 Theme Script 실행
function getThemeScript() {
  const layout = RootLayout({ children: null, params: Promise.resolve({}) });
  const body = layout.props.children;
  const script = body.props.children[0];

  if (typeof script.props.dangerouslySetInnerHTML?.__html !== "string") {
    throw new Error("Theme initialization script is missing");
  }

  return script;
}

function applyInitialTheme() {
  new Function(getThemeScript().props.dangerouslySetInnerHTML.__html)();
}

describe("Main Public Metadata", () => {
  beforeEach(() => {
    delete process.env.PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalPublicSiteUrl === undefined) {
      delete process.env.PUBLIC_SITE_URL;
    } else {
      process.env.PUBLIC_SITE_URL = originalPublicSiteUrl;
    }
  });

  it.each([
    ["https://dev.khuoo.com/deploy-path", "https://dev.khuoo.com"],
    ["https://khuoo.com", "https://khuoo.com"],
  ])("PUBLIC_SITE_URL origin으로 고정 공유 이미지를 생성", (configured, expectedOrigin) => {
    process.env.PUBLIC_SITE_URL = configured;

    const metadata = generateMetadata();

    expect(metadata.openGraph?.images).toEqual([
      { url: `${expectedOrigin}/images/og/portfolio-og.png` },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [`${expectedOrigin}/images/og/portfolio-og.png`],
    });
  });

  it("PUBLIC_SITE_URL이 없으면 내부 주소를 Metadata에 생성하지 않음", () => {
    const metadata = generateMetadata();

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });
});

describe("Initial Theme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-theme");
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("SSR HTML을 Dark Theme으로 전달", () => {
    const layout = RootLayout({ children: null, params: Promise.resolve({}) });

    expect(layout.props["data-theme"]).toBe("dark");
  });

  it("Root Layout Theme Script를 beforeInteractive로 설정", () => {
    const layout = RootLayout({ children: null, params: Promise.resolve({}) });
    const body = layout.props.children;
    const script = body.props.children[0];

    expect(script.props).toMatchObject({
      id: "theme-init",
      strategy: "beforeInteractive",
    });
    expect(typeof script.props.dangerouslySetInnerHTML?.__html).toBe("string");
  });

  it.each([
    ["stored value is absent", null, false, "dark"],
    ["stored value is absent with light system", null, true, "dark"],
    ["stored value is light", "light", true, "light"],
    ["stored value is dark", "dark", false, "dark"],
    ["stored value is invalid", "system", true, "dark"],
  ])("%s", (_scenario, storedTheme, systemIsDark, expectedTheme) => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: systemIsDark }));

    if (storedTheme !== null) {
      window.localStorage.setItem("portfolio-theme", storedTheme);
    }

    applyInitialTheme();

    expect(document.documentElement.dataset.theme).toBe(expectedTheme);
  });

  it("저장소 읽기 실패 시 Dark 기본값을 유지", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage access denied");
    });

    applyInitialTheme();

    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
