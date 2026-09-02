import { getBackendBaseUrl } from "@/lib/api/backend-url";

export type PageView = {
  visitorKey: string;
  path: string;
};

// Server Action에서만 사용하는 Backend 내부 방문 집계 호출
export async function recordInternalPageView(pageView: PageView) {
  try {
    await fetch(`${getBackendBaseUrl()}/internal/v1/analytics/page-view`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pageView),
    });
  } catch {
    // Analytics 실패는 Public 응답과 재시도 흐름에 영향을 주지 않는다.
  }
}
