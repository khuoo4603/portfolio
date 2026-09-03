export type FrontendLogLevel = "info" | "warn" | "error";

const HEALTH_PATHS = new Set(["/healthz", "/actuator/health", "/liveness", "/readiness"]);
const STATIC_PREFIXES = ["/_next/static/", "/_next/image/"];
const STATIC_FILE = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|eot|otf|ttf|woff2?|m4v|mov|mp4|ogg|webm)$/i;

export type FrontendLogDecision = {
  level: FrontendLogLevel;
  message: string;
} | null;

// 요청 경로와 HTTP 상태 기반 장기 파일 로그 분류
export function classifyFrontendRequest(path: string, status: number, proxyFailure = false): FrontendLogDecision {
  const pathname = sanitizeLogPath(path);

  if (isExcludedPath(pathname) || ((pathname === "/api/v1" || pathname.startsWith("/api/v1/")) && !proxyFailure)) {
    return null;
  }
  if (status >= 300 && status < 400) {
    return null;
  }
  if (status >= 500 && status < 600) {
    return { level: "error", message: "요청 처리 중 오류 발생" };
  }
  if (status >= 400 && status < 500) {
    return { level: "warn", message: "요청 처리 실패" };
  }
  if (status >= 200 && status < 300) {
    return { level: "info", message: "요청 처리 완료" };
  }
  return null;
}

// Query String과 Fragment를 제거한 안전한 로그 경로 정규화
export function sanitizeLogPath(path: string) {
  return (path.split(/[?#]/, 1)[0] || "/").slice(0, 1000);
}

function isExcludedPath(path: string) {
  return HEALTH_PATHS.has(path)
    || STATIC_PREFIXES.some((prefix) => path.startsWith(prefix))
    || path === "/favicon.ico"
    || path.startsWith("/favicon-")
    || STATIC_FILE.test(path);
}
