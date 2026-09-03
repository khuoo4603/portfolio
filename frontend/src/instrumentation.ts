import type { Instrumentation } from "next";

// Node Runtime의 Frontend 요청 파일 로깅 초기화
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerFrontendRequestLogging } = await import("@/lib/logging/server-logger");
    registerFrontendRequestLogging();
  }
}

// Next.js Server 오류의 안전한 요약·Trace 연결
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [{ attachFrontendException, resolveFrontendTraceId }, { recordFrontendError }] = await Promise.all([
    import("@/lib/logging/server-logger"),
    import("@/lib/logging/frontend-error"),
  ]);
  const header = request.headers["x-request-id"];
  const traceId = resolveFrontendTraceId(header);
  attachFrontendException({
    method: request.method,
    path: request.path,
    traceId,
    errorCode: "FRONTEND_INTERNAL_ERROR",
    stack: error instanceof Error ? error.stack : new Error("Frontend Server 오류").stack,
  });
  await recordFrontendError({
    method: request.method,
    path: request.path,
    statusCode: 500,
    errorCode: "FRONTEND_INTERNAL_ERROR",
    traceId,
  });
};
