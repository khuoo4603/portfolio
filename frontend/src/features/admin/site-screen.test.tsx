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
  updateProfileEntry,
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
      { category: "COMMON", contentCode: "NAME", contentValue: name, updatedAt: UPDATED_AT },
      { category: "COMMON", contentCode: "ENGLISH_NAME", contentValue: "KIM HYUNWOO", updatedAt: UPDATED_AT },
      { category: "COMMON", contentCode: "POSITION", contentValue: "BACKEND / INFRA DEVELOPER", updatedAt: UPDATED_AT },
      { category: "COMMON", contentCode: "AFFILIATION", contentValue: "성공회대학교", updatedAt: UPDATED_AT },
      { category: "MAIN", contentCode: "HERO_STATEMENT", contentValue: "Backend 개발부터 운영까지", updatedAt: UPDATED_AT },
      { category: "MAIN", contentCode: "HERO_DESCRIPTION", contentValue: "서비스 설계와 운영", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "ABOUT_STATEMENT", contentValue: "문제에 맞는 기술 선택", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "ABOUT_DESCRIPTION_1", contentValue: "소개 설명 1", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "ABOUT_DESCRIPTION_2", contentValue: "소개 설명 2", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_1_TITLE", contentValue: "문서화의 가치", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_1_DESCRIPTION", contentValue: "설계와 선택의 이유 기록", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_2_TITLE", contentValue: "덜어냄의 미학", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_2_DESCRIPTION", contentValue: "불필요한 복잡성 제거", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_3_TITLE", contentValue: "운영까지", updatedAt: UPDATED_AT },
      { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_3_DESCRIPTION", contentValue: "지속 운영 가능한 상태", updatedAt: UPDATED_AT },
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
      displayOrder: 1,
      enabled: true,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    }, {
      id: 16,
      entryType: "EXPERIENCE",
      periodText: "2025.01 — 현재",
      title: "플랫폼 개발",
      organization: "포트폴리오 팀",
      role: "Backend",
      description: null,
      achievement: null,
      displayOrder: 2,
      enabled: true,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    }, {
      id: 17,
      entryType: "ACTIVITY",
      periodText: "2024.03 — 2024.12",
      title: "개발 커뮤니티 활동",
      organization: "Community",
      role: null,
      description: null,
      achievement: null,
      displayOrder: 3,
      enabled: true,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    }, {
      id: 18,
      entryType: "AWARD",
      periodText: "2024.11",
      title: "프로젝트 우수상",
      organization: "성공회대학교",
      role: null,
      description: null,
      achievement: "우수상",
      displayOrder: 4,
      enabled: true,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    }, {
      id: 19,
      entryType: "CERTIFICATE",
      periodText: "2025.02",
      title: "클라우드 교육 수료",
      organization: "교육 기관",
      role: null,
      description: null,
      achievement: "수료",
      displayOrder: 5,
      enabled: true,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT,
    }],
    technologyMaster: [
      { id: 7, name: "PostgreSQL", category: "DATABASE", iconUrl: "/icons/tech/postgresql.svg", enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
      { id: 8, name: "Next.js", category: "FRONTEND", iconUrl: "/icons/tech/nextjs.svg", enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
    ],
    portfolioTechnologies: [{ technologyId: 7, displayOrder: 1 }],
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
    vi.mocked(updateProfileEntry).mockReset().mockResolvedValue(siteData().profileEntries[0]);
    vi.mocked(createTechnology).mockReset().mockResolvedValue(siteData().technologyMaster[0]);
    vi.mocked(replacePortfolioTechnologies).mockReset().mockResolvedValue({ items: [] });
    vi.mocked(replaceResume).mockReset().mockResolvedValue({ fileName: "resume-new.pdf", updatedAt: UPDATED_AT });
  });

  afterEach(() => cleanup());

  it("GET /admin/site 실제 DTO를 다섯 관리 영역과 16개 콘텐츠 Slot에 매핑", async () => {
    render(<SiteScreen />);

    expect(await screen.findByDisplayValue("김현우")).toBeInTheDocument();
    expect(siteData().portfolioContents).toHaveLength(16);
    expect(screen.getByText("COMMON/NAME")).toBeInTheDocument();
    expect(screen.getByText("MAIN/HERO_STATEMENT")).toBeInTheDocument();
    expect(screen.getByDisplayValue("문제에 맞는 기술 선택")).toBeInTheDocument();
    expect(screen.getByText("CONTACT/EMAIL")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(16);
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.queryByRole("tab", { name: "프로젝트" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    expect(screen.getByText("소프트웨어융합전공")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "학력" })).toBeInTheDocument();
    const profileTable = screen.getByRole("table");
    expect(within(profileTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "항목", "기간", "순서", "상태", "작업",
    ]);
    expect(within(profileTable).queryByText("유형 / 기간")).not.toBeInTheDocument();
    expect(within(profileTable).queryByText("대표")).not.toBeInTheDocument();
    expect(within(profileTable).queryByText("강조")).not.toBeInTheDocument();
    expect(within(profileTable).queryByText("일반")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "기술" }));
    expect(screen.getByText("DATABASE")).toBeInTheDocument();
    expect(screen.getByText("FRONTEND")).toBeInTheDocument();
    expect(screen.getByText("/icons/tech/postgresql.svg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "외부 링크" }));
    expect(screen.getByText("https://github.com/example")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "이력서" }));
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.queryByText(/파일 크기/)).not.toBeInTheDocument();
  });

  it("단일 Site 조회 결과를 ALL과 5개 이력 유형으로 필터링하고 필터 상태에서 수정 가능", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));

    const filterGroup = screen.getByRole("group", { name: "이력 유형" });
    expect(within(filterGroup).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "전체", "학력", "경력", "활동", "수상", "자격·교육",
    ]);
    expect(screen.getByText("소프트웨어융합전공")).toBeInTheDocument();
    expect(screen.getByText("플랫폼 개발")).toBeInTheDocument();

    const cases = [
      ["학력", "소프트웨어융합전공"],
      ["경력", "플랫폼 개발"],
      ["활동", "개발 커뮤니티 활동"],
      ["수상", "프로젝트 우수상"],
      ["자격·교육", "클라우드 교육 수료"],
    ];
    for (const [label, title] of cases) {
      fireEvent.click(within(filterGroup).getByRole("button", { name: label }));
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(2);
    }

    fireEvent.click(within(filterGroup).getByRole("button", { name: "전체" }));
    expect(screen.getAllByRole("row")).toHaveLength(6);
    fireEvent.click(within(filterGroup).getByRole("button", { name: "활동" }));
    fireEvent.click(screen.getByRole("button", { name: "개발 커뮤니티 활동 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    expect(screen.getByRole("dialog", { name: "프로필 항목 수정" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("개발 커뮤니티 활동")).toBeInTheDocument();
    expect(getAdminSite).toHaveBeenCalledTimes(1);
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

  it("Profile Editor가 자격·교육과 enabled만 제공하고 featured 없이 Create Challenge를 실행", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    fireEvent.click(screen.getByRole("button", { name: "항목 추가" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("option", { name: "학력" })).toHaveValue("EDUCATION");
    expect(within(dialog).getByRole("option", { name: "자격·교육" })).toHaveValue("CERTIFICATE");
    expect(within(dialog).getByLabelText("노출 ON")).toBeChecked();
    expect(within(dialog).queryByLabelText("대표/강조")).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("유형"), { target: { value: "CERTIFICATE" } });
    fireEvent.change(within(dialog).getByLabelText("제목"), { target: { value: "새 자격·교육" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PROFILE_ENTRY_CREATE",
      targetType: "PROFILE_ENTRY",
      targetId: null,
    })));
    submitOtp();
    await waitFor(() => expect(createProfileEntry).toHaveBeenCalledWith({
      entryType: "CERTIFICATE",
      periodText: null,
      title: "새 자격·교육",
      organization: null,
      role: null,
      description: null,
      achievement: null,
      displayOrder: 0,
      enabled: true,
    }, { challengeId: "challenge-site", verificationCode: "654321" }));
  });

  it("Profile 노출 ON/OFF를 featured 없이 Update Challenge로 전달", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    fireEvent.click(screen.getByRole("switch", { name: "소프트웨어융합전공 비노출 전환" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PROFILE_ENTRY_UPDATE",
      targetType: "PROFILE_ENTRY",
      targetId: "15",
    })));
    submitOtp();
    await waitFor(() => expect(updateProfileEntry).toHaveBeenCalledWith(15, {
      entryType: "EDUCATION",
      periodText: "2023.03 — 현재",
      title: "소프트웨어융합전공",
      organization: "성공회대학교",
      role: null,
      description: null,
      achievement: "재학",
      displayOrder: 1,
      enabled: false,
    }, { challengeId: "challenge-site", verificationCode: "654321" }));
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
