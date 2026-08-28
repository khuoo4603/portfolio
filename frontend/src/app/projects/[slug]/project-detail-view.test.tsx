import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapProjectDetail } from "@/features/portfolio/project-detail";
import { mapPublicPortfolio } from "@/features/portfolio/public-portfolio";
import { PUBLIC_PORTFOLIO_FIXTURE } from "@/test/public-portfolio-fixture";
import {
  EMPTY_PROJECT_FIXTURE,
  KYVC_PROJECT_FIXTURE,
  MEDIA_PROJECT_FIXTURE,
} from "@/test/public-project-fixture";
import ProjectDetailView from "./project-detail-view";

const portfolio = mapPublicPortfolio(PUBLIC_PORTFOLIO_FIXTURE);

describe("동적 Project Detail View", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: !query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  it("KYvC 기본정보·기간·실제 Portfolio Header와 Footer를 표시", () => {
    render(<ProjectDetailView project={mapProjectDetail(KYVC_PROJECT_FIXTURE)} portfolio={portfolio} />);

    expect(screen.getByRole("heading", { level: 1, name: "KYvC" })).toBeInTheDocument();
    expect(screen.getByText(KYVC_PROJECT_FIXTURE.summary!)).toBeInTheDocument();
    expect(screen.getByText("PROJECT / 2026")).toBeInTheDocument();
    const metadata = screen.getByText("역할").closest("dl")!;
    expect(metadata).toHaveTextContent("PL · Backend · Infra");
    expect(metadata).toHaveTextContent("2026.04.27 — 2026.08.18/ 총 114일");
    expect(metadata).toHaveTextContent("9명");
    expect(screen.getByRole("link", { name: "김현우 포트폴리오 Home" })).toHaveTextContent("KIM HYUNWOO");
    expect(within(screen.getByRole("navigation", { name: "포트폴리오 주요 영역" }))
      .getByRole("link", { name: "프로젝트" })).toHaveAttribute("href", "/#projects");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("© Test Portfolio");
    expect(screen.queryByRole("region", { name: "KYvC 프로젝트 미디어" })).not.toBeInTheDocument();
  });

  it("실제 Technology와 6개 typed Content 영역을 기존 순서로 표시", () => {
    render(<ProjectDetailView project={mapProjectDetail(KYVC_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const stack = screen.getByRole("list", { name: "KYvC 전체 기술 스택" });
    expect(stack.children).toHaveLength(5);
    expect(within(stack).getByText("Docker", { exact: true })).toBeInTheDocument();
    expect(within(stack).getByText("Docker Compose", { exact: true })).toBeInTheDocument();
    expect(within(stack).getByText("Java").closest("li")).toHaveAttribute("data-mine", "true");
    expect(within(stack).getByText("React").closest("li")).toHaveAttribute("data-mine", "false");
    expect(screen.getByText("Fixture 성과")).toBeInTheDocument();
    expect(screen.getByText("Fixture 문제 배경")).toBeInTheDocument();
    expect(screen.getByText("Fixture 주요 기능")).toBeInTheDocument();
    expect(screen.getByText("Fixture Backend 작업")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "아키텍처" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "기술적 문제 해결" })).toBeInTheDocument();

    const rail = screen.getByRole("complementary", { name: "프로젝트 상세 영역" });
    const railLinks = within(rail).getAllByRole("link");
    expect(railLinks).toHaveLength(5);
    expect(railLinks.map((link) => link.getAttribute("href"))).toEqual([
      "#detail-stack-result",
      "#detail-background",
      "#detail-development",
      "#detail-architecture",
      "#detail-engineering",
    ]);
  });

  it("KYvC에만 기존 SVG 좌표·Edge Visual Config와 API Node Label을 주입", () => {
    render(<ProjectDetailView project={mapProjectDetail(KYVC_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const visual = document.querySelector('[data-visual-config="kyvc"]')!;
    expect(visual).toBeInTheDocument();
    expect(visual.querySelector("svg")).toBeInTheDocument();
    expect(within(visual as HTMLElement).getAllByText("Core Admin API").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: /KYvC 서비스와 데이터/ })).toBeInTheDocument();
  });

  it("다른 slug는 Backend Node Group만 표시하고 SVG Edge를 만들지 않음", () => {
    render(<ProjectDetailView project={mapProjectDetail(MEDIA_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const groups = document.querySelector("[data-architecture-groups]")!;
    expect(groups).toBeInTheDocument();
    expect(groups.querySelector("svg")).not.toBeInTheDocument();
    expect(within(groups as HTMLElement).getByText("Fixture Client")).toBeInTheDocument();
    expect(within(groups as HTMLElement).getByText("Fixture Service")).toBeInTheDocument();
  });

  it("API Media가 있을 때 실제 imageUrl·altText·label 순서로 Carousel을 구성", () => {
    render(<ProjectDetailView project={mapProjectDetail(MEDIA_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const carousel = screen.getByRole("region", { name: "Media Project 프로젝트 미디어" });
    const slides = carousel.querySelectorAll("[data-carousel-slide]");
    expect(slides).toHaveLength(2);
    expect(within(carousel).getByRole("img", { name: "첫 화면" }).getAttribute("src"))
      .toContain("/fixture/one.webp");
    expect(within(carousel).getByText("01 / 02")).toBeInTheDocument();

    fireEvent.click(within(carousel).getByRole("button", { name: "다음 프로젝트 미디어" }));
    expect(within(carousel).getByText("02 / 02")).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(within(carousel).getByText("01 / 02")).toBeInTheDocument();

    fireEvent.error(within(carousel).getByRole("img", { name: "첫 화면" }));
    expect(within(carousel).getByText("화면 1")).toBeInTheDocument();
  });

  it("빈 Content·Media는 Placeholder나 빈 Section 없이 실제 tagline만 유지", () => {
    render(<ProjectDetailView project={mapProjectDetail(EMPTY_PROJECT_FIXTURE)} portfolio={portfolio} />);

    expect(screen.getByText("실제 Fixture tagline")).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "프로젝트 상세 영역" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("main")).queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByText(/준비 중|정보 없음|Placeholder/i)).not.toBeInTheDocument();
  });

  it("진행 중 기간은 종료일·총 일수 없이 진행 상태만 표시", () => {
    const ongoing = mapProjectDetail({
      ...EMPTY_PROJECT_FIXTURE,
      startedAt: "2026-04-27",
    });
    render(<ProjectDetailView project={ongoing} portfolio={portfolio} />);

    expect(screen.getByText("2026.04.27 — 진행 중")).toBeInTheDocument();
    expect(screen.queryByText(/총 \d+일/)).not.toBeInTheDocument();
  });

  it("Engineering Interaction을 문제·개선 방안·결과 순서로 유지", () => {
    render(<ProjectDetailView project={mapProjectDetail(KYVC_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const trigger = screen.getByRole("button", { name: /Fixture 문제 해결/ });
    fireEvent.click(trigger);
    const detail = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(detail).toHaveTextContent("Fixture 문제");
    expect(detail).toHaveTextContent("Fixture 개선 방안");
    expect(detail).toHaveTextContent("Fixture 결과");
  });
});
