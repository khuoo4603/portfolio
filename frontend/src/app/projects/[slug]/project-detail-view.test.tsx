import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapProjectDetail } from "@/features/portfolio/project-detail";
import { PUBLIC_COPY, mapPublicPortfolio } from "@/features/portfolio/public-portfolio";
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
    expect(screen.getByRole("contentinfo")).toHaveTextContent(PUBLIC_COPY.footer.copyright);
    const media = screen.getByRole("region", { name: "KYvC 프로젝트 미디어" });
    expect(media.querySelectorAll('[data-carousel-demo="true"]')).toHaveLength(5);
    expect(within(media).queryByRole("img")).not.toBeInTheDocument();
  });

  it("Media 0건은 기존 Demo 5개와 모든 순환 Interaction을 복원", () => {
    render(<ProjectDetailView project={mapProjectDetail(KYVC_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const carousel = screen.getByRole("region", { name: "KYvC 프로젝트 미디어" });
    const slides = carousel.querySelectorAll("[data-carousel-slide]");
    const previous = within(carousel).getByRole("button", { name: "이전 프로젝트 미디어" });
    const next = within(carousel).getByRole("button", { name: "다음 프로젝트 미디어" });
    expect(slides).toHaveLength(5);
    expect(carousel.querySelectorAll('[data-carousel-demo="true"]')).toHaveLength(5);
    expect(carousel.querySelectorAll('[data-carousel-media="true"]')).toHaveLength(0);
    expect(carousel.querySelector("[data-carousel-placeholder]")).not.toBeInTheDocument();
    expect(slides[0]).toHaveAttribute("data-active", "true");
    expect(within(carousel).getAllByText("KYvC / 이미지 준비 중")).toHaveLength(5);
    expect(within(carousel).getByText("KYvC 화면 01")).toBeInTheDocument();
    expect(within(carousel).getByText("KYvC 화면 05")).toBeInTheDocument();
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();
    expect(within(carousel).queryByRole("img")).not.toBeInTheDocument();

    fireEvent.click(next);
    expect(within(carousel).getByText("02 / 05")).toBeInTheDocument();
    fireEvent.click(previous);
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(within(carousel).getByText("02 / 05")).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();

    const stage = carousel.querySelector("[data-dragging]")!;
    fireEvent.pointerDown(stage, { isPrimary: true, pointerId: 1, pointerType: "touch", clientX: 180 });
    fireEvent.pointerMove(stage, { isPrimary: true, pointerId: 1, pointerType: "touch", clientX: 100 });
    fireEvent.pointerUp(stage, { isPrimary: true, pointerId: 1, pointerType: "touch", clientX: 100 });
    expect(within(carousel).getByText("02 / 05")).toBeInTheDocument();

    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    fireEvent.click(previous);
    expect(within(carousel).getByText("05 / 05")).toBeInTheDocument();
    fireEvent.click(next);
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();
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
    expect(screen.getByText("Fixture 성과 설명")).toBeInTheDocument();
    expect(screen.getByText("Fixture 배경 제목")).toBeInTheDocument();
    expect(screen.getByText("Fixture 문제 배경")).toBeInTheDocument();
    expect(screen.getByText("Fixture 주요 기능")).toBeInTheDocument();
    expect(screen.getByText("Fixture 기능 설명")).toBeInTheDocument();
    expect(screen.getByText("Fixture Backend 작업")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "KYvC 시스템 아키텍처" })).toBeInTheDocument();
    expect(screen.getByText("Synology DSM Reverse Proxy → Nginx → Docker / Docker Compose")).toBeInTheDocument();
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

  it("Architecture Image와 Notes를 동일 Section에 표시", () => {
    render(<ProjectDetailView project={mapProjectDetail(KYVC_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const visual = document.querySelector("[data-architecture]")!;
    expect(visual).toBeInTheDocument();
    expect(within(visual as HTMLElement).getByRole("img", { name: "KYvC 시스템 아키텍처" })).toBeInTheDocument();
    expect(within(visual as HTMLElement).getByText("인프라 / 배포")).toBeInTheDocument();
  });

  it("Technology와 Architecture 이미지 로딩 실패를 명시적 대체 상태로 전환", () => {
    render(<ProjectDetailView project={mapProjectDetail(KYVC_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const stack = screen.getByRole("list", { name: "KYvC 전체 기술 스택" });
    const technologyImage = stack.querySelector("img")!;
    fireEvent.error(technologyImage);
    expect(within(stack).getByRole("img", { name: /아이콘 없음/ })).toHaveClass("technology-icon-fallback");

    const visual = document.querySelector<HTMLElement>("[data-architecture]")!;
    fireEvent.error(within(visual).getByRole("img", { name: "KYvC 시스템 아키텍처" }));
    expect(within(visual).getByRole("img", { name: "아키텍처 이미지 없음" })).toHaveTextContent("이미지 미리보기 없음");
    expect(within(visual).getByText("인프라 / 배포")).toBeInTheDocument();
  });

  it("Architecture Image가 없어도 Notes를 표시", () => {
    render(<ProjectDetailView project={mapProjectDetail(MEDIA_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const visual = document.querySelector("[data-architecture]")!;
    expect(visual).toBeInTheDocument();
    expect(within(visual as HTMLElement).queryByRole("img")).not.toBeInTheDocument();
    expect(within(visual as HTMLElement).getByText("Fixture architecture note")).toBeInTheDocument();
  });

  it("API Media가 있을 때 실제 imageUrl·altText·label 순서로 Carousel을 구성", () => {
    render(<ProjectDetailView project={mapProjectDetail(MEDIA_PROJECT_FIXTURE)} portfolio={portfolio} />);

    const carousel = screen.getByRole("region", { name: "Media Project 프로젝트 미디어" });
    const slides = carousel.querySelectorAll("[data-carousel-slide]");
    expect(slides).toHaveLength(2);
    expect(carousel.querySelectorAll('[data-carousel-demo="true"]')).toHaveLength(0);
    expect(carousel.querySelectorAll('[data-carousel-media="true"]')).toHaveLength(2);
    expect(within(carousel).getByRole("img", { name: "첫 화면" }).getAttribute("src"))
      .toContain("/fixture/one.webp");
    expect(within(carousel).getByText("01 / 02")).toBeInTheDocument();

    fireEvent.click(within(carousel).getByRole("button", { name: "다음 프로젝트 미디어" }));
    expect(within(carousel).getByText("02 / 02")).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(within(carousel).getByText("01 / 02")).toBeInTheDocument();
    const stage = carousel.querySelector("[data-dragging]")!;
    fireEvent.pointerDown(stage, { isPrimary: true, pointerId: 1, pointerType: "touch", clientX: 180 });
    fireEvent.pointerMove(stage, { isPrimary: true, pointerId: 1, pointerType: "touch", clientX: 100 });
    fireEvent.pointerUp(stage, { isPrimary: true, pointerId: 1, pointerType: "touch", clientX: 100 });
    expect(within(carousel).getByText("02 / 02")).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(within(carousel).getByText("01 / 02")).toBeInTheDocument();

    fireEvent.error(within(carousel).getByRole("img", { name: "첫 화면" }));
    expect(within(carousel).getByText("화면 1")).toBeInTheDocument();
  });

  it("Media 1건은 실제 이미지만 표시하고 Carousel Control을 만들지 않음", () => {
    const singleMedia = mapProjectDetail({
      ...MEDIA_PROJECT_FIXTURE,
      media: [MEDIA_PROJECT_FIXTURE.media[0]],
    });
    render(<ProjectDetailView project={singleMedia} portfolio={portfolio} />);

    const carousel = screen.getByRole("region", { name: "Media Project 프로젝트 미디어" });
    expect(carousel.querySelectorAll("img")).toHaveLength(1);
    expect(carousel.querySelectorAll('[data-carousel-demo="true"]')).toHaveLength(0);
    expect(carousel.querySelectorAll('[data-carousel-media="true"]')).toHaveLength(1);
    expect(within(carousel).queryByRole("button", { name: "이전 프로젝트 미디어" })).not.toBeInTheDocument();
    expect(within(carousel).queryByRole("button", { name: "다음 프로젝트 미디어" })).not.toBeInTheDocument();
    expect(within(carousel).queryByText(/01 \/ 01/)).not.toBeInTheDocument();
  });

  it("Media 5건은 Demo를 섞지 않고 실제 API 이미지만 표시", () => {
    const actualMedia = mapProjectDetail({
      ...MEDIA_PROJECT_FIXTURE,
      media: Array.from({ length: 5 }, (_, index) => ({
        id: 100 + index,
        imageUrl: `/fixture/actual-${index + 1}.webp`,
        label: `실제 화면 ${index + 1}`,
        altText: `실제 이미지 ${index + 1}`,
        displayOrder: index + 1,
      })),
    });
    render(<ProjectDetailView project={actualMedia} portfolio={portfolio} />);

    const carousel = screen.getByRole("region", { name: "Media Project 프로젝트 미디어" });
    expect(carousel.querySelectorAll('[data-carousel-demo="true"]')).toHaveLength(0);
    expect(carousel.querySelectorAll('[data-carousel-media="true"]')).toHaveLength(5);
    expect(carousel.querySelectorAll("img")).toHaveLength(5);
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();
    expect(within(carousel).queryByText(/이미지 준비 중/)).not.toBeInTheDocument();
  });

  it("빈 Content에서는 Metadata와 Demo Media만 유지하고 빈 Detail Section을 만들지 않음", () => {
    render(<ProjectDetailView project={mapProjectDetail(EMPTY_PROJECT_FIXTURE)} portfolio={portfolio} />);

    expect(screen.getByRole("heading", { level: 1, name: "Empty Project" })).toBeInTheDocument();
    expect(screen.getByText("실제 Fixture tagline")).toBeInTheDocument();
    const metadata = screen.getByText("역할").closest("dl")!;
    expect(metadata.querySelectorAll("div")).toHaveLength(3);
    expect(metadata).toHaveTextContent("역할-");
    expect(metadata).toHaveTextContent("개발 기간-");
    expect(metadata).toHaveTextContent("참여 인원-");

    const media = screen.getByRole("region", { name: "Empty Project 프로젝트 미디어" });
    expect(within(media).queryByRole("img")).not.toBeInTheDocument();
    expect(media.querySelectorAll('[data-carousel-demo="true"]')).toHaveLength(5);
    expect(media.querySelectorAll('[data-carousel-media="true"]')).toHaveLength(0);
    expect(within(media).getByRole("button", { name: "이전 프로젝트 미디어" })).toBeInTheDocument();
    expect(within(media).getByRole("button", { name: "다음 프로젝트 미디어" })).toBeInTheDocument();
    expect(within(media).getByText("01 / 05")).toBeInTheDocument();

    expect(screen.queryByRole("complementary", { name: "프로젝트 상세 영역" })).not.toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(main.querySelectorAll('section[id^="detail-"]')).toHaveLength(0);
    [
      "기술 스택 · 성과",
      "문제 배경 · 주요 기능",
      "직접 담당한 개발 영역",
      "아키텍처",
      "기술적 문제 해결",
    ].forEach((heading) => expect(within(main).queryByRole("heading", { name: heading })).not.toBeInTheDocument());
    expect(screen.queryByText(/정보 없음|Coming Soon|Placeholder/i)).not.toBeInTheDocument();
  });

  it("Project Media는 별도 타입 구분 없이 Carousel에만 연결", () => {
    const carouselOnly = mapProjectDetail({
      ...KYVC_PROJECT_FIXTURE,
      media: [{ id: 91, imageUrl: "/fixture/carousel.webp", label: "화면", altText: "프로젝트 화면", displayOrder: 0 }],
    });
    render(<ProjectDetailView project={carouselOnly} portfolio={portfolio} />);

    expect(document.querySelector("[data-content-media]")).not.toBeInTheDocument();
    const carousel = screen.getByRole("region", { name: "KYvC 프로젝트 미디어" });
    expect(carousel.querySelectorAll('[data-carousel-media="true"]')).toHaveLength(1);
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
