import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectDetail, ProjectSummary, Technology } from "./admin-types";
import { createAdminChallenge } from "./admin-action-api";
import {
  createProject,
  deleteProject,
  getAdminProject,
  replaceProjectContent,
  replaceProjectMedia,
  replaceProjectTechnologies,
  updateProjectStatus,
} from "./admin-project-api";
import ProjectManagement from "./project-management";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn() };
});
vi.mock("./admin-project-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-project-api")>();
  return {
    ...actual,
    getAdminProject: vi.fn(), createProject: vi.fn(), updateProject: vi.fn(),
    updateProjectStatus: vi.fn(), deleteProject: vi.fn(), replaceProjectContent: vi.fn(),
    replaceProjectTechnologies: vi.fn(), replaceProjectMedia: vi.fn(),
  };
});

const UPDATED_AT = "2026-09-01T12:00:00+09:00";
const projects: ProjectSummary[] = [{ id: 12, slug: "project-one", name: "Project One", year: 2026, tagline: "Tagline", cardRole: "Backend", thumbnailUrl: null, displayOrder: 1, enabled: true, updatedAt: UPDATED_AT }];
const master: Technology[] = [
  { id: 3, name: "Java", category: "LANGUAGE", iconUrl: null, enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
  { id: 4, name: "Spring", category: "BACKEND", iconUrl: null, enabled: true, createdAt: UPDATED_AT, updatedAt: UPDATED_AT },
];
const detail: ProjectDetail = {
  project: { ...projects[0], description: "Card description", summary: "Summary", detailRole: "Backend", startedAt: "2026-01-01", endedAt: null, teamSize: 3 },
  technologies: [{ technologyId: 3, name: "Java", category: "LANGUAGE", iconUrl: null, showOnCard: true, highlighted: true, displayOrder: 1 }],
  content: {
    results: [{ title: "Result" }], background: ["Background"], features: [{ title: "Feature" }],
    development: [{ title: "Backend", items: ["API"] }],
    architecture: { clients: ["Web"], services: ["API"], dataAndExternal: ["DB"], runtime: ["Docker"], delivery: ["CI"] },
    engineering: [{ title: "Issue", summary: "Summary", problem: "Problem", solution: "Solution", result: "Result" }],
  },
  media: [{ id: 8, imageUrl: "/images/old.webp", label: "Old", altText: "Old image", displayOrder: 1 }],
};

function submitOtp() {
  fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), { clipboardData: { getData: () => "654321" } });
  fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));
}

describe("Project 실제 관리", () => {
  beforeEach(() => {
    vi.mocked(createAdminChallenge).mockReset().mockResolvedValue({ challengeId: "challenge-project", expiresAt: "2099-01-01T00:00:00+09:00" });
    vi.mocked(getAdminProject).mockReset().mockResolvedValue(detail);
    vi.mocked(createProject).mockReset().mockResolvedValue({ ...detail.project, createdAt: UPDATED_AT });
    vi.mocked(updateProjectStatus).mockReset().mockResolvedValue({ id: 12, enabled: false, updatedAt: UPDATED_AT });
    vi.mocked(deleteProject).mockReset().mockResolvedValue(undefined);
    vi.mocked(replaceProjectContent).mockReset().mockResolvedValue({ ...detail.content, updatedAt: UPDATED_AT });
    vi.mocked(replaceProjectTechnologies).mockReset().mockResolvedValue({ items: [] });
    vi.mocked(replaceProjectMedia).mockReset().mockResolvedValue({ items: [] });
  });
  afterEach(cleanup);

  it("Summary가 아닌 projects.id 상세 API로 구조화 Editor를 구성", async () => {
    render(<ProjectManagement projects={projects} technologyMaster={master} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "상세 편집" }));
    expect(await screen.findByDisplayValue("Card description")).toBeInTheDocument();
    expect(getAdminProject).toHaveBeenCalledWith(12);
    expect(screen.getByText("고정 6개 Content")).toBeInTheDocument();
    expect(screen.getByText("Project Technologies")).toBeInTheDocument();
    expect(screen.getByText("Project Media")).toBeInTheDocument();
    expect(screen.queryByLabelText(/JSON/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/파일/)).not.toBeInTheDocument();
  });

  it("Backend의 빈 architecture 객체를 5개 빈 노드 목록으로 안전하게 표시", async () => {
    vi.mocked(getAdminProject).mockResolvedValueOnce({
      ...detail,
      content: {
        ...detail.content,
        architecture: {} as ProjectDetail["content"]["architecture"],
      },
    });
    render(<ProjectManagement projects={projects} technologyMaster={master} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "상세 편집" }));
    await screen.findByDisplayValue("Card description");
    expect(screen.getByLabelText("clients — 한 줄에 하나")).toHaveValue("");
    expect(screen.getByLabelText("delivery — 한 줄에 하나")).toHaveValue("");
  });

  it("Project 상태와 삭제가 서로 다른 operation을 사용", async () => {
    const refresh = vi.fn();
    render(<ProjectManagement projects={projects} technologyMaster={master} onRefresh={refresh} />);
    fireEvent.click(screen.getByRole("switch", { name: "Project One 프로젝트 비공개 전환" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenLastCalledWith(expect.objectContaining({ operation: "PROJECT_STATUS_UPDATE", targetType: "PROJECT", targetId: "12" })));
    submitOtp();
    await waitFor(() => expect(updateProjectStatus).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "상세 편집" }));
    await screen.findByDisplayValue("Card description");
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenLastCalledWith(expect.objectContaining({ operation: "PROJECT_DELETE", targetType: "PROJECT", targetId: "12" })));
  });

  it("Create DTO를 PROJECT_CREATE/null Challenge에 연결", async () => {
    render(<ProjectManagement projects={projects} technologyMaster={master} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "프로젝트 추가" }));
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "new-project" } });
    fireEvent.change(screen.getByLabelText("프로젝트명"), { target: { value: "New Project" } });
    fireEvent.change(screen.getByLabelText("한 줄 설명"), { target: { value: "New tagline" } });
    fireEvent.change(screen.getByLabelText("카드 설명"), { target: { value: "New description" } });
    fireEvent.change(screen.getByLabelText("카드 역할"), { target: { value: "Backend" } });
    fireEvent.click(screen.getByRole("button", { name: "프로젝트 생성" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({ operation: "PROJECT_CREATE", targetType: "PROJECT", targetId: null })));
    submitOtp();
    await waitFor(() => expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ slug: "new-project", name: "New Project" }), { challengeId: "challenge-project", verificationCode: "654321" }));
  });

  it("Content·Technology·Media 저장마다 독립 PROJECT_UPDATE Challenge를 발급", async () => {
    render(<ProjectManagement projects={projects} technologyMaster={master} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "상세 편집" }));
    await screen.findByDisplayValue("Card description");

    fireEvent.change(screen.getByLabelText("성과 1"), { target: { value: "Updated result" } });
    fireEvent.click(screen.getByRole("button", { name: "Content 저장" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledTimes(1));
    submitOtp();
    await waitFor(() => expect(replaceProjectContent).toHaveBeenCalledWith(12, expect.objectContaining({ results: [{ title: "Updated result" }] }), expect.anything()));
    await screen.findByDisplayValue("Card description");

    fireEvent.change(screen.getByLabelText("프로젝트 기술 선택"), { target: { value: "4" } });
    const technologySection = screen.getByRole("region", { name: "Project Technologies" });
    fireEvent.click(within(technologySection).getByRole("button", { name: "추가" }));
    fireEvent.click(within(technologySection).getByRole("button", { name: "기술 구성 저장" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledTimes(2));
    submitOtp();
    await waitFor(() => expect(replaceProjectTechnologies).toHaveBeenCalledWith(12, expect.arrayContaining([expect.objectContaining({ technologyId: 4, showOnCard: false, highlighted: false, displayOrder: 2 })]), expect.anything()));
    await screen.findByDisplayValue("Card description");

    fireEvent.change(screen.getByDisplayValue("/images/old.webp"), { target: { value: "/images/new.webp" } });
    fireEvent.click(screen.getByRole("button", { name: "Media 저장" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledTimes(3));
    expect(createAdminChallenge).toHaveBeenLastCalledWith(expect.objectContaining({ operation: "PROJECT_UPDATE", targetType: "PROJECT", targetId: "12" }));
    submitOtp();
    await waitFor(() => expect(replaceProjectMedia).toHaveBeenCalledWith(12, [expect.objectContaining({ imageUrl: "/images/new.webp" })], expect.anything()));
  });
});
