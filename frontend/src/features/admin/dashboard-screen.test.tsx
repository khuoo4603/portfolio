import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { DashboardData } from "./admin-types";
import { getAdminDashboard } from "./admin-read-api";
import DashboardScreen from "./dashboard-screen";

vi.mock("./admin-read-api", () => ({
  getAdminDashboard: vi.fn(),
}));

function dashboardData(month: string, visitors: number): DashboardData {
  return {
    traffic: {
      todayVisitors: 184,
      todayPageViews: 463,
      monthVisitors: visitors,
      monthPageViews: 9_716,
      trend: [{ month, visitors, pageViews: 9_716 }],
    },
    serviceStatus: [{
      serviceKey: "PORTFOLIO_BACKEND",
      status: "UP",
      responseTimeMs: 42,
      httpStatus: 200,
      lastCheckedAt: "2026-09-01T12:00:00+09:00",
    }],
    siteSummary: {
      publicProjects: 2,
      portfolioTechnologies: 10,
      activeTools: 1,
      activeAccounts: 4,
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe("Admin Dashboard 실제 API 상태", () => {
  beforeEach(() => {
    vi.mocked(getAdminDashboard).mockReset();
  });

  afterEach(() => cleanup());

  it("초기 6개월 조회 중 Mock 수치 대신 Loading을 표시", async () => {
    vi.mocked(getAdminDashboard).mockReturnValue(new Promise(() => undefined));
    render(<DashboardScreen />);

    expect(screen.getByRole("status", { name: "데이터 불러오는 중" })).toBeInTheDocument();
    await waitFor(() => expect(getAdminDashboard).toHaveBeenCalledWith(6));
    expect(screen.queryByText("3,842")).not.toBeInTheDocument();
  });

  it("Backend 응답의 단일 trend·서비스 목록·사이트 집계만 표시", async () => {
    vi.mocked(getAdminDashboard).mockResolvedValue(dashboardData("2026-09", 4_321));
    render(<DashboardScreen />);

    expect(await screen.findByText("4,321")).toBeInTheDocument();
    expect(screen.getByLabelText("2026-09, 방문자 4321, 페이지 조회 9716")).toBeInTheDocument();
    expect(screen.getByText("Portfolio Backend")).toBeInTheDocument();
    expect(screen.queryByText("Portfolio Frontend")).not.toBeInTheDocument();
    expect(screen.getByText("활성 기술").nextElementSibling).toHaveTextContent("10");
  });

  it("12개월 선택 시 months=12 응답으로 교체", async () => {
    vi.mocked(getAdminDashboard)
      .mockResolvedValueOnce(dashboardData("2026-04", 600))
      .mockResolvedValueOnce(dashboardData("2025-10", 1_200));
    render(<DashboardScreen />);
    await screen.findByLabelText("2026-04, 방문자 600, 페이지 조회 9716");

    fireEvent.click(screen.getByRole("button", { name: "12개월" }));

    expect(await screen.findByLabelText("2025-10, 방문자 1200, 페이지 조회 9716")).toBeInTheDocument();
    expect(getAdminDashboard).toHaveBeenLastCalledWith(12);
    expect(screen.getByRole("button", { name: "12개월" })).toHaveAttribute("aria-pressed", "true");
  });

  it("늦게 도착한 이전 기간 응답을 무시", async () => {
    const sixMonths = deferred<DashboardData>();
    const twelveMonths = deferred<DashboardData>();
    vi.mocked(getAdminDashboard).mockImplementation((months) => months === 6 ? sixMonths.promise : twelveMonths.promise);
    render(<DashboardScreen />);
    await waitFor(() => expect(getAdminDashboard).toHaveBeenCalledWith(6));

    fireEvent.click(screen.getByRole("button", { name: "12개월" }));
    await waitFor(() => expect(getAdminDashboard).toHaveBeenCalledWith(12));
    await act(async () => twelveMonths.resolve(dashboardData("2025-10", 1_200)));
    expect(await screen.findByText("1,200")).toBeInTheDocument();

    await act(async () => sixMonths.resolve(dashboardData("2026-04", 600)));
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.queryByText("600")).not.toBeInTheDocument();
  });

  it("Backend ErrorResponse의 메시지와 traceId를 표시하고 Mock으로 대체하지 않음", async () => {
    vi.mocked(getAdminDashboard).mockRejectedValue(new ApiError(503, {
      code: "COMMON_INTERNAL_ERROR",
      message: "대시보드를 불러올 수 없습니다.",
      traceId: "trace-dashboard",
      fieldErrors: [],
    }));
    render(<DashboardScreen />);

    expect(await screen.findByText("대시보드를 불러올 수 없습니다. (추적 ID: trace-dashboard)")).toBeInTheDocument();
    expect(screen.queryByText("3,842")).not.toBeInTheDocument();
  });
});
