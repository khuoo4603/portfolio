import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import type { ProjectContent, ProjectCreateInput } from "./admin-types";
import {
  createProject,
  deleteProject,
  getAdminProject,
  projectActionBindings,
  replaceProjectContent,
  replaceProjectMedia,
  replaceProjectTechnologies,
  updateProject,
  updateProjectStatus,
} from "./admin-project-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

const verification = { challengeId: "challenge-project", verificationCode: "654321" };
const headers = {
  "X-Admin-Challenge-Id": "challenge-project",
  "X-Admin-Verification-Code": "654321",
};
const project: ProjectCreateInput = {
  slug: "project-one", name: "Project One", year: 2026, tagline: "Tagline",
  description: "Description", cardRole: "Backend", summary: null, detailRole: null,
  startedAt: null, endedAt: null, teamSize: null, thumbnailUrl: null,
  displayOrder: 1, enabled: false,
};
const content: ProjectContent = {
  results: [{ title: "Result" }], background: ["Background"], features: [{ title: "Feature" }],
  development: [{ title: "Backend", items: ["API"] }],
  architecture: { clients: ["Web"], services: ["API"], dataAndExternal: ["DB"], runtime: ["Docker"], delivery: ["CI"] },
  engineering: [{ title: "Problem", summary: "Summary", problem: "P", solution: "S", result: "R" }],
};

describe("Admin Project API 계약", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("Summary와 분리된 실제 Detail Endpoint를 조회", () => {
    getAdminProject(12);
    expect(apiRequest).toHaveBeenCalledWith("/admin/site/projects/12");
  });

  it("Create·Update·Status·Delete Binding을 정확히 구성", () => {
    expect(projectActionBindings.create()).toEqual({ operation: "PROJECT_CREATE", targetType: "PROJECT", targetId: null });
    expect(projectActionBindings.update(12)).toEqual({ operation: "PROJECT_UPDATE", targetType: "PROJECT", targetId: "12" });
    expect(projectActionBindings.status(12)).toEqual({ operation: "PROJECT_STATUS_UPDATE", targetType: "PROJECT", targetId: "12" });
    expect(projectActionBindings.delete(12)).toEqual({ operation: "PROJECT_DELETE", targetType: "PROJECT", targetId: "12" });
  });

  it("기본정보 CRUD와 상태 Endpoint를 합치지 않음", () => {
    createProject(project, verification);
    updateProject(12, { name: "Updated" }, verification);
    updateProjectStatus(12, true, verification);
    deleteProject(12, verification);
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/site/projects", { method: "POST", headers, json: project });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/site/projects/12", { method: "PATCH", headers, json: { name: "Updated" } });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/admin/site/projects/12/status", { method: "PATCH", headers, json: { enabled: true } });
    expect(apiRequest).toHaveBeenNthCalledWith(4, "/admin/site/projects/12", { method: "DELETE", headers });
  });

  it("고정 6개 Content를 원래 구조로 PUT", () => {
    replaceProjectContent(12, content, verification);
    expect(apiRequest).toHaveBeenCalledWith("/admin/site/projects/12/content", { method: "PUT", headers, json: content });
    expect(Object.keys(content)).toEqual(["results", "background", "features", "development", "architecture", "engineering"]);
  });

  it("Technology Wrapper와 빈 목록을 그대로 PUT", () => {
    replaceProjectTechnologies(12, [{ technologyId: 3, showOnCard: true, highlighted: true, displayOrder: 1 }], verification);
    replaceProjectTechnologies(12, [], verification);
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/site/projects/12/technologies", { method: "PUT", headers, json: { items: [{ technologyId: 3, showOnCard: true, highlighted: true, displayOrder: 1 }] } });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/site/projects/12/technologies", { method: "PUT", headers, json: { items: [] } });
  });

  it("Media를 multipart 없이 URL Item Wrapper로 PUT", () => {
    const items = [{ imageUrl: "/images/project.webp", label: "화면", altText: "프로젝트 화면", displayOrder: 1 }];
    replaceProjectMedia(12, items, verification);
    expect(apiRequest).toHaveBeenCalledWith("/admin/site/projects/12/media", { method: "PUT", headers, json: { items } });
  });
});
