import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotFound from "./not-found";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("Public 404", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(cleanup);
  afterEach(() => vi.restoreAllMocks());

  it("검은 독립 화면에 안전한 안내와 홈 이동만 표시", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText("요청하신 페이지를 찾을 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로 이동" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(document.querySelector(".not-found-floor")).toBeInTheDocument();
  });
});
