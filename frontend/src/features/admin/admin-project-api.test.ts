import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import type { ProjectSaveInput } from "./admin-types";
import {
  createProject,
  deleteProject,
  getAdminProject,
  getAdminProjects,
  projectActionBindings,
  saveProject,
  updateProjectStatus,
} from "./admin-project-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

const verification = { challengeId: "challenge-project", verificationCode: "654321" };
const headers = {
  "X-Admin-Challenge-Id": "challenge-project",
  "X-Admin-Verification-Code": "654321",
};

const saveInput: ProjectSaveInput = {
  metadata: {
    project: {
      slug: "project-one",
      name: "Project One",
      year: 2026,
      tagline: null,
      description: null,
      cardRole: null,
      summary: null,
      detailRole: null,
      startedAt: null,
      endedAt: null,
      teamSize: null,
      displayOrder: 1,
    },
    content: {
      results: [{ title: "Result", description: "Description" }],
      background: [{ title: "Background", body: "Body", mediaId: null, clientKey: null }],
      features: [{ title: "Feature", description: "Description", mediaId: null, clientKey: null }],
      development: [{ title: "Backend", items: ["API"], mediaId: null, clientKey: null }],
      architecture: { clients: ["Web"], services: ["API"], dataAndExternal: ["DB"], runtime: ["Docker"], delivery: ["CI"] },
      engineering: [{ title: "Problem", summary: null, problem: "P", solution: "S", result: "R", mediaId: null, clientKey: null }],
    },
    technologies: [{ technologyId: 3, showOnCard: true, highlighted: true, displayOrder: 0 }],
    thumbnailMode: "UPLOAD",
    mediaChanges: [{ clientKey: "new-1", action: "UPLOAD", uploadIndex: 0, mediaType: "CAROUSEL", displayOrder: 0 }],
  },
  thumbnail: new File(["thumbnail"], "thumbnail.webp", { type: "image/webp" }),
  mediaFiles: [new File(["media"], "media.webp", { type: "image/webp" })],
};

describe("Admin Project API 계약", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("독립 목록과 Editor Detail Endpoint를 조회", () => {
    getAdminProjects();
    getAdminProject(12);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/projects");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/projects/12");
  });

  it("Create·Update·Status·Delete Binding을 정확히 구성", () => {
    expect(projectActionBindings.create()).toEqual({ operation: "PROJECT_CREATE", targetType: "PROJECT", targetId: null });
    expect(projectActionBindings.update(12)).toEqual({ operation: "PROJECT_UPDATE", targetType: "PROJECT", targetId: "12" });
    expect(projectActionBindings.status(12)).toEqual({ operation: "PROJECT_STATUS_UPDATE", targetType: "PROJECT", targetId: "12" });
    expect(projectActionBindings.delete(12)).toEqual({ operation: "PROJECT_DELETE", targetType: "PROJECT", targetId: "12" });
  });

  it("최소 생성·상태·삭제를 독립 Project Endpoint로 요청", () => {
    createProject({ name: "Project One", slug: "project-one" }, verification);
    updateProjectStatus(12, true, verification);
    deleteProject(12, verification);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/projects", { method: "POST", headers, json: { name: "Project One", slug: "project-one" } });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/projects/12/status", { method: "PATCH", headers, json: { enabled: true } });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/admin/projects/12", { method: "DELETE", headers });
  });

  it("Metadata·Thumbnail·Media를 하나의 Multipart PUT으로 저장", async () => {
    saveProject(12, saveInput, verification);

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const [path, options] = vi.mocked(apiRequest).mock.calls[0];
    expect(path).toBe("/admin/projects/12");
    expect(options).toMatchObject({ method: "PUT", headers });
    expect(options?.body).toBeInstanceOf(FormData);

    const formData = options?.body as FormData;
    const metadata = formData.get("metadata") as Blob;
    expect(JSON.parse(await metadata.text())).toEqual(saveInput.metadata);
    expect(formData.get("thumbnail")).toBe(saveInput.thumbnail);
    expect(formData.getAll("mediaFiles")).toEqual(saveInput.mediaFiles);
  });
});
