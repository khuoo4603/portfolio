import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorScenePage, type ErrorSceneCode } from "./error-scene-page";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("ErrorScenePage", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it.each([
    [404, "Page not found", "요청하신 페이지를 찾을 수 없습니다."],
    [500, "Internal server error", "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."],
    [502, "Bad gateway", "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    [503, "Service unavailable", "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    [504, "Gateway timeout", "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."],
  ] as const)("%s는 동일 Scene에서 오류별 문구를 표시", (code, title, description) => {
    render(<ErrorScenePage code={code as ErrorSceneCode} />);

    expect(screen.getByRole("heading", { name: String(code) })).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
    expect(document.querySelector(".error-scene-page")).toBeInTheDocument();
    expect(document.querySelector(".error-scene-floor")).toBeInTheDocument();

    if (code === 404) {
      expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    } else {
      expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "홈으로 이동" })).toHaveAttribute("href", "/");
  });

  it("5xx의 기본 재시도는 router.refresh를 호출", () => {
    render(<ErrorScenePage code={503} />);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("전달된 retry callback을 기본 refresh보다 우선 사용", () => {
    const reset = vi.fn();
    render(<ErrorScenePage code={500} onRetry={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });
});
