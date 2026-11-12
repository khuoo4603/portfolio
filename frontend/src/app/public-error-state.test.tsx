import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicApiError } from "@/lib/api/public-server";
import {
  PublicErrorState,
  resolveErrorSceneCode,
  resolveErrorTraceId,
} from "./public-error-state";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("PublicErrorState", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it("안전한 오류 설명과 router.refresh 및 홈 이동을 제공", () => {
    render(
      <PublicErrorState
        code={503}
        traceId="trace-safe"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "홈으로 이동" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("alert")).toHaveTextContent("trace-safe");
    expect(screen.queryByText(/Error|stack|127\.0\.0\.1/)).not.toBeInTheDocument();
  });

  it("전달된 reset 콜백을 router.refresh보다 우선 사용", () => {
    const reset = vi.fn();

    render(
      <PublicErrorState
        code={500}
        onRetry={reset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("Trace ID 형식이 아닌 내부 주소를 표시하지 않음", () => {
    render(
      <PublicErrorState
        code={503}
        traceId="https://127.0.0.1:8080/internal"
      />,
    );

    expect(screen.getByRole("alert")).not.toHaveTextContent("127.0.0.1:8080");
  });

  it.each([500, 502, 503, 504] as const)("Backend %s 상태를 같은 오류 코드로 보존", (status) => {
    expect(resolveErrorSceneCode(new PublicApiError(status))).toBe(status);
  });

  it("Backend 응답의 Trace ID만 fallback 데이터로 선택", () => {
    expect(resolveErrorTraceId(new PublicApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE",
      message: "service unavailable",
      traceId: "trace-safe",
      fieldErrors: [],
    }))).toBe("trace-safe");
    expect(resolveErrorTraceId(new Error("internal"))).toBeUndefined();
  });

  it("네트워크 TypeError는 502, 그 외 알 수 없는 오류는 500으로 분류", () => {
    expect(resolveErrorSceneCode(new TypeError("fetch failed"))).toBe(502);
    expect(resolveErrorSceneCode(new Error("unknown failure"))).toBe(500);
    expect(resolveErrorSceneCode(new PublicApiError(404))).toBe(500);
  });
});
