import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { ErrorLogPage, LoginLogPage } from "./admin-types";
import { getErrorLogs, getLoginLogs } from "./admin-read-api";
import LogsScreen from "./logs-screen";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./admin-read-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-read-api")>();
  return {
    ...actual,
    getLoginLogs: vi.fn(),
    getErrorLogs: vi.fn(),
  };
});

function loginPage(page = 0, totalElements = 1): LoginLogPage {
  return {
    items: [{
      id: page + 1,
      occurredAt: "2026-09-01T12:00:00+09:00",
      email: "admin@example.com",
      result: "FAILURE",
      failureReason: "INVALID_CREDENTIALS",
      ip: "192.0.2.10",
      browser: null,
      os: null,
      device: null,
      traceId: `trace-login-${page}`,
    }],
    page,
    size: 50,
    totalElements,
  };
}

function errorPage(): ErrorLogPage {
  return {
    items: [{
      id: 1,
      occurredAt: "2026-09-01T12:00:00+09:00",
      service: "BACKEND",
      method: null,
      path: null,
      statusCode: 503,
      errorCode: null,
      message: "상위 서비스 응답 오류",
      traceId: "trace-error-0",
    }],
    page: 0,
    size: 50,
    totalElements: 1,
  };
}

describe("Admin 운영 로그 실제 API 상태", () => {
  beforeEach(() => {
    vi.mocked(getLoginLogs).mockReset().mockResolvedValue(loginPage());
    vi.mocked(getErrorLogs).mockReset().mockResolvedValue(errorPage());
  });

  afterEach(() => cleanup());

  it("로그인 기록을 기본 Backend page=0,size=50으로 조회", async () => {
    render(<LogsScreen />);

    expect(await screen.findByText("trace-login-0")).toBeInTheDocument();
    expect(getLoginLogs).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
      email: undefined,
      result: undefined,
      page: 0,
      size: 50,
    });
    expect(screen.getByText("INVALID_CREDENTIALS")).toBeInTheDocument();
  });

  it("로그인 필터를 KST 범위로 변환하고 Backend에 전달", async () => {
    render(<LogsScreen />);
    await screen.findByText("trace-login-0");

    fireEvent.change(screen.getByLabelText("시작일"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("종료일"), { target: { value: "2026-08-31" } });
    fireEvent.change(screen.getByLabelText("계정 이메일"), { target: { value: " admin@example.com " } });
    fireEvent.change(screen.getByLabelText("결과"), { target: { value: "FAILURE" } });
    fireEvent.click(screen.getByRole("button", { name: "조회" }));

    await waitFor(() => expect(getLoginLogs).toHaveBeenLastCalledWith({
      from: "2026-08-01T00:00:00+09:00",
      to: "2026-08-31T23:59:59.999999999+09:00",
      email: "admin@example.com",
      result: "FAILURE",
      page: 0,
      size: 50,
    }));
  });

  it("전체 건수와 응답 page를 사용해 다음 Backend page를 조회", async () => {
    vi.mocked(getLoginLogs).mockImplementation(async (query) => loginPage(query.page, 51));
    render(<LogsScreen />);
    await screen.findByText("trace-login-0");

    fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));

    expect(await screen.findByText("trace-login-1")).toBeInTheDocument();
    expect(getLoginLogs).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 50 }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("계정 이메일"), { target: { value: "admin@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "조회" }));
    await waitFor(() => expect(getLoginLogs).toHaveBeenLastCalledWith(expect.objectContaining({
      email: "admin@example.com",
      page: 0,
      size: 50,
    })));
  });

  it("Error 탭의 서비스·5xx 필터를 전달하고 nullable 요청 정보를 안전하게 표시", async () => {
    render(<LogsScreen />);
    fireEvent.click(screen.getByRole("tab", { name: "Error Logs" }));
    const trace = await screen.findByText("trace-error-0");
    expect(within(trace.closest("tr")!).getAllByText("-")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("시작일"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("종료일"), { target: { value: "2026-09-02" } });
    fireEvent.change(screen.getByLabelText("서비스"), { target: { value: "BACKEND" } });
    fireEvent.change(screen.getByLabelText("5xx 상태"), { target: { value: "503" } });
    fireEvent.click(screen.getByRole("button", { name: "조회" }));

    await waitFor(() => expect(getErrorLogs).toHaveBeenLastCalledWith({
      from: "2026-09-01T00:00:00+09:00",
      to: "2026-09-02T23:59:59.999999999+09:00",
      service: "BACKEND",
      statusCode: 503,
      page: 0,
      size: 50,
    }));
  });

  it("각 탭의 Empty와 ErrorResponse traceId 상태를 독립적으로 표시", async () => {
    vi.mocked(getLoginLogs).mockResolvedValue({ items: [], page: 0, size: 50, totalElements: 0 });
    vi.mocked(getErrorLogs).mockRejectedValue(new ApiError(503, {
      code: "COMMON_INTERNAL_ERROR",
      message: "오류 로그를 불러올 수 없습니다.",
      traceId: "trace-logs",
      fieldErrors: [],
    }));
    render(<LogsScreen />);

    expect(await screen.findByText("로그인 기록 없음")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Error Logs" }));
    expect(await screen.findByText("오류 로그를 불러올 수 없습니다. (추적 ID: trace-logs)")).toBeInTheDocument();
  });
});
