import type { Instrumentation } from "next";
import {
  attachFrontendException,
  registerFrontendRequestLogging,
  resolveFrontendTraceId,
} from "@/lib/logging/server-logger";
import { recordFrontendError } from "@/lib/logging/frontend-error";

// Node Runtime 전용 요청 파일 로깅 초기화
export function registerNodeInstrumentation() {
  registerFrontendRequestLogging();
}

// Node Runtime 전용 Server 오류 Trace 연결
export async function onNodeRequestError(
  error: Parameters<Instrumentation.onRequestError>[0],
  request: Parameters<Instrumentation.onRequestError>[1]
) {
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
}
