import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("Public root error boundary", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("내부 예외를 노출하지 않고 reset과 홈 이동을 제공", () => {
    const reset = vi.fn();

    render(
      <ErrorPage
        error={new Error("secret backend address")}
        reset={reset}
      />,
    );

    expect(screen.getByRole("heading", { name: "500" })).toBeInTheDocument();
    expect(screen.getByText("Internal server error")).toBeInTheDocument();
    expect(screen.getByRole("alert")).not.toHaveTextContent("secret backend address");
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "홈으로 이동" })).toHaveAttribute("href", "/");
  });
});
