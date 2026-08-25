import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KyvcProjectPage from "./page";

describe("KYvC 프로젝트 상세", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
    document.documentElement.dataset.theme = "dark";
  });

  it("Hero에서 프로젝트 정체성과 역할, 개발 기간, 참여 인원을 즉시 표시", () => {
    render(<KyvcProjectPage />);

    expect(screen.getByRole("heading", { level: 1, name: "KYvC" })).toBeInTheDocument();
    expect(screen.getByText(
      "법인 KYC 심사부터 Verifiable Credential 발급과 Verifiable Presentation 검증까지 하나의 흐름으로 연결한 기업 인증 플랫폼",
    )).toBeInTheDocument();
    expect(screen.getByText("TEAM PROJECT")).toBeInTheDocument();
    expect(screen.queryByText(/PROJECT DETAIL/)).not.toBeInTheDocument();

    const metadata = screen.getByText("역할").closest("dl")!;
    const metadataItems = Array.from(metadata.children);
    expect(metadataItems).toHaveLength(3);
    expect(metadataItems[0]).toHaveTextContent("역할PL · Backend · Infra");
    expect(metadataItems[1]).toHaveTextContent("개발 기간2026.04.27 — 2026.08.18/ 총 114일");
    expect(metadataItems[2]).toHaveTextContent("참여 인원9명");

    const header = within(document.querySelector<HTMLElement>(".site-header")!);
    expect(header.getByRole("link", { name: "김현우 포트폴리오 Home" })).toHaveAttribute("href", "/");
    expect(header.getByRole("link", { name: "프로젝트" })).toHaveAttribute("href", "/#projects");
    expect(screen.getByRole("link", { name: /프로젝트 목록/ })).toHaveAttribute("href", "/#projects");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("5개 Placeholder Media를 버튼과 Keyboard로 순환", () => {
    render(<KyvcProjectPage />);

    const carousel = screen.getByRole("region", { name: "KYvC 프로젝트 미디어" });
    const slides = carousel.querySelectorAll<HTMLElement>("[data-carousel-slide]");

    expect(slides).toHaveLength(5);
    expect(slides[0]).toHaveAttribute("data-active", "true");
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();
    expect(within(carousel).getByText("KYvC 화면 05")).toBeInTheDocument();
    expect(within(carousel).getAllByText(/이미지 준비 중/)).toHaveLength(5);

    const previousButton = within(carousel).getByRole("button", { name: "이전 프로젝트 미디어" });
    const nextButton = within(carousel).getByRole("button", { name: "다음 프로젝트 미디어" });
    expect(previousButton).toHaveClass("type-body");
    expect(nextButton).toHaveClass("type-body");

    fireEvent.click(nextButton);
    expect(slides[1]).toHaveAttribute("data-active", "true");
    expect(within(carousel).getByText("02 / 05")).toBeInTheDocument();

    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(slides[0]).toHaveAttribute("data-active", "true");
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();
    expect(carousel.querySelectorAll("img")).toHaveLength(0);
  });

  it("전체 기술 안에서 본인 개발 영역만 Font Weight 대상으로 구분", () => {
    render(<KyvcProjectPage />);

    const section = screen.getByRole("region", { name: "기술 스택과 성과" });
    const stack = within(section).getByRole("list", { name: "KYvC 전체 기술 스택" });

    expect(stack.children).toHaveLength(16);
    expect(stack.querySelectorAll("[data-stack-block]")).toHaveLength(16);
    expect(stack.querySelectorAll('[data-mine="true"]')).toHaveLength(10);
    expect(stack.querySelectorAll('[data-mine="false"]')).toHaveLength(6);
    expect(stack.querySelectorAll("img")).toHaveLength(16);
    expect(within(section).getByText("- 본인 개발 영역")).toBeInTheDocument();
    expect(within(section).getByText("Java").closest("li")).toHaveAttribute("data-mine", "true");
    expect(within(section).getByText("Next.js").closest("li")).toHaveAttribute("data-mine", "false");
    expect(within(section).getByText("Docker Compose").closest("li")?.querySelector("img"))
      .toHaveAttribute("src", "/icons/tech/docker.svg");
    expect(within(section).getByText("KFIP Toss 특별상 수상")).toBeInTheDocument();
    expect(within(section).getAllByRole("listitem")).toHaveLength(19);
  });

  it("WHY에서 WHAT, 개인 기여, Architecture 순서의 실제 콘텐츠를 표시", () => {
    render(<KyvcProjectPage />);

    expect(screen.getByRole("heading", { name: "문제 배경" })).toBeInTheDocument();
    const features = screen.getByRole("list", { name: "주요 기능" });
    expect(features.children).toHaveLength(6);
    expect(within(features).getByText("AI 및 관리자 KYC 심사")).toBeInTheDocument();
    expect(within(features).getByText("DID / Credential 상태 관리")).toBeInTheDocument();

    const development = screen.getByRole("region", { name: "직접 담당한 개발 영역" });
    expect(within(development).getByRole("heading", { name: "PL" })).toBeInTheDocument();
    expect(within(development).getByRole("heading", { name: "Backend" })).toBeInTheDocument();
    expect(within(development).getByRole("heading", { name: "Infra" })).toBeInTheDocument();
    expect(within(development).getByText("Self-hosted Runner 기반 서버 배포 흐름 구성"))
      .toBeInTheDocument();

    expect(screen.getByRole("img", { name: /User Web과 Backend/ })).toBeInTheDocument();
    expect(screen.getAllByText("Core Admin API").length).toBeGreaterThan(0);
    expect(screen.getByText("Backend Admin은 Core를 직접 호출하지 않고 업무 Database에 동기화된 결과를 기준으로 관리자 업무를 처리한다."))
      .toBeInTheDocument();
  });

  it("Project Rail에서 개요를 제외한 6개 본문 위치를 한글로 제공", () => {
    render(<KyvcProjectPage />);

    const rail = screen.getByRole("complementary", { name: "프로젝트 상세 영역" });
    const links = within(rail).getAllByRole("link");

    expect(screen.queryByRole("heading", { name: "프로젝트 개요" })).not.toBeInTheDocument();
    expect(links).toHaveLength(6);
    expect(links[0]).toHaveAttribute("href", "#detail-stack-result");
    expect(links[0]).toHaveTextContent("기술 스택 · 성과");
    expect(links[5]).toHaveAttribute("href", "#detail-engineering");
    expect(links[5]).toHaveTextContent("기술적 문제 해결");
    expect(links[0]).toHaveAttribute("aria-current", "location");
  });

  it("Engineering 상세를 문제, 개선 방안, 결과 순서의 Inline Flow로 전환", () => {
    render(<KyvcProjectPage />);

    const engineering = screen.getByRole("region", { name: "기술적 문제 해결" });
    const triggers = within(engineering).getAllByRole("button");
    const firstTrigger = triggers[0];

    expect(triggers).toHaveLength(4);
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(firstTrigger);
    expect(firstTrigger).toHaveAttribute("aria-expanded", "true");

    const detail = document.getElementById(firstTrigger.getAttribute("aria-controls")!);
    const steps = detail!.querySelectorAll("li");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("문제");
    expect(steps[1]).toHaveTextContent("개선 방안");
    expect(steps[2]).toHaveTextContent("결과");
    expect(detail).toHaveTextContent("사용자 업무 Backend와 Core 기술 서비스를 분리");
  });

  it("기술적 문제 해결을 마지막 상세 Section으로 표시", () => {
    render(<KyvcProjectPage />);

    const engineeringSection = screen.getByRole("region", { name: "기술적 문제 해결" });

    expect(engineeringSection.nextElementSibling).toBeNull();
    expect(screen.queryByText("추가 프로젝트 이미지")).not.toBeInTheDocument();
    expect(screen.queryByText("다음 프로젝트")).not.toBeInTheDocument();
    expect(screen.queryByText("SHKUTrack")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /SHKUTrack/ })).not.toBeInTheDocument();
  });
});
