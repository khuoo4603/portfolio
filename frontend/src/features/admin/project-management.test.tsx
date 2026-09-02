import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminChallenge } from "./admin-action-api";
import {
  createProject,
  deleteProject,
  getAdminProjects,
  updateProjectStatus,
} from "./admin-project-api";
import type { ProjectSummary } from "./admin-types";
import ProjectManagement from "./project-management";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn() };
});
vi.mock("./admin-project-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-project-api")>();
  return {
    ...actual,
    getAdminProjects: vi.fn(),
    createProject: vi.fn(),
    updateProjectStatus: vi.fn(),
    deleteProject: vi.fn(),
  };
});

const UPDATED_AT = "2026-09-02T12:00:00+09:00";
const projects: ProjectSummary[] = [{
  id: 12,
  slug: "project-one",
  name: "Project One",
  year: 2026,
  thumbnailUrl: "/api/v1/public/projects/media/thumbnail.webp",
  displayOrder: 1,
  enabled: true,
  updatedAt: UPDATED_AT,
}];

function submitOtp(code = "654321") {
  fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
    clipboardData: { getData: () => code },
  });
  fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));
}

describe("Project 목록 관리", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    vi.mocked(getAdminProjects).mockReset().mockResolvedValue({ items: projects });
    vi.mocked(createProject).mockReset().mockResolvedValue({ id: 31, name: "New Project", slug: "new-project", enabled: false, displayOrder: 2, createdAt: UPDATED_AT });
    vi.mocked(updateProjectStatus).mockReset().mockResolvedValue({ id: 12, enabled: false, updatedAt: UPDATED_AT });
    vi.mocked(deleteProject).mockReset().mockResolvedValue(undefined);
    vi.mocked(createAdminChallenge).mockReset().mockResolvedValue({ challengeId: "challenge-project", expiresAt: "2099-09-02T12:00:00+09:00" });
  });

  afterEach(cleanup);

  it("Thumbnail·Name·Slug·Year·Order·Status·Updated At·Actions를 표로 표시", async () => {
    render(<ProjectManagement />);

    const table = await screen.findByRole("table");
    for (const heading of ["Thumbnail", "Name / Slug", "Year", "Order", "Status", "Updated At", "Actions"]) {
      expect(within(table).getByRole("columnheader", { name: heading })).toBeInTheDocument();
    }
    expect(within(table).getByText("Project One")).toBeInTheDocument();
    expect(within(table).getByText("/projects/project-one")).toBeInTheDocument();
    expect(within(table).getByText("공개")).toBeInTheDocument();

    fireEvent.click(within(table).getByRole("button", { name: "Project One 편집" }));
    expect(navigation.push).toHaveBeenCalledWith("/admin/projects/12/edit");
  });

  it("Name·Slug만 입력하고 PROJECT_CREATE 후 Editor로 이동", async () => {
    render(<ProjectManagement />);
    await screen.findByText("Project One");

    fireEvent.click(screen.getByRole("button", { name: "새 프로젝트" }));
    const dialog = screen.getByRole("dialog", { name: "새 프로젝트" });
    const fields = within(dialog).getAllByRole("textbox");
    expect(fields).toHaveLength(2);
    fireEvent.change(fields[0], { target: { value: "New Project" } });
    fireEvent.change(fields[1], { target: { value: "new-project" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "프로젝트 생성" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PROJECT_CREATE",
      targetType: "PROJECT",
      targetId: null,
    })));
    submitOtp();
    await waitFor(() => expect(createProject).toHaveBeenCalledWith(
      { name: "New Project", slug: "new-project" },
      { challengeId: "challenge-project", verificationCode: "654321" },
    ));
    expect(navigation.push).toHaveBeenCalledWith("/admin/projects/31/edit");
  });

  it("목록 Switch를 PROJECT_STATUS_UPDATE 한 번으로 변경하고 재조회", async () => {
    render(<ProjectManagement />);
    fireEvent.click(await screen.findByRole("switch", { name: "Project One 프로젝트 비공개 전환" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PROJECT_STATUS_UPDATE",
      targetType: "PROJECT",
      targetId: "12",
    })));
    submitOtp();
    await waitFor(() => expect(updateProjectStatus).toHaveBeenCalledTimes(1));
    expect(updateProjectStatus).toHaveBeenCalledWith(12, false, expect.anything());
    await waitFor(() => expect(getAdminProjects).toHaveBeenCalledTimes(2));
  });

  it("프로젝트명을 확인한 뒤 PROJECT_DELETE를 수행하고 재조회", async () => {
    render(<ProjectManagement />);
    fireEvent.click(await screen.findByRole("button", { name: "Project One 삭제" }));

    const dialog = screen.getByRole("dialog", { name: "프로젝트 삭제" });
    expect(within(dialog).getByText("Project One")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "삭제 계속" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "PROJECT_DELETE",
      targetType: "PROJECT",
      targetId: "12",
    })));
    submitOtp();
    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith(12, expect.anything()));
    await waitFor(() => expect(getAdminProjects).toHaveBeenCalledTimes(2));
  });
});
