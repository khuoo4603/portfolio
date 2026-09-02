import { getBackendBaseUrl } from "@/lib/api/backend-url";

export type FrontendErrorCode = "FRONTEND_BACKEND_CONNECTION_FAILED" | "FRONTEND_INTERNAL_ERROR";

export type FrontendError = {
  method: string;
  path: string;
  statusCode: number;
  errorCode: FrontendErrorCode;
  traceId: string;
};

const TRACE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const HEALTH_PATHS = ["/healthz", "/actuator/health", "/liveness", "/readiness"];

export function shouldRecordFrontendError(path: string) {
  const pathname = path.split(/[?#]/, 1)[0];
  return !HEALTH_PATHS.some((healthPath) => pathname === healthPath || pathname.endsWith(healthPath));
}

// 고정 요약만 전송해 Request body·Cookie·인증정보·Stack Trace의 DB 저장을 차단
export async function recordFrontendError(error: FrontendError) {
  if (
    error.statusCode < 500
    || error.statusCode > 599
    || !TRACE_ID.test(error.traceId)
    || !shouldRecordFrontendError(error.path)
  ) {
    return;
  }

  const path = error.path.split(/[?#]/, 1)[0].slice(0, 1000) || "/";
  const method = error.method.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10) || "GET";
  const message = error.errorCode === "FRONTEND_BACKEND_CONNECTION_FAILED"
    ? "Frontend Proxy가 Backend에 연결하지 못했습니다."
    : "Frontend Server에서 5xx 오류가 발생했습니다.";

  try {
    await fetch(`${getBackendBaseUrl()}/internal/v1/error-logs`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": error.traceId,
      },
      body: JSON.stringify({
        service: "FRONTEND",
        method,
        path,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        message,
        traceId: error.traceId,
      }),
    });
  } catch {
    // 내부 error-logs 실패를 다시 기록하거나 재시도하지 않는다.
  }
}
