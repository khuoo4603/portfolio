import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, ApiNetworkError, apiRequest, clearCsrfToken, formatApiError, getCsrfToken } from "./client";

describe("공통 API Client", () => {
  beforeEach(() => {
    clearCsrfToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.cookie = "XSRF-TOKEN=; Max-Age=0; Path=/";
  });

  it("Query·JSON 응답과 credentials include를 처리", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ items: [1] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<{ items: number[] }>("/tools", {
      query: { enabled: true, tag: ["a", "b"], empty: null },
    });

    expect(result).toEqual({ items: [1] });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/tools?enabled=true&tag=a&tag=b", expect.objectContaining({
      method: "GET",
      credentials: "include",
    }));
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("%s에 공통 CSRF Header를 적용하고 상태 변경을 재시도하지 않음", async (method) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "csrf-token" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/tools/quizzes", { method, json: { title: "quiz" } });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const requestInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(new Headers(requestInit.headers).get("x-xsrf-token")).toBe("csrf-token");
    expect(new Headers(requestInit.headers).get("content-type")).toBe("application/json");
    expect(requestInit.body).toBe(JSON.stringify({ title: "quiz" }));
  });

  it("상태 변경 요청 실패를 자동 재시도하지 않음", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "csrf-token" }))
      .mockResolvedValueOnce(Response.json({
        code: "AUTH_FORBIDDEN",
        message: "접근 권한이 없습니다.",
        traceId: "trace-mutation",
        fieldErrors: [],
      }, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/auth/logout", { method: "POST" })).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("동시 CSRF 요청과 이후 요청이 하나의 취득 결과를 공유", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ token: "shared-token" }));
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([getCsrfToken(), getCsrfToken()]);
    const third = await getCsrfToken();

    expect([first, second, third]).toEqual(["shared-token", "shared-token", "shared-token"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("CSRF 응답 Token이 없으면 실제 Cookie 값을 사용", async () => {
    document.cookie = "XSRF-TOKEN=cookie-token; Path=/";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));

    await expect(getCsrfToken()).resolves.toBe("cookie-token");
  });

  it("204를 undefined로 처리", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiRequest("/auth/me")).resolves.toBeUndefined();
  });

  it("Binary Request Body를 JSON으로 변경하지 않음", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const body = new Uint8Array([1, 2, 3]);

    await apiRequest("/future-upload", { body });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(body);
    expect(new Headers(init.headers).has("content-type")).toBe(false);
  });

  it.each([401, 403])("Backend %s ErrorResponse의 code·message·traceId·fieldErrors를 보존", async (status) => {
    const payload = {
      code: status === 401 ? "AUTH_UNAUTHORIZED" : "AUTH_FORBIDDEN",
      message: "권한 오류",
      traceId: `trace-${status}`,
      fieldErrors: [{ field: "email", message: "이메일 오류" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload, { status })));

    const error = await apiRequest("/auth/me").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status, response: payload });
    expect(formatApiError(error)).toBe(`이메일 오류 (추적 ID: trace-${status})`);
  });

  it("JSON이 아닌 Backend 오류도 Status별 안전한 오류로 변환", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("gateway", {
      status: 503,
      headers: { "X-Request-Id": "trace-503" },
    })));

    const error = await apiRequest("/tools").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.response).toEqual({
      code: "COMMON_INTERNAL_ERROR",
      message: "요청 처리 중 오류가 발생했습니다.",
      traceId: "trace-503",
      fieldErrors: [],
    });
  });

  it("Browser Network 오류를 Backend ErrorResponse와 분리", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const error = await apiRequest("/public/portfolio").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiNetworkError);
    expect(formatApiError(error)).toBe("서버에 연결할 수 없습니다.");
  });
});
