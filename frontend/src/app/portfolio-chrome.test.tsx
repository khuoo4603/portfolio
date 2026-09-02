import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PortfolioFooter } from "./portfolio-chrome";

const content = {
  NAME: "Fixture Name",
  POSITION: "Fixture Role",
  EMAIL: "fixture@example.com",
};

describe("실제 Public Footer", () => {
  afterEach(cleanup);

  it("Resume 미등록 시 기존 비활성 상태를 유지", () => {
    render(<PortfolioFooter content={content} externalLinks={[]} resume={null} />);
    expect(screen.getByText("이력서 보기")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("PDF 다운로드")).toHaveAttribute("aria-disabled", "true");
  });

  it("View와 Download가 같은 기존 Same-Origin Binary Endpoint를 사용", () => {
    render(
      <PortfolioFooter
        content={content}
        externalLinks={[{ id: 1, name: "Unknown Service", url: "https://service.example", displayOrder: 1 }]}
        resume={{ fileName: "resume.pdf", updatedAt: "2026-08-28T00:00:00+09:00" }}
      />,
    );

    expect(screen.getByRole("link", { name: "이력서 보기" })).toHaveAttribute("href", "/api/v1/public/resume");
    expect(screen.getByRole("link", { name: "이력서 보기" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "PDF 다운로드" })).toHaveAttribute("href", "/api/v1/public/resume");
    expect(screen.getByRole("link", { name: "PDF 다운로드" })).toHaveAttribute("download", "resume.pdf");
    expect(screen.getByRole("link", { name: "Unknown Service" })).toHaveTextContent("Unknown Service");
    expect(document.querySelector("a[href*='download=true']")).not.toBeInTheDocument();
  });
});
