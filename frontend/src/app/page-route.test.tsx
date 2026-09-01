import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicPortfolio } from "@/lib/api/public-server";
import Home from "./page";

vi.mock("@/lib/api/public-server", () => ({ fetchPublicPortfolio: vi.fn() }));
vi.mock("@/lib/analytics/page-view-action", () => ({ recordPageView: vi.fn() }));

describe("Public SSR Route", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("Backend unavailable을 내부 정보 없는 안전한 오류 상태로 분리", async () => {
    vi.mocked(fetchPublicPortfolio).mockRejectedValue(new Error("internal backend address"));

    render(await Home());

    expect(screen.getByRole("alert")).toHaveTextContent("공개 콘텐츠를 불러오지 못했습니다.");
    expect(screen.queryByText(/internal backend address/)).not.toBeInTheDocument();
  });
});
