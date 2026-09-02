import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminChallenge } from "./admin-action-api";
import { getAdminProject, saveProject } from "./admin-project-api";
import { getAdminSite } from "./admin-site-api";
import type { ProjectDetail, SiteData } from "./admin-types";
import ProjectEditorScreen from "./project-editor-screen";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/app/projects/kyvc/project-architecture", () => ({ default: () => <div>Architecture Preview</div> }));
vi.mock("@/app/projects/kyvc/project-media-carousel", () => ({ default: () => <div>Carousel Preview</div> }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn() };
});
vi.mock("./admin-project-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-project-api")>();
  return { ...actual, getAdminProject: vi.fn(), saveProject: vi.fn() };
});
vi.mock("./admin-site-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-site-api")>();
  return { ...actual, getAdminSite: vi.fn() };
});

const UPDATED_AT = "2026-09-02T12:00:00+09:00";
const detail: ProjectDetail = {
  project: {
    id: 12,
    slug: "project-one",
    name: "Project One",
    year: null,
    tagline: null,
    description: null,
    cardRole: null,
    summary: null,
    detailRole: null,
    startedAt: null,
    endedAt: null,
    teamSize: null,
    thumbnailUrl: "/api/v1/public/projects/media/thumbnail.webp",
    displayOrder: 1,
    enabled: false,
    updatedAt: UPDATED_AT,
  },
  technologies: [{ technologyId: 3, name: "Java", category: "LANGUAGE", iconUrl: null, showOnCard: true, highlighted: true, displayOrder: 0 }],
  content: {
    results: [{ title: "Result", description: "Result description" }],
    background: [{ title: null, body: "Background body" }],
    features: [{ title: "Feature", description: "Feature description" }],
    development: [{ title: "Backend", items: ["API"] }],
    architecture: { notes: [{ title: "Runtime", body: "Docker" }] },
    engineering: [{ title: "Issue", summary: null, problem: "Problem", solution: "Solution", result: "Result" }],
  },
  architectureImageUrl: "/api/v1/admin/media/projects/12/architecture",
  media: [
    { id: 8, imageUrl: "/api/v1/public/projects/media/carousel.webp", label: "Carousel", altText: "Carousel image", displayOrder: 0 },
  ],
};

const site: SiteData = {
  portfolioContents: [],
  profileEntries: [],
  technologyMaster: [
    { id: 3, name: "Java", category: "LANGUAGE", iconUrl: null, enabled: false, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
    { id: 4, name: "React", category: "FRONTEND", iconUrl: null, enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
    { id: 5, name: "Legacy", category: "BACKEND", iconUrl: null, enabled: false, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
  ],
  portfolioTechnologies: [],
  externalLinks: [],
  resume: null,
};

const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
const createObjectUrl = vi.fn();
const revokeObjectUrl = vi.fn();

function submitOtp(code = "654321") {
  fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
    clipboardData: { getData: () => code },
  });
  fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));
}

async function renderEditor() {
  render(<ProjectEditorScreen projectId={12} />);
  await screen.findByRole("region", { name: "기본 정보 편집" });
  return screen.getByRole("navigation", { name: "Project Editor Section" });
}

describe("Preview-first Project Editor", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    vi.mocked(getAdminProject).mockReset().mockResolvedValue(detail);
    vi.mocked(getAdminSite).mockReset().mockResolvedValue(site);
    vi.mocked(saveProject).mockReset().mockResolvedValue(detail);
    vi.mocked(createAdminChallenge).mockReset().mockResolvedValue({ challengeId: "challenge-project", expiresAt: "2099-09-02T12:00:00+09:00" });
    createObjectUrl.mockReset();
    revokeObjectUrl.mockReset();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
  });

  afterEach(cleanup);

  afterAll(() => {
    if (originalCreateObjectUrl) Object.defineProperty(URL, "createObjectURL", originalCreateObjectUrl);
    else Reflect.deleteProperty(URL, "createObjectURL");
    if (originalRevokeObjectUrl) Object.defineProperty(URL, "revokeObjectURL", originalRevokeObjectUrl);
    else Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("nullable 기본정보와 고정 6개 Content를 포함한 9개 Section을 안전하게 편집", async () => {
    const sectionNav = await renderEditor();

    expect(within(sectionNav).getAllByRole("button")).toHaveLength(9);
    expect(screen.getByLabelText("Tagline")).toHaveValue("");
    expect(screen.getByLabelText("Year")).toHaveValue(null);
    expect(screen.getByRole("button", { name: /편집 모드/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("article", { name: "Project Detail Preview" })).not.toBeInTheDocument();

    const contentSections = [
      ["성과", "성과 편집"],
      ["문제 배경", "문제 배경 편집"],
      ["주요 기능", "주요 기능 편집"],
      ["직접 담당한 개발 영역", "직접 담당한 개발 영역 편집"],
      ["아키텍처", "아키텍처 편집"],
      ["기술적 문제 해결", "기술적 문제 해결 편집"],
    ];
    for (const [button, region] of contentSections) {
      fireEvent.click(within(sectionNav).getByRole("button", { name: new RegExp(button) }));
      expect(screen.getByRole("region", { name: region })).toBeInTheDocument();
    }
  });

  it("Card 노출 UI 없이 기존 showOnCard를 보존하고 Highlighted Switch를 Local Draft에 반영", async () => {
    const sectionNav = await renderEditor();
    fireEvent.click(within(sectionNav).getByRole("button", { name: /기술$/ }));

    const technologyPanel = screen.getByRole("region", { name: "기술 편집" });
    expect(within(technologyPanel).queryByText("Card 노출")).not.toBeInTheDocument();
    expect(within(technologyPanel).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("기존 비활성 연결", { exact: false })).toBeInTheDocument();
    const select = screen.getByLabelText("프로젝트 기술 선택");
    expect(within(select).getByRole("option", { name: "React" })).toBeEnabled();
    expect(within(select).getByRole("option", { name: "Legacy · 비활성" })).toBeDisabled();

    const highlighted = within(technologyPanel).getByRole("switch", { name: "Java Highlighted OFF 전환" });
    expect(highlighted).toHaveAttribute("aria-checked", "true");
    fireEvent.click(highlighted);
    expect(within(technologyPanel).getByRole("switch", { name: "Java Highlighted ON 전환" })).toHaveAttribute("aria-checked", "false");
    expect(saveProject).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeEnabled());
    submitOtp();
    await waitFor(() => expect(saveProject).toHaveBeenCalledTimes(1));
    expect(vi.mocked(saveProject).mock.calls[0][1].metadata.technologies[0]).toEqual({
      technologyId: 3,
      showOnCard: true,
      highlighted: false,
      displayOrder: 0,
    });
  });

  it("편집·미리보기 모드 전환 시 API 재조회 없이 Local Draft를 유지", async () => {
    await renderEditor();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Local Draft Project" } });

    fireEvent.click(screen.getByRole("button", { name: /미리보기 모드/ }));
    const preview = screen.getByRole("article", { name: "Project Detail Preview" });
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByRole("heading", { name: "Local Draft Project" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "기본 정보 편집" })).not.toBeInTheDocument();
    expect(saveProject).not.toHaveBeenCalled();
    expect(getAdminProject).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /편집 모드/ }));
    expect(screen.getByLabelText("Name")).toHaveValue("Local Draft Project");
    expect(getAdminProject).toHaveBeenCalledTimes(1);
  });

  it("Architecture Image Local Preview와 Notes 추가·순서 변경·삭제를 Local Draft에서 처리", async () => {
    createObjectUrl.mockReturnValue("blob:architecture-1");
    const sectionNav = await renderEditor();
    fireEvent.click(within(sectionNav).getByRole("button", { name: /아키텍처/ }));

    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
    expect(screen.getByText("현재 상태: KEEP")).toBeInTheDocument();
    fireEvent.error(screen.getByRole("img", { name: "Architecture Preview" }));
    expect(screen.getByText("Architecture Image 없음")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("파일 선택"), {
      target: { files: [new File(["architecture"], "architecture.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(screen.getByRole("img", { name: "Architecture Preview" })).toHaveAttribute("src", "blob:architecture-1"));
    expect(screen.getByText("현재 상태: UPLOAD")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "항목 추가" }));
    fireEvent.change(screen.getByLabelText("Note 2 Title"), { target: { value: "Delivery" } });
    fireEvent.change(screen.getByLabelText("Note 2 Body"), { target: { value: "GitHub Actions" } });
    fireEvent.click(screen.getByRole("button", { name: "Architecture Note 2 위로" }));
    expect(screen.getByLabelText("Note 1 Title")).toHaveValue("Delivery");
    expect(screen.getByLabelText("Note 1 Body")).toHaveValue("GitHub Actions");
    fireEvent.click(screen.getByRole("button", { name: "Architecture Note 1 삭제" }));
    expect(screen.queryByDisplayValue("Delivery")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("현재 상태: REMOVE")).toBeInTheDocument();
    expect(screen.getByText("Architecture Image 없음")).toBeInTheDocument();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:architecture-1");
    expect(saveProject).not.toHaveBeenCalled();
  });

  it("입력 변경은 Local Draft에만 반영하고 Save 한 번에 PROJECT_UPDATE·재조회 수행", async () => {
    let resolveChallenge!: (value: { challengeId: string; expiresAt: string }) => void;
    let resolveSave!: (value: ProjectDetail) => void;
    vi.mocked(createAdminChallenge).mockImplementation(() => new Promise((resolve) => { resolveChallenge = resolve; }));
    vi.mocked(saveProject).mockImplementation(() => new Promise((resolve) => { resolveSave = resolve; }));
    vi.mocked(getAdminProject)
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce({ ...detail, project: { ...detail.project, name: "Reloaded Project" } });
    await renderEditor();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Edited Project" } });
    expect(saveProject).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(screen.getByRole("dialog", { name: "관리자 이메일 재인증" })).toBeInTheDocument();
    expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeDisabled();
    expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({ operation: "PROJECT_UPDATE", targetType: "PROJECT", targetId: "12" }));

    await act(async () => resolveChallenge({ challengeId: "challenge-project", expiresAt: "2099-09-02T12:00:00+09:00" }));
    await waitFor(() => expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeEnabled());
    submitOtp();
    await waitFor(() => expect(saveProject).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeDisabled();
    const saveInput = vi.mocked(saveProject).mock.calls[0][1];
    expect(saveInput.metadata.project.name).toBe("Edited Project");
    expect(saveInput.metadata.content.background[0]).toEqual({ title: null, body: "Background body" });

    await act(async () => resolveSave(detail));
    await waitFor(() => expect(getAdminProject).toHaveBeenCalledTimes(2));
    expect(await screen.findByDisplayValue("Reloaded Project")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("저장 실패 시 Local Draft와 Preview를 유지", async () => {
    vi.mocked(saveProject).mockRejectedValue(new Error("save failed"));
    await renderEditor();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Unsaved Project" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeEnabled());
    submitOtp();

    await waitFor(() => expect(saveProject).toHaveBeenCalledTimes(1));
    expect(screen.getByDisplayValue("Unsaved Project")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /미리보기 모드/ }));
    expect(within(screen.getByRole("article", { name: "Project Detail Preview" })).getByRole("heading", { name: "Unsaved Project" })).toBeInTheDocument();
    expect(getAdminProject).toHaveBeenCalledTimes(1);
  });

  it("Thumbnail 교체·제거와 신규 Media의 Object URL을 즉시 회수", async () => {
    createObjectUrl.mockReturnValueOnce("blob:thumbnail-1").mockReturnValueOnce("blob:thumbnail-2").mockReturnValueOnce("blob:carousel-1");
    const { unmount } = render(<ProjectEditorScreen projectId={12} />);
    await screen.findByRole("region", { name: "기본 정보 편집" });
    const sectionNav = screen.getByRole("navigation", { name: "Project Editor Section" });
    fireEvent.click(within(sectionNav).getByRole("button", { name: /미디어/ }));

    const thumbnailInput = screen.getByLabelText("파일 선택");
    fireEvent.change(thumbnailInput, { target: { files: [new File(["one"], "one.webp", { type: "image/webp" })] } });
    fireEvent.change(thumbnailInput, { target: { files: [new File(["two"], "two.webp", { type: "image/webp" })] } });
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:thumbnail-1");

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:thumbnail-2");

    fireEvent.change(screen.getAllByLabelText("이미지 추가")[0], { target: { files: [new File(["carousel"], "carousel.webp", { type: "image/webp" })] } });
    expect(createObjectUrl).toHaveBeenCalledTimes(3);
    unmount();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:carousel-1");
  });
});
