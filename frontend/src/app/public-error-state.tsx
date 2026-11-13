import { PublicApiError } from "@/lib/api/public-server";
import ErrorScenePage, { type ErrorSceneCode } from "./error-scene-page";

type PublicErrorStateProps = {
  code?: ErrorSceneCode;
  error?: unknown;
  traceId?: string;
  onRetry?: () => void;
};

// Backend 응답과 연결 오류를 공통 오류 Scene 코드로 변환
export function resolveErrorSceneCode(error: unknown): ErrorSceneCode {
  if (error instanceof PublicApiError) {
    if (error.status === 502 || error.status === 503 || error.status === 504) {
      return error.status;
    }

    if (error.status === 500) {
      return 500;
    }
  }

  return error instanceof TypeError ? 502 : 500;
}

export function resolveErrorTraceId(error: unknown) {
  return error instanceof PublicApiError ? error.response?.traceId : undefined;
}

// Public 데이터 오류를 공통 오류 Scene으로 연결
export function PublicErrorState({ code, error, traceId, onRetry }: PublicErrorStateProps) {
  return <ErrorScenePage code={code ?? resolveErrorSceneCode(error)} traceId={traceId} onRetry={onRetry} />;
}
