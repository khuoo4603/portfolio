import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { SiteData } from "./admin-types";
import { createAdminChallenge } from "./admin-action-api";
import {
  createProfileEntry,
  createTechnology,
  getAdminSite,
  reorderProfileEntriesBatch,
  replacePortfolioTechnologies,
  replaceResume,
  updateProfileEntry,
  updatePortfolioContents,
} from "./admin-site-api";
import SiteScreen from "./site-screen";

function selectOption(label: string, option: string) {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

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
    reorderProfileEntriesBatch: vi.fn(),
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
      { category: "MAIN", contentCode: "HERO_STATEMENT", contentValue: "문제에 맞는 기술과 설계를 선택하고,\n선택과 집중으로 서비스를 완성하는 개발자", updatedAt: UPDATED_AT },
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
    vi.mocked(reorderProfileEntriesBatch).mockReset().mockResolvedValue({ items: [] });
    vi.mocked(replaceResume).mockReset().mockResolvedValue({ fileName: "resume-new.pdf", updatedAt: UPDATED_AT });
  });

  afterEach(() => cleanup());

  it("GET /admin/site DTO를 다섯 관리 영역과 활성 콘텐츠에 매핑", async () => {
    render(<SiteScreen />);

    expect(await screen.findByDisplayValue("김현우")).toBeInTheDocument();
    expect(screen.queryByText("공개 포트폴리오에 표시되는 콘텐츠를 관리합니다.")).not.toBeInTheDocument();
    const surface = screen.getByRole("region", { name: "사이트 관리" });
    expect(within(surface).getByRole("tablist", { name: "사이트 관리 영역" })).toBeInTheDocument();
    expect(within(surface).getByRole("tabpanel")).toContainElement(screen.getByDisplayValue("김현우"));
    expect(siteData().portfolioContents).toHaveLength(15);
    expect(screen.queryByText("COMMON/NAME")).not.toBeInTheDocument();
    expect(screen.queryByText("MAIN/HERO_STATEMENT")).not.toBeInTheDocument();
    expect(screen.getByLabelText("소개 문구")).toHaveValue("문제에 맞는 기술과 설계를 선택하고,\n선택과 집중으로 서비스를 완성하는 개발자");
    expect(screen.queryByText("CONTACT/EMAIL")).not.toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(15);
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.queryByRole("tab", { name: "프로젝트" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    expect(screen.getAllByText("소프트웨어융합전공").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "학력" })).toBeInTheDocument();
    const profileTable = screen.getByRole("table");
    expect(within(profileTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "기간", "제목", "기관 또는 역할", "유형", "상태", "작업",
    ]);
    expect(within(profileTable).queryByRole("columnheader", { name: "순서" })).not.toBeInTheDocument();
    expect(within(profileTable).queryByRole("columnheader", { name: "유형 / 상태" })).not.toBeInTheDocument();
    expect(within(profileTable).getByText("학력").closest("td")).toHaveAttribute("data-label", "유형");
    expect(within(profileTable).getByRole("switch", { name: "소프트웨어융합전공 비노출 전환" }).closest("td")).toHaveAttribute("data-label", "상태");
    expect(within(profileTable).queryByText("유형 / 기간")).not.toBeInTheDocument();
    expect(within(profileTable).queryByText("대표")).not.toBeInTheDocument();
    expect(within(profileTable).queryByText("강조")).not.toBeInTheDocument();
    expect(within(profileTable).queryByText("일반")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "기술스택" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "기술" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "기술스택" }));
    const viewSelector = screen.getByRole("group", { name: "기술 보기" });
    const allHeading = screen.getByRole("heading", { name: "전체 기술 스택" });
    expect(screen.queryByText("프로젝트와 포트폴리오에서 사용할 전체 기술을 관리합니다.")).not.toBeInTheDocument();
    expect(allHeading.compareDocumentPosition(viewSelector) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: "전체 기술 스택" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "보유 기술 스택" })).toBeInTheDocument();
    expect(allHeading).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "보유 기술 스택" })).not.toBeInTheDocument();
    expect(screen.getByText("DATABASE")).toBeInTheDocument();
    expect(screen.getByText("FRONTEND")).toBeInTheDocument();
    const technologiesTable = screen.getByRole("table");
    expect(within(technologiesTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["기술명", "분류", "상태", "작업"]);
    expect(within(technologiesTable).queryByText("/icons/tech/postgresql.svg")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "외부 링크" }));
    expect(screen.getByText("https://github.com/example")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "이력서" }));
    expect(screen.queryByText("현재 파일 1개만 유지하며 등록 또는 교체합니다.")).not.toBeInTheDocument();
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.queryByText(/파일 크기/)).not.toBeInTheDocument();
  });

  it("이력 그룹 순서와 외부 링크 표시 순서를 서버 순서로 정렬", async () => {
    const response = siteData();
    response.profileEntries = [...response.profileEntries].reverse();
    response.externalLinks = [
      { ...response.externalLinks[0], id: 5, name: "Portfolio", displayOrder: 0 },
      response.externalLinks[0],
    ];
    vi.mocked(getAdminSite).mockResolvedValueOnce(response);
    render(<SiteScreen />);

    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    let table = screen.getByRole("table");
    let rows = within(table).getAllByRole("row").slice(1).map((row) => row.textContent ?? "");
    expect(rows.findIndex((row) => row.includes("소프트웨어융합전공"))).toBeLessThan(rows.findIndex((row) => row.includes("플랫폼 개발")));
    expect(rows.findIndex((row) => row.includes("플랫폼 개발"))).toBeLessThan(rows.findIndex((row) => row.includes("개발 커뮤니티 활동")));
    fireEvent.click(screen.getByRole("button", { name: "활동" }));
    rows = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => row.textContent ?? "");
    expect(rows[0]).toContain("개발 커뮤니티 활동");

    fireEvent.click(screen.getByRole("tab", { name: "외부 링크" }));
    table = screen.getByRole("table");
    expect(within(table).queryByRole("columnheader", { name: "순서" })).not.toBeInTheDocument();
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Portfolio");
    expect(within(table).getAllByRole("row")[2]).toHaveTextContent("GitHub");
  });

  it("단일 Site 조회 결과를 ALL과 5개 이력 유형으로 필터링하고 필터 상태에서 수정 가능", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));

    expect(screen.getByRole("heading", { name: "이력" })).toBeInTheDocument();
    const filterGroup = screen.getByRole("group", { name: "이력 유형" });
    expect(within(filterGroup).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "전체", "학력", "경력", "활동", "수상", "자격·교육",
    ]);
    expect(screen.getAllByText("소프트웨어융합전공").length).toBeGreaterThan(0);
    expect(screen.getAllByText("플랫폼 개발").length).toBeGreaterThan(0);

    const cases = [
      ["학력", "소프트웨어융합전공"],
      ["경력", "플랫폼 개발"],
      ["활동", "개발 커뮤니티 활동"],
      ["수상", "프로젝트 우수상"],
      ["자격·교육", "클라우드 교육 수료"],
    ];
    for (const [label, title] of cases) {
      fireEvent.click(within(filterGroup).getByRole("button", { name: label }));
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("row")).toHaveLength(2);
    }

    fireEvent.click(within(filterGroup).getByRole("button", { name: "전체" }));
    expect(screen.getAllByRole("row")).toHaveLength(6);
    fireEvent.click(within(filterGroup).getByRole("button", { name: "활동" }));
    expect(screen.getByRole("button", { name: "개발 커뮤니티 활동 삭제" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "개발 커뮤니티 활동 수정" }));
    expect(screen.getByRole("dialog", { name: "이력 수정" })).toBeInTheDocument();
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

  it("Hero 소개 문구만 변경하면 Legacy Description 없이 HERO_STATEMENT만 저장", async () => {
    render(<SiteScreen />);
    const statement = await screen.findByLabelText("소개 문구");
    fireEvent.change(statement, { target: { value: "변경된 Hero 소개 문구" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({ operation: "PORTFOLIO_CONTENT_UPDATE" })));
    submitOtp();
    await waitFor(() => expect(updatePortfolioContents).toHaveBeenCalledWith([
      { category: "MAIN", contentCode: "HERO_STATEMENT", contentValue: "변경된 Hero 소개 문구" },
    ], { challengeId: "challenge-site", verificationCode: "654321" }));
  });

  it("Profile Editor가 유형별 필드와 라벨을 제공하고 숨겨진 입력값을 보존", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    fireEvent.click(screen.getByRole("button", { name: "항목 추가" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByLabelText("경력명")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("회사·기관")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("담당 역할")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("근무 기간")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("담당 업무")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("주요 성과")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("공개 여부")).toBeChecked();

    fireEvent.change(within(dialog).getByLabelText("경력명"), { target: { value: "새 경력" } });
    fireEvent.change(within(dialog).getByLabelText("담당 역할"), { target: { value: "담당 역할" } });
    fireEvent.change(within(dialog).getByLabelText("주요 성과"), { target: { value: "주요 성과" } });
    selectOption("이력 유형", "수상");
    expect(within(dialog).getByLabelText("수상명")).toHaveValue("새 경력");
    expect(within(dialog).getByLabelText("주최·주관 기관")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("수상 시기")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("수상 설명")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("담당 역할")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("주요 성과")).not.toBeInTheDocument();

    selectOption("이력 유형", "경력");
    expect(within(dialog).getByLabelText("담당 역할")).toHaveValue("담당 역할");
    expect(within(dialog).getByLabelText("주요 성과")).toHaveValue("주요 성과");

    selectOption("이력 유형", "자격·교육");
    expect(within(dialog).getByLabelText("자격·교육명")).toHaveValue("새 경력");
    expect(within(dialog).getByLabelText("발급·교육 기관")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("취득·교육 시기")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("상세 설명")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("담당 역할")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("주요 성과")).not.toBeInTheDocument();
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
      title: "새 경력",
      organization: null,
      role: "담당 역할",
      description: null,
      achievement: "주요 성과",
      enabled: true,
    }, { challengeId: "challenge-site", verificationCode: "654321" }));
  });

  it("이력 전체 순서 관리 모달은 여러 그룹 변경을 Batch 한 번으로 저장", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    const entriesSurface = screen.getByRole("region", { name: "이력" });

    fireEvent.click(within(entriesSurface).getByRole("button", { name: "순서 관리" }));
    const dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    expect(within(dialog).getByRole("heading", { name: "학력" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "경력·활동" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "수상" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "자격·교육" })).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "순서 저장" })).toHaveLength(1);
    expect(within(dialog).getByRole("button", { name: "초기화" })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "플랫폼 개발 아래로" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "순서 저장" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PROFILE_ENTRIES_REORDER",
      targetType: "PROFILE_ENTRY",
      targetId: null,
    })));
    submitOtp();
    await waitFor(() => expect(reorderProfileEntriesBatch).toHaveBeenCalledWith({
      groups: [{ group: "ACTIVITIES", orderedIds: [17, 16], expectedIds: [16, 17] }],
    }, { challengeId: "challenge-site", verificationCode: "654321" }));
  });

  it("이력 순서 초기화는 서버 Snapshot만 복원하고 저장 API를 호출하지 않음", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
    const entriesSurface = screen.getByRole("region", { name: "이력" });
    fireEvent.click(within(entriesSurface).getByRole("button", { name: "순서 관리" }));
    const dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    const activities = within(dialog).getByRole("region", { name: "경력·활동" });
    fireEvent.click(within(activities).getByRole("button", { name: "플랫폼 개발 아래로" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "초기화" }));
    expect(within(activities).getAllByRole("listitem")[0]).toHaveTextContent("플랫폼 개발");
    expect(reorderProfileEntriesBatch).not.toHaveBeenCalled();
    expect(getAdminSite).toHaveBeenCalledOnce();
  });

  it("외부 링크 순서 초기화는 서버 Snapshot만 복원하고 재조회하지 않음", async () => {
    const response = siteData();
    response.externalLinks = [
      { ...response.externalLinks[0], id: 5, name: "Portfolio", displayOrder: 0 },
      response.externalLinks[0],
    ];
    vi.mocked(getAdminSite).mockResolvedValueOnce(response);
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "외부 링크" }));
    fireEvent.click(screen.getByRole("button", { name: "순서 관리" }));
    const dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Portfolio 아래로" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "초기화" }));
    expect(within(dialog).getAllByRole("listitem")[0]).toHaveTextContent("Portfolio");
    expect(getAdminSite).toHaveBeenCalledOnce();
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
      enabled: false,
    }, { challengeId: "challenge-site", verificationCode: "654321" }));
  });

  it("Technology Editor가 6개 Category와 iconUrl만 사용", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "기술스택" }));
    fireEvent.click(screen.getByRole("button", { name: "기술 추가" }));
    const dialog = screen.getByRole("dialog");

    fireEvent.click(within(dialog).getByRole("combobox", { name: "기술 분류" }));
    expect(screen.getAllByRole("option")).toHaveLength(6);
    expect(screen.getByRole("option", { name: "DATABASE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "FRONTEND" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("combobox", { name: "기술 분류" }));
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

  it("보유 기술 스택 Draft가 View 전환 뒤에도 유지되고 별도 PUT Challenge로 저장", async () => {
    render(<SiteScreen />);
    await screen.findByDisplayValue("김현우");
    fireEvent.click(screen.getByRole("tab", { name: "기술스택" }));
    fireEvent.click(screen.getByRole("button", { name: "보유 기술 스택" }));
    const section = screen.getByRole("region", { name: "보유 기술 스택" });
    expect(within(section).getByRole("group", { name: "기술 추가" })).toContainElement(screen.getByLabelText("보유 기술 선택"));
    const list = within(section).getByRole("list", { name: "표시 순서 관리" });
    expect(within(list).getByRole("listitem")).toHaveTextContent("1PostgreSQL");
    selectOption("보유 기술 선택", "Next.js");
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.click(screen.getByRole("button", { name: "전체 기술 스택" }));
    fireEvent.click(screen.getByRole("button", { name: "보유 기술 스택" }));
    expect(within(screen.getByRole("list", { name: "표시 순서 관리" })).getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "보유 기술 저장" }));

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
