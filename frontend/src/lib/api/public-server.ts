import { getBackendBaseUrl } from "./backend-url";
import type { ErrorResponse, PublicPortfolio, PublicProjectDetail } from "@/types/api";

export const PUBLIC_SSR_TIMEOUT_MS = 6000;

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
  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/public/portfolio`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(PUBLIC_SSR_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new PublicApiError(response.status, await errorResponse(response));
    }
    return await response.json() as PublicPortfolio;
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new PublicApiError(504);
    }
    throw error;
  }
}

// 공개 slug 기반 프로젝트 상세 SSR 조회
export async function fetchPublicProject(slug: string) {
  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/v1/public/projects/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(PUBLIC_SSR_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      throw new PublicApiError(response.status, await errorResponse(response));
    }
    return await response.json() as PublicProjectDetail;
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new PublicApiError(504);
    }
    throw error;
  }
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}
