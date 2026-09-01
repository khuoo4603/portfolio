const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8080";

// 서버 실행 환경의 Backend Origin 정규화
export function getBackendBaseUrl() {
  const configured = process.env.BACKEND_BASE_URL?.trim() || DEFAULT_BACKEND_BASE_URL;
  const target = new URL(configured);

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("지원하지 않는 Backend URL Protocol");
  }

  target.pathname = target.pathname.replace(/\/$/, "");
  target.search = "";
  target.hash = "";
  return target.toString().replace(/\/$/, "");
}
