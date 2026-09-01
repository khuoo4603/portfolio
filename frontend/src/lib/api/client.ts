import type { ErrorResponse } from "@/types/api";

const API_PREFIX = "/api/v1";
const CSRF_PATH = "/auth/csrf";
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = Omit<RequestInit, "body" | "credentials" | "method"> & {
  method?: string;
  query?: Record<string, QueryValue | QueryValue[]>;
  json?: unknown;
  body?: BodyInit | null;
};

// Backend ErrorResponse 보존 오류
export class ApiError extends Error {
  readonly status: number;
  readonly response: ErrorResponse;

  constructor(status: number, response: ErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

// Backend 도달 전 Browser Network 오류
export class ApiNetworkError extends Error {
  constructor(cause?: unknown) {
    super("서버에 연결할 수 없습니다.", { cause });
    this.name = "ApiNetworkError";
  }
}

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

function apiUrl(path: string, query?: ApiRequestOptions["query"]) {
  const pathname = path.startsWith(API_PREFIX) ? path : `${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
  const url = new URL(pathname, window.location.origin);

  Object.entries(query ?? {}).forEach(([key, rawValue]) => {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  });

  return `${url.pathname}${url.search}`;
}

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ErrorResponse>;
  return typeof candidate.code === "string"
    && typeof candidate.message === "string"
    && typeof candidate.traceId === "string"
    && Array.isArray(candidate.fieldErrors);
}

async function parseError(response: Response): Promise<ErrorResponse> {
  const traceId = response.headers.get("X-Request-Id") ?? "";

  try {
    const payload: unknown = await response.json();
    if (isErrorResponse(payload)) {
      return payload;
    }
  } catch {
    // JSON 형식이 아닌 Upstream 오류의 안전한 공통 처리
  }

  return {
    code: response.status === 401 ? "AUTH_UNAUTHORIZED" : response.status === 403 ? "AUTH_FORBIDDEN" : "COMMON_INTERNAL_ERROR",
    message: response.status === 401
      ? "로그인이 필요합니다."
      : response.status === 403
        ? "요청 권한이 없습니다."
        : "요청 처리 중 오류가 발생했습니다.",
    traceId,
    fieldErrors: [],
  };
}

async function fetchCsrfToken() {
  let response: Response;
  try {
    response = await fetch(apiUrl(CSRF_PATH), { credentials: "include" });
  } catch (error) {
    throw new ApiNetworkError(error);
  }
  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  const payload = await response.json() as { token?: unknown };
  const token = typeof payload.token === "string" && payload.token ? payload.token : readCookie(CSRF_COOKIE);
  if (!token) {
    throw new ApiNetworkError();
  }
  return token;
}

// 상태 변경 요청이 공유하는 CSRF Token 취득
export async function getCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }
  if (!csrfRequest) {
    csrfRequest = fetchCsrfToken()
      .then((token) => {
        csrfToken = token;
        return token;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
}

// Session 폐기 이후 CSRF Cache 초기화
export function clearCsrfToken() {
  csrfToken = null;
  csrfRequest = null;
}

// Same-Origin API의 JSON·Query·204·ErrorResponse 공통 처리
export async function apiRequest<T = void>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, json, body: providedBody, ...requestInit } = options;
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(requestInit.headers);
  let body = providedBody;

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  if (MUTATION_METHODS.has(method)) {
    headers.set(CSRF_HEADER, await getCsrfToken());
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path, query), {
      ...requestInit,
      method,
      headers,
      body,
      credentials: "include",
    });
  } catch (error) {
    throw new ApiNetworkError(error);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }
  if (response.status === 204 || method === "HEAD") {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    return await response.json() as T;
  }
  return await response.text() as T;
}

// 기존 Error 영역용 메시지와 필드·추적 정보 조합
export function formatApiError(error: unknown) {
  if (error instanceof ApiError) {
    const fieldMessage = error.response.fieldErrors.map((item) => item.message).filter(Boolean).join(" ");
    const message = fieldMessage || error.response.message;
    return error.response.traceId ? `${message} (추적 ID: ${error.response.traceId})` : message;
  }
  if (error instanceof ApiNetworkError) {
    return error.message;
  }
  return "요청 처리 중 오류가 발생했습니다.";
}
