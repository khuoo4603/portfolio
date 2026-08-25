import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DashboardScreen from "./dashboard-screen";

describe("Admin Dashboard Mock 상태", () => {
  afterEach(() => cleanup());

  it("비어 있지 않은 방문 집계와 6개월 SVG 추이를 즉시 표시", () => {
    render(<DashboardScreen />);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("방문 현황, 서비스 상태와 사이트 현황을 한눈에 확인합니다.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "방문 현황" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "방문 추이" })).toBeInTheDocument();
    expect(screen.getByText("3,842")).toBeInTheDocument();
    expect(screen.getByLabelText("2026-03, 방문자 1980, 페이지 조회 4220")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "데이터 불러오는 중" })).not.toBeInTheDocument();
  });

  it("여섯 서비스와 사이트 현황까지만 노출", () => {
    render(<DashboardScreen />);

    expect(screen.getByRole("heading", { name: "서비스 상태" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "사이트 현황" })).toBeInTheDocument();
    expect(screen.getAllByText("정상")).toHaveLength(4);
    expect(screen.getAllByText("장애")).toHaveLength(2);
    expect(screen.getByText("공개 프로젝트")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "최근 오류" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "최근 로그인" })).not.toBeInTheDocument();
  });

  it("12개월 선택 시 별도 Mock 추이로 전환", () => {
    render(<DashboardScreen />);

    fireEvent.click(screen.getByRole("button", { name: "12개월" }));

    expect(screen.getByLabelText("2025-09, 방문자 920, 페이지 조회 1840")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "12개월" })).toHaveAttribute("aria-pressed", "true");
  });
});
