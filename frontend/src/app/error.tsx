"use client";

import ErrorScenePage from "./error-scene-page";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Root Error Boundary의 500 공통 Scene 구성
export default function ErrorPage({ reset }: ErrorPageProps) {
  return <ErrorScenePage code={500} onRetry={reset} />;
}
