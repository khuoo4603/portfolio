import type { Instrumentation } from "next";

// Node Runtime의 Frontend 요청 파일 로깅 초기화
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeInstrumentation } = await import("./instrumentation-node");
    registerNodeInstrumentation();
  }
}

// Next.js Server 오류의 안전한 요약·Trace 연결
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { onNodeRequestError } = await import("./instrumentation-node");
  await onNodeRequestError(error, request);
};
