import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Instrument_Sans: () => ({ variable: "" }),
  JetBrains_Mono: () => ({ variable: "" }),
  Space_Grotesk: () => ({ variable: "" }),
}));

import { generateMetadata } from "./layout";

const originalPublicSiteUrl = process.env.PUBLIC_SITE_URL;

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
