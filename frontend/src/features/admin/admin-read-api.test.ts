import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import {
  getAdminDashboard,
  getErrorLogs,
  getLoginLogs,
  kstEndOfDay,
  kstStartOfDay,
} from "./admin-read-api";

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("Admin Dashboard·Logs 조회 API", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("Dashboard 조회 기간을 query로 전달", () => {
    getAdminDashboard(12);

    expect(apiRequest).toHaveBeenCalledWith("/admin/dashboard", { query: { months: 12 } });
  });

  it("로그인 기록의 Backend filter와 page를 그대로 전달", () => {
    const query = {
      from: "2026-09-01T00:00:00+09:00",
      to: "2026-09-01T23:59:59.999999999+09:00",
      email: "admin@example.com",
      result: "FAILURE" as const,
      page: 2,
      size: 50,
    };
    getLoginLogs(query);

    expect(apiRequest).toHaveBeenCalledWith("/admin/logs/logins", { query });
  });

  it("5xx 오류 기록의 Backend filter와 page를 그대로 전달", () => {
    const query = {
      from: "2026-09-01T00:00:00+09:00",
      to: "2026-09-02T23:59:59.999999999+09:00",
      service: "BACKEND" as const,
      statusCode: 503,
      page: 1,
      size: 50,
    };
    getErrorLogs(query);

    expect(apiRequest).toHaveBeenCalledWith("/admin/logs/errors", { query });
  });

  it("날짜 입력을 KST 시작과 inclusive 종료시각으로 변환", () => {
    expect(kstStartOfDay("2026-09-01")).toBe("2026-09-01T00:00:00+09:00");
    expect(kstEndOfDay("2026-09-01")).toBe("2026-09-01T23:59:59.999999999+09:00");
    expect(kstStartOfDay("")).toBeUndefined();
    expect(kstEndOfDay("")).toBeUndefined();
  });
});
