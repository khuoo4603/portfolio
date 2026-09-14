import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_PORTFOLIO_FIXTURE } from "@/test/public-portfolio-fixture";
import { KYVC_PROJECT_FIXTURE } from "@/test/public-project-fixture";

const routeMocks = vi.hoisted(() => ({
  fetchPortfolio: vi.fn(),
  fetchProject: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: routeMocks.notFound }));
vi.mock("@/lib/analytics/page-view-action", () => ({ recordPageView: vi.fn() }));
vi.mock("@/lib/api/public-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/public-server")>();
  return {
    ...actual,
    fetchPublicPortfolio: routeMocks.fetchPortfolio,
    fetchPublicProject: routeMocks.fetchProject,
  };
});

import { PublicApiError } from "@/lib/api/public-server";
import ProjectPage, { generateMetadata } from "./page";

const originalPublicSiteUrl = process.env.PUBLIC_SITE_URL;

describe("동적 Project Detail Route", () => {
  beforeEach(() => {
    delete process.env.PUBLIC_SITE_URL;
    routeMocks.fetchPortfolio.mockReset().mockResolvedValue(PUBLIC_PORTFOLIO_FIXTURE);
    routeMocks.fetchProject.mockReset().mockResolvedValue(KYVC_PROJECT_FIXTURE);
    routeMocks.notFound.mockClear();
  });

  afterEach(() => {
    cleanup();
    if (originalPublicSiteUrl === undefined) {
      delete process.env.PUBLIC_SITE_URL;
    } else {
      process.env.PUBLIC_SITE_URL = originalPublicSiteUrl;
    }
  });

  it("slug로 Project와 Portfolio를 함께 조회하여 상세를 렌더", async () => {
    const page = await ProjectPage({ params: Promise.resolve({ slug: "kyvc-route" }) });
    render(page);

    expect(routeMocks.fetchProject).toHaveBeenCalledWith("kyvc-route");
    expect(routeMocks.fetchPortfolio).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { level: 1, name: "KYvC" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it.each(["unknown-project", "private-project"])(
    "%s Backend 404만 notFound로 변환",
    async (slug) => {
      routeMocks.fetchProject.mockRejectedValue(new PublicApiError(404, {
        code: "PROJECT_NOT_FOUND",
        message: "프로젝트를 찾을 수 없습니다.",
        traceId: `trace-${slug}`,
        fieldErrors: [],
      }));

      await expect(ProjectPage({ params: Promise.resolve({ slug }) })).rejects.toThrow("NEXT_NOT_FOUND");
      expect(routeMocks.notFound).toHaveBeenCalledTimes(1);
    },
  );

  it("Backend 503을 404로 오인하지 않고 traceId가 있는 안전 오류로 분리", async () => {
    routeMocks.fetchProject.mockRejectedValue(new PublicApiError(503, {
      code: "COMMON_INTERNAL_ERROR",
      message: "처리 실패",
      traceId: "trace-project-503",
      fieldErrors: [],
    }));

    const page = await ProjectPage({ params: Promise.resolve({ slug: "backend-error" }) });
    render(page);

    expect(routeMocks.notFound).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("프로젝트 정보를 불러오지 못했습니다.");
    expect(screen.getByRole("alert")).toHaveTextContent("trace-project-503");
    expect(screen.getByRole("alert")).not.toHaveTextContent("127.0.0.1:8080");
  });

  it("실제 Project Name·Summary와 Portfolio 소유자 기반 Metadata를 생성", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "metadata-project" }) });

    expect(metadata).toMatchObject({
      title: "KYvC | 김현우 포트폴리오",
      description: KYVC_PROJECT_FIXTURE.summary,
    });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).toMatchObject({ type: "website", locale: "ko_KR" });
    expect(metadata.openGraph?.url).toBeUndefined();
    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });

  it("PUBLIC_SITE_URL과 Thumbnail로 Canonical, OG, Twitter Metadata를 생성", async () => {
    process.env.PUBLIC_SITE_URL = "https://public.example.test/deploy-path";

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "metadata-origin" }) });

    expect(metadata.alternates).toEqual({ canonical: "https://public.example.test/projects/kyvc" });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "ko_KR",
      url: "https://public.example.test/projects/kyvc",
      images: [{ url: "https://public.example.test/images/og/portfolio-og.png" }],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://public.example.test/images/og/portfolio-og.png"],
    });
  });

  it("Thumbnail이 없어도 고정 공유 이미지와 Twitter Metadata를 생성", async () => {
    process.env.PUBLIC_SITE_URL = "https://public.example.test";
    routeMocks.fetchProject.mockResolvedValue({ ...KYVC_PROJECT_FIXTURE, thumbnailUrl: null });

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "metadata-no-thumbnail" }) });

    expect(metadata.openGraph).toMatchObject({ url: "https://public.example.test/projects/kyvc" });
    expect(metadata.openGraph?.images).toEqual([{ url: "https://public.example.test/images/og/portfolio-og.png" }]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://public.example.test/images/og/portfolio-og.png"],
    });
  });

  it("Project 조회 실패 시 Origin이나 Backend URL을 Metadata에 노출하지 않음", async () => {
    process.env.PUBLIC_SITE_URL = "https://public.example.test";
    routeMocks.fetchProject.mockRejectedValue(new PublicApiError(503));

    await expect(generateMetadata({ params: Promise.resolve({ slug: "metadata-failure" }) })).resolves.toEqual({});
  });
});
