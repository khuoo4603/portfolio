import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublicPortfolio } from "@/lib/api/public-server";
import Home from "./page";

const routeMocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("@/lib/api/public-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/public-server")>();
  return { ...actual, fetchPublicPortfolio: vi.fn() };
});
vi.mock("@/lib/analytics/page-view-action", () => ({ recordPageView: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: routeMocks.refresh }) }));

describe("Public SSR Route", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    routeMocks.refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("Backend unavailable을 내부 정보 없는 안전한 오류 상태로 분리", async () => {
    vi.mocked(fetchPublicPortfolio).mockRejectedValue(new TypeError("internal backend address"));

    render(await Home());

    expect(screen.getByRole("heading", { name: "502" })).toBeInTheDocument();
    expect(screen.getByText("Bad gateway")).toBeInTheDocument();
    expect(screen.getByText("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
    expect(screen.queryByText(/internal backend address/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(routeMocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "홈으로 이동" })).toHaveAttribute("href", "/");
  });
});
