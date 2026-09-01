import { afterEach, describe, expect, it, vi } from "vitest";
import { recordFrontendError } from "./frontend-error";

const ORIGINAL_BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const input = {
  method: "GET",
  path: "/api/v1/public/portfolio?token=secret",
  statusCode: 502,
  errorCode: "FRONTEND_BACKEND_CONNECTION_FAILED" as const,
  traceId: "trace_502",
};

describe("Frontend 5xx 내부 기록", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    if (ORIGINAL_BACKEND_BASE_URL === undefined) delete process.env.BACKEND_BASE_URL;
    else process.env.BACKEND_BASE_URL = ORIGINAL_BACKEND_BASE_URL;
  });

  it("고정 요약과 query 없는 pathname·traceId만 전송", async () => {
    process.env.BACKEND_BASE_URL = "http://backend:8080";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await recordFrontendError(input);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(init.body));
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend:8080/internal/v1/error-logs");
    expect(payload).toEqual({
      service: "FRONTEND", method: "GET", path: "/api/v1/public/portfolio", statusCode: 502,
      errorCode: "FRONTEND_BACKEND_CONNECTION_FAILED",
      message: "Frontend Proxy가 Backend에 연결하지 못했습니다.", traceId: "trace_502",
    });
    expect(JSON.stringify(payload)).not.toMatch(/secret|cookie|authorization|csrf|otp|password|stack/i);
  });

  it("2xx·4xx와 Health 요청을 기록하지 않음", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await recordFrontendError({ ...input, statusCode: 400 });
    await recordFrontendError({ ...input, path: "/api/v1/actuator/health" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("내부 error-logs 실패를 다시 기록하지 않고 한 번만 종료", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("logging unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(recordFrontendError(input)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
