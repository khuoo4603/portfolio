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
    expect(previousButton).toHaveTextContent(/^← PREV$/);
    expect(nextButton).toHaveTextContent(/^NEXT →$/);

    fireEvent.click(nextButton);
    expect(slides[1]).toHaveAttribute("data-active", "true");
    expect(within(carousel).getByText("02 / 05")).toBeInTheDocument();

    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(slides[0]).toHaveAttribute("data-active", "true");
    expect(within(carousel).getByText("01 / 05")).toBeInTheDocument();
    expect(carousel.querySelectorAll("img")).toHaveLength(0);
  });

  it("전체 기술과 외부 성과 3개를 표시", () => {
    render(<KyvcProjectPage />);

    const section = screen.getByRole("region", { name: "기술 스택 · 성과" });
    const stack = within(section).getByRole("list", { name: "KYvC 전체 기술 스택" });

    expect(stack.children).toHaveLength(15);
    expect(stack.querySelectorAll("[data-stack-block]")).toHaveLength(15);
    expect(stack.querySelectorAll('[data-mine="true"]')).toHaveLength(9);
    expect(stack.querySelectorAll('[data-mine="false"]')).toHaveLength(6);
    expect(stack.querySelectorAll("img")).toHaveLength(15);
    expect(within(section).getByText("- 본인 개발 영역")).toBeInTheDocument();
    expect(within(section).getByText("Java").closest("li")).toHaveAttribute("data-mine", "true");
    expect(within(section).getByText("Next.js").closest("li")).toHaveAttribute("data-mine", "false");
    expect(within(stack).queryByText("Docker", { exact: true })).not.toBeInTheDocument();
    expect(within(stack).queryByText("Docker Compose", { exact: true })).not.toBeInTheDocument();
    expect(within(stack).getAllByText("Docker / Compose", { exact: true })).toHaveLength(1);
    expect(within(stack).getByText("Docker / Compose").closest("li"))
      .toHaveAttribute("data-mine", "true");
    expect(within(stack).getByText("Docker / Compose").closest("li"))
      .toHaveAttribute("data-icon", "docker");
    expect(within(stack).getByText("Docker / Compose").closest("li")?.querySelector("img"))
      .toHaveAttribute("src", "/icons/tech/docker.svg");

    const resultArea = within(section).getByRole("region", { name: "성과" });
    const resultItems = within(resultArea).getAllByRole("listitem");
    const resultNumbers = resultItems.map((item) => item.firstElementChild);

    expect(resultItems).toHaveLength(3);
    expect(resultNumbers[0]).toHaveClass("type-small");
    expect(resultNumbers[0]).not.toHaveClass("type-display-lg");
    expect(within(resultArea).getByText("KFIP Toss 특별상 수상")).toBeInTheDocument();
    expect(within(resultArea).getByText("Toss PoC 협의 단계 진입")).toBeInTheDocument();
    expect(within(resultArea).getByText("BKL 법률 검토 단계 진입")).toBeInTheDocument();
    expect(within(resultArea).queryByText("Toss × KYvC PoC 논의")).not.toBeInTheDocument();
    expect(within(resultArea).queryByText("BKL 법률 검토", { exact: true })).not.toBeInTheDocument();
    expect(within(resultArea).queryByText("End-to-End 서비스 흐름 구현")).not.toBeInTheDocument();
    expect(within(resultArea).queryByText("책임 분리형 서비스 구조 구성")).not.toBeInTheDocument();
    expect(within(section).getAllByRole("listitem")).toHaveLength(18);
  });

  it("문제 배경에서 주요 기능, 개인 기여, 아키텍처 순서의 실제 콘텐츠를 표시", () => {
    render(<KyvcProjectPage />);

    const backgroundFeatures = screen.getByRole("region", { name: "문제 배경 · 주요 기능" });

    expect(within(backgroundFeatures).getByRole("heading", { level: 3, name: "문제 배경" }))
      .toBeInTheDocument();
    expect(within(backgroundFeatures).getByRole("heading", { level: 3, name: "주요 기능" }))
      .toBeInTheDocument();
    const features = screen.getByRole("list", { name: "주요 기능" });
    expect(features.children).toHaveLength(6);
    expect(within(features).getByText("법인 KYC 신청·서류 제출")).toBeInTheDocument();
    expect(within(features).getByText("AI·관리자 KYC 심사")).toBeInTheDocument();
    expect(within(features).getByText("VC 발급")).toBeInTheDocument();
    expect(within(features).getByText("Wallet Credential 저장")).toBeInTheDocument();
    expect(within(features).getByText("VP 제출·검증")).toBeInTheDocument();
    expect(within(features).getByText("DID·Credential 상태 관리")).toBeInTheDocument();
    expect(screen.queryByText(/법인 정보 등록, KYC 신청, 증빙서류 업로드/)).not.toBeInTheDocument();
    expect(screen.queryByText(/제출 문서를 OCR \/ LLM 기반으로 분석/)).not.toBeInTheDocument();

    const development = screen.getByRole("region", { name: "직접 담당한 개발 영역" });
    expect(within(development).getByRole("heading", { name: "PL" })).toBeInTheDocument();
    expect(within(development).getByRole("heading", { name: "Backend" })).toBeInTheDocument();
    expect(within(development).getByRole("heading", { name: "Infra" })).toBeInTheDocument();
    expect(within(development).getByText("Self-hosted Runner 기반 서버 배포 흐름 구성"))
      .toBeInTheDocument();

    expect(screen.getByRole("img", { name: /User Web과 Backend/ })).toBeInTheDocument();
    expect(screen.getAllByText("Core Admin API").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "아키텍처" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "서비스 구조와 배포 흐름" })).not.toBeInTheDocument();
    expect(screen.queryByText("Backend는 사용자 인증, 법인 정보, KYC 신청, 제출문서, Credential 요청과 같은 업무 기능을 담당한다."))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Core는 DID, VC, VP, SD-JWT, XRPL, AI 평가와 같은 기술 기능을 담당한다."))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Backend Admin은 Core를 직접 호출하지 않고 업무 Database에 동기화된 결과를 기준으로 관리자 업무를 처리한다."))
      .not.toBeInTheDocument();
  });

  it("본문 Section 제목 위의 중복 Meta Label을 표시하지 않음", () => {
    render(<KyvcProjectPage />);

    const sectionHeadings = [
      "기술 스택 · 성과",
      "문제 배경 · 주요 기능",
      "직접 담당한 개발 영역",
      "아키텍처",
      "기술적 문제 해결",
    ];

    const mainHeadings = within(screen.getByRole("main")).getAllByRole("heading", { level: 2 });

    expect(mainHeadings.map((heading) => heading.textContent?.trim())).toEqual(sectionHeadings);
    sectionHeadings.forEach((name) => {
      const heading = screen.getByRole("heading", { name });
      expect(heading.parentElement?.children).toHaveLength(1);
    });
    expect(screen.getByText("TEAM PROJECT")).toBeInTheDocument();
  });

  it("Project Rail에서 실제 큰 Section과 동일한 5개 위치를 제공", () => {
    render(<KyvcProjectPage />);

    const rail = screen.getByRole("complementary", { name: "프로젝트 상세 영역" });
    const links = within(rail).getAllByRole("link");

    expect(screen.queryByRole("heading", { name: "프로젝트 개요" })).not.toBeInTheDocument();
    expect(links).toHaveLength(5);
    expect(links[0]).toHaveAttribute("href", "#detail-stack-result");
    expect(links[0]).toHaveTextContent("기술 스택 · 성과");
    expect(links[1]).toHaveAttribute("href", "#detail-background");
    expect(links[1]).toHaveTextContent("문제 배경 · 주요 기능");
    expect(links[2]).toHaveAttribute("href", "#detail-development");
    expect(links[2]).toHaveTextContent("직접 담당한 개발 영역");
    expect(links[3]).toHaveAttribute("href", "#detail-architecture");
    expect(links[3]).toHaveTextContent("아키텍처");
    expect(links[4]).toHaveAttribute("href", "#detail-engineering");
    expect(links[4]).toHaveTextContent("기술적 문제 해결");
    expect(rail.querySelector('a[href="#detail-features"]')).not.toBeInTheDocument();
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
