import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { SiteData } from "./admin-types";
import { createAdminChallenge } from "./admin-action-api";
import {
  createProfileEntry,
  createTechnology,
  getAdminSite,
  replacePortfolioTechnologies,
  replaceResume,
  updatePortfolioContents,
} from "./admin-site-api";
import SiteScreen from "./site-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn() };
});
vi.mock("./admin-site-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-site-api")>();
  return {
    ...actual,
    getAdminSite: vi.fn(),
    updatePortfolioContents: vi.fn(),
    createProfileEntry: vi.fn(),
    updateProfileEntry: vi.fn(),
    deleteProfileEntry: vi.fn(),
    createTechnology: vi.fn(),
    updateTechnology: vi.fn(),
    deleteTechnology: vi.fn(),
    replacePortfolioTechnologies: vi.fn(),
    createExternalLink: vi.fn(),
    updateExternalLink: vi.fn(),
    deleteExternalLink: vi.fn(),
    replaceResume: vi.fn(),
  };
});

const UPDATED_AT = "2026-09-01T12:00:00+09:00";

function siteData(name = "김현우"): SiteData {
  return {
    portfolioContents: [
      { category: "COMMON", contentCode: "SITE_MARK", contentValue: "KIM HYUNWOO", updatedAt: UPDATED_AT },
      { category: "COMMON", contentCode: "NAME", contentValue: name, updatedAt: UPDATED_AT },
      { category: "MAIN", contentCode: "HERO_STATEMENT", contentValue: "Backend 개발부터 운영까지", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "ABOUT_STATEMENT", contentValue: "문제에 맞는 기술 선택", updatedAt: UPDATED_AT },
      { category: "CONTACT", contentCode: "EMAIL", contentValue: "contact@example.com", updatedAt: UPDATED_AT },
    ],
    profileEntries: [{
      id: 15,
      entryType: "EDUCATION",
      periodText: "2023.03 — 현재",
      title: "소프트웨어융합전공",
      organization: "성공회대학교",
      role: null,
      description: null,
      achievement: "재학",
      featured: false,
      displayOrder: 1,
      enabled: true,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    }],
    technologyMaster: [
      { id: 7, name: "PostgreSQL", category: "DATABASE", iconUrl: "/icons/tech/postgresql.svg", enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
      { id: 8, name: "Next.js", category: "FRONTEND", iconUrl: "/icons/tech/nextjs.svg", enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
    ],
    portfolioTechnologies: [{ technologyId: 7, displayOrder: 1 }],
    projects: [{ id: 3, slug: "kyvc", name: "KYvC", year: 2026, tagline: "법인 KYC 자동 심사 서비스", cardRole: "백엔드 · 인프라", thumbnailUrl: null, displayOrder: 1, enabled: true, updatedAt: UPDATED_AT }],
    externalLinks: [{ id: 4, name: "GitHub", url: "https://github.com/example", displayOrder: 1, enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT }],
    resume: { fileName: "resume.pdf", updatedAt: UPDATED_AT },
  };
}

function submitOtp(code = "654321") {
  fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
    clipboardData: { getData: () => code },
  });
  fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));
}

describe("Admin Site 실제 API 관리", () => {
  beforeEach(() => {
    vi.mocked(getAdminSite).mockReset().mockResolvedValue(siteData());
    vi.mocked(createAdminChallenge).mockReset().mockResolvedValue({ challengeId: "challenge-site", expiresAt: "2099-09-01T12:00:00+09:00" });
    vi.mocked(updatePortfolioContents).mockReset().mockResolvedValue({ items: [] });
    vi.mocked(createProfileEntry).mockReset().mockResolvedValue(siteData().profileEntries[0]);
    vi.mocked(createTechnology).mockReset().mockResolvedValue(siteData().technologyMaster[0]);
    vi.mocked(replacePortfolioTechnologies).mockReset().mockResolvedValue({ items: [] });
    vi.mocked(replaceResume).mockReset().mockResolvedValue({ fileName: "resume-new.pdf", updatedAt: UPDATED_AT });
  });

  afterEach(() => cleanup());

  it("GET /admin/site 실제 DTO를 일곱 관리 영역에 매핑", async () => {
    render(<SiteScreen />);

    expect(await screen.findByDisplayValue("김현우")).toBeInTheDocument();
    expect(screen.getByText("COMMON/SITE_MARK")).toBeInTheDocument();
    expect(screen.getByText("MAIN/HERO_STATEMENT")).toBeInTheDocument();
    expect(screen.queryByText(/HERO_TITLE/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(7);

    fireEvent.click(screen.getByRole("tab", { name: "프로필·연락처" }));
    expect(screen.getByDisplayValue("문제에 맞는 기술 선택")).toBeInTheDocument();
    expect(screen.getByText("CONTACT/EMAIL")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "학력·경력·활동·수상·자격" }));
    expect(screen.getByText("소프트웨어융합전공")).toBeInTheDocument();
    expect(screen.getByText("학력")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "기술" }));
    expect(screen.getByText("DATABASE")).toBeInTheDocument();
    expect(screen.getByText("FRONTEND")).toBeInTheDocument();
    expect(screen.getByText("/icons/tech/postgresql.svg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "프로젝트" }));
    expect(screen.getByText("KYvC")).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /프로젝트/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "외부 링크" }));
    expect(screen.getByText("https://github.com/example")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "이력서" }));
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.queryByText(/파일 크기/)).not.toBeInTheDocument();
  });

  it("콘텐츠 변경만 ADMIN_ACTION PATCH로 보내고 성공 후 Site를 재조회", async () => {
    vi.mocked(getAdminSite)
      .mockResolvedValueOnce(siteData())
      .mockResolvedValue(siteData("김현우 수정"));
    render(<SiteScreen />);
    const name = await screen.findByDisplayValue("김현우");

    fireEvent.change(name, { target: { value: "김현우 수정" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PORTFOLIO_CONTENT_UPDATE",
      targetType: "PORTFOLIO_CONTENT",
      targetId: null,
    })));
    submitOtp();

    await waitFor(() => expect(updatePortfolioContents).toHaveBeenCalledWith([
      { category: "COMMON", contentCode: "NAME", contentValue: "김현우 수정" },
    ], { challengeId: "challenge-site", verificationCode: "654321" }));
    await waitFor(() => expect(getAdminSite).toHaveBeenCalledTimes(2));
    expect(await screen.findByDisplayValue("김현우 수정")).toBeInTheDocument();
  });

  it("Profile Editor가 EDUCATION을 포함하고 Create Challenge를 발급", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "학력·경력·활동·수상·자격" }));
    fireEvent.click(screen.getByRole("button", { name: "항목 추가" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("option", { name: "학력" })).toHaveValue("EDUCATION");
    fireEvent.change(within(dialog).getByLabelText("유형"), { target: { value: "EDUCATION" } });
    fireEvent.change(within(dialog).getByLabelText("제목"), { target: { value: "새 학력" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PROFILE_ENTRY_CREATE",
      targetType: "PROFILE_ENTRY",
      targetId: null,
    })));
  });

  it("Technology Editor가 6개 Category와 iconUrl만 사용", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "기술" }));
    fireEvent.click(screen.getByRole("button", { name: "기술 추가" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getAllByRole("option")).toHaveLength(6);
    expect(within(dialog).getByRole("option", { name: "DATABASE" })).toBeInTheDocument();
    expect(within(dialog).getByRole("option", { name: "FRONTEND" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Icon URL")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Icon Key")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("표시 순서")).not.toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("기술명"), { target: { value: "React" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "TECHNOLOGY_CREATE",
      targetType: "TECHNOLOGY",
      targetId: null,
    })));
  });

  it("메인 기술 선택·순서를 별도 PUT Challenge로 저장", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "기술" }));
    fireEvent.change(screen.getByLabelText("메인 노출 기술"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.click(screen.getByRole("button", { name: "메인 구성 저장" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PORTFOLIO_TECHNOLOGY_UPDATE",
      targetType: "PORTFOLIO_TECHNOLOGY",
      targetId: null,
    })));
    submitOtp();
    await waitFor(() => expect(replacePortfolioTechnologies).toHaveBeenCalledWith([
      { technologyId: 7, displayOrder: 1 },
      { technologyId: 8, displayOrder: 2 },
    ], { challengeId: "challenge-site", verificationCode: "654321" }));
  });

  it("Resume 파일을 1차 검증하고 유효 PDF는 ADMIN_ACTION으로 교체", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력서" }));
    const input = screen.getByLabelText(/PDF 파일 선택/);

    fireEvent.change(input, { target: { files: [new File(["text"], "resume.txt", { type: "text/plain" })] } });
    expect(screen.getByText("PDF 파일만 선택할 수 있습니다.")).toBeInTheDocument();

    const pdf = new File(["pdf"], "resume-new.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf] } });
    fireEvent.click(screen.getByRole("button", { name: "PDF 교체" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "RESUME_REPLACE",
      targetType: "RESUME",
      targetId: null,
    })));
    submitOtp();
    await waitFor(() => expect(replaceResume).toHaveBeenCalledWith(pdf, {
      challengeId: "challenge-site",
      verificationCode: "654321",
    }));
  });

  it("Site 조회 오류를 traceId와 함께 표시하고 Mock으로 대체하지 않음", async () => {
    vi.mocked(getAdminSite).mockRejectedValue(new ApiError(503, {
      code: "COMMON_INTERNAL_ERROR",
      message: "사이트 데이터를 불러올 수 없습니다.",
      traceId: "trace-site",
      fieldErrors: [],
    }));
    render(<SiteScreen />);

    expect(await screen.findByText("사이트 데이터를 불러올 수 없습니다. (추적 ID: trace-site)")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("김현우")).not.toBeInTheDocument();
  });
});
