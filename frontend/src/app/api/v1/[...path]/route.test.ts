import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, HEAD, PATCH, POST } from "./route";

const loggingMocks = vi.hoisted(() => ({ recordFrontendError: vi.fn() }));
vi.mock("@/lib/logging/frontend-error", () => ({
  recordFrontendError: loggingMocks.recordFrontendError,
}));

const ORIGINAL_BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;

function context(...path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function request(path: string, init?: RequestInit) {
  return new Request(`http://frontend.local${path}`, init);
}

describe("Same-Origin Backend Proxy", () => {
  beforeEach(() => {
    process.env.BACKEND_BASE_URL = "http://backend.local:8080";
    loggingMocks.recordFrontendError.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (ORIGINAL_BACKEND_BASE_URL === undefined) {
      delete process.env.BACKEND_BASE_URL;
    } else {
      process.env.BACKEND_BASE_URL = ORIGINAL_BACKEND_BASE_URL;
    }
  });

  it("GET Method와 Query를 Backend Target으로 전달", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("/api/v1/public/portfolio?tag=a&tag=b"), context("public", "portfolio"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://backend.local:8080/api/v1/public/portfolio?tag=a&tag=b");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET", redirect: "manual" });
  });

  it("POST JSON·Cookie·CSRF Header와 단일 Client IP를 보존", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = JSON.stringify({ email: "user@example.com" });

    await POST(request("/api/v1/auth/login", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        Cookie: "PORTFOLIO_SESSION=session-value",
        "X-XSRF-TOKEN": "csrf-value",
        "X-Forwarded-For": "203.0.113.10, 10.0.0.1",
        "X-Request-Id": "request_123",
        Connection: "keep-alive",
        Host: "frontend.local",
      },
    }), context("auth", "login"));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(body);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("cookie")).toBe("PORTFOLIO_SESSION=session-value");
    expect(headers.get("x-xsrf-token")).toBe("csrf-value");
    expect(headers.get("x-forwarded-for")).toBe("203.0.113.10");
    expect(headers.get("x-request-id")).toBe("request_123");
    expect(headers.has("connection")).toBe(false);
    expect(headers.has("host")).toBe(false);
  });

  it.each([
    [PATCH, "PATCH"],
    [DELETE, "DELETE"],
  ])("%s Method와 Binary Body를 전달", async (handler, method) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const bytes = new Uint8Array([0, 1, 2, 255]);

    await handler(request("/api/v1/tools/quizzes/1", { method, body: bytes }), context("tools", "quizzes", "1"));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe(method);
    expect(Array.from(new Uint8Array(init.body as ArrayBuffer))).toEqual(Array.from(bytes));
  });

  it("Binary Response와 Content Header를 보존", async () => {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=resume.pdf",
      },
    })));

    const response = await GET(request("/api/v1/public/resume"), context("public", "resume"));

    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe("inline; filename=resume.pdf");
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual(Array.from(bytes));
  });

  it("204와 HEAD 응답에 Body를 만들지 않음", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response("upstream-body"));
    vi.stubGlobal("fetch", fetchMock);

    const empty = await POST(request("/api/v1/auth/logout", { method: "POST" }), context("auth", "logout"));
    const head = await HEAD(request("/api/v1/public/portfolio", { method: "HEAD" }), context("public", "portfolio"));

    expect(empty.status).toBe(204);
    expect(await empty.text()).toBe("");
    expect(await head.text()).toBe("");
  });

  it("단일·다중 Set-Cookie를 Browser 응답에 전달", async () => {
    const headers = new Headers();
    headers.append("Set-Cookie", "PORTFOLIO_SESSION=one; Path=/; HttpOnly");
    headers.append("Set-Cookie", "XSRF-TOKEN=two; Path=/");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { headers })));

    const response = await GET(request("/api/v1/public/portfolio"), context("public", "portfolio"));
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = responseHeaders.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];

    expect(cookies.join("\n")).toContain("PORTFOLIO_SESSION=one");
    expect(cookies.join("\n")).toContain("XSRF-TOKEN=two");
  });

  it.each([401, 403, 503, 504])("Upstream %s Status와 Error Body를 변경하지 않음", async (status) => {
    const payload = { code: `UPSTREAM_${status}`, message: "upstream", traceId: "trace", fieldErrors: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload, { status })));

    const response = await GET(request("/api/v1/tools"), context("tools"));

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual(payload);
    expect(loggingMocks.recordFrontendError).not.toHaveBeenCalled();
  });

  it("Backend 연결 실패만 안전한 ErrorResponse 502로 변환", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("connection refused")));

    const response = await GET(request("/api/v1/public/portfolio", {
      headers: { "X-Request-Id": "invalid request id" },
    }), context("public", "portfolio"));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({
      code: "COMMON_INTERNAL_ERROR",
      message: "요청 처리 중 오류가 발생했습니다.",
      fieldErrors: [],
    });
    expect(payload.traceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get("x-request-id")).toBe(payload.traceId);
    expect(loggingMocks.recordFrontendError).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/v1/public/portfolio",
      statusCode: 502,
      errorCode: "FRONTEND_BACKEND_CONNECTION_FAILED",
      traceId: payload.traceId,
    });
  });

  it("Backend가 반환한 500은 Frontend 오류로 중복 기록하지 않음", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      code: "COMMON_INTERNAL_ERROR",
      message: "Backend failure",
      traceId: "backend-trace",
      fieldErrors: [],
    }, { status: 500 })));

    const response = await GET(request("/api/v1/public/portfolio"), context("public", "portfolio"));

    expect(response.status).toBe(500);
    expect(loggingMocks.recordFrontendError).not.toHaveBeenCalled();
  });

  it("유효 Request ID는 유지하고 유효하지 않은 ID는 재생성", async () => {
    const captured: string[] = [];
    const fetchMock = vi.fn().mockImplementation((_target: URL, init: RequestInit) => {
      captured.push(new Headers(init.headers).get("x-request-id") ?? "");
      return Promise.resolve(new Response("ok"));
    });
    vi.stubGlobal("fetch", fetchMock);

    await GET(request("/api/v1/public/portfolio", { headers: { "X-Request-Id": "valid-ID_1" } }), context("public", "portfolio"));
    await GET(request("/api/v1/public/portfolio", { headers: { "X-Request-Id": "invalid id" } }), context("public", "portfolio"));

    expect(captured[0]).toBe("valid-ID_1");
    expect(captured[1]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
