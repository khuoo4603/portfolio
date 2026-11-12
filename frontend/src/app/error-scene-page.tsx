"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import NotFoundScene from "./not-found-scene";

export type ErrorSceneCode = 404 | 500 | 502 | 503 | 504;

type ErrorSceneCopy = {
  title: string;
  description: string;
};

export const ERROR_SCENE_COPY: Record<ErrorSceneCode, ErrorSceneCopy> = {
  404: {
    title: "Page not found",
    description: "요청하신 페이지를 찾을 수 없습니다.",
  },
  500: {
    title: "Internal server error",
    description: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  },
  502: {
    title: "Bad gateway",
    description: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  },
  503: {
    title: "Service unavailable",
    description: "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  },
  504: {
    title: "Gateway timeout",
    description: "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
  },
};

type ErrorScenePageProps = {
  code?: ErrorSceneCode;
  traceId?: string;
  onRetry?: () => void;
};

// 404와 5xx가 공유하는 오류 Scene의 텍스트와 액션 구성
export function ErrorScenePage({ code = 500, traceId, onRetry }: ErrorScenePageProps) {
  const router = useRouter();
  const copy = ERROR_SCENE_COPY[code];
  const safeTraceId = traceId && /^[A-Za-z0-9_-]{1,64}$/.test(traceId) ? traceId : undefined;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }

    router.refresh();
  };

  return (
    <main className="error-scene-page" role="alert">
      <NotFoundScene />
      <div className="error-scene-content">
        <h1 className="error-scene-code">{code}</h1>
        <p className="error-scene-title type-title">{copy.title}</p>
        <p className="error-scene-description type-body-lg">{copy.description}</p>
        {safeTraceId ? <p className="error-scene-trace type-small">오류 추적 ID: {safeTraceId}</p> : null}
        <div className="error-scene-actions">
          {code === 404 ? null : (
            <button className="error-scene-action" type="button" onClick={handleRetry}>
              다시 시도
            </button>
          )}
          <Link className="error-scene-action" href="/">
            홈으로 이동
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ErrorScenePage;
