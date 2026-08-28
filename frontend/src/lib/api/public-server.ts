import { getBackendBaseUrl } from "./backend-url";
import type { ErrorResponse, PublicPortfolio } from "@/types/api";

export class PublicApiError extends Error {
  readonly status: number;
  readonly response?: ErrorResponse;

  constructor(status: number, response?: ErrorResponse) {
    super(response?.message ?? "공개 콘텐츠 조회 실패");
    this.name = "PublicApiError";
    this.status = status;
    this.response = response;
  }
}

async function errorResponse(response: Response) {
  try {
    const payload = await response.json() as Partial<ErrorResponse>;
    if (typeof payload.code === "string" && typeof payload.message === "string") {
      return {
        code: payload.code,
        message: payload.message,
        traceId: typeof payload.traceId === "string" ? payload.traceId : "",
        fieldErrors: Array.isArray(payload.fieldErrors) ? payload.fieldErrors : [],
      } satisfies ErrorResponse;
    }
  } catch {
    // JSON 형식이 아닌 Backend 오류의 Status 기반 처리
  }
  return undefined;
}

// 서버 전용 Backend Target 기반 공개 Portfolio SSR 조회
export async function fetchPublicPortfolio() {
  const response = await fetch(`${getBackendBaseUrl()}/api/v1/public/portfolio`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new PublicApiError(response.status, await errorResponse(response));
  }
  return await response.json() as PublicPortfolio;
}
