import { apiRequest } from "@/lib/api/client";
import type {
  ProjectCreateInput,
  ProjectCreateResult,
  ProjectDetail,
  ProjectSaveInput,
  ProjectSummary,
} from "./admin-types";
import {
  adminActionHeaders,
  type AdminActionBinding,
  type AdminActionVerification,
} from "./admin-action-api";

const projectBinding = (
  operation: AdminActionBinding["operation"],
  id: number | null,
): AdminActionBinding => ({
  operation,
  targetType: "PROJECT",
  targetId: id === null ? null : String(id),
});

export const projectActionBindings = {
  create: () => projectBinding("PROJECT_CREATE", null),
  update: (id: number) => projectBinding("PROJECT_UPDATE", id),
  status: (id: number) => projectBinding("PROJECT_STATUS_UPDATE", id),
  delete: (id: number) => projectBinding("PROJECT_DELETE", id),
};

// 관리자 Project 전체 목록 조회
export function getAdminProjects() {
  return apiRequest<{ items: ProjectSummary[] }>("/admin/projects");
}

// 비공개 Draft를 포함한 Project Editor 초기 상태 조회
export function getAdminProject(id: number) {
  return apiRequest<ProjectDetail>(`/admin/projects/${id}`);
}

// Name·Slug만 전달하는 최소 Draft 생성
export function createProject(input: ProjectCreateInput, verification: AdminActionVerification) {
  return apiRequest<ProjectCreateResult>("/admin/projects", {
    method: "POST",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

// 목록의 별도 공개 상태 변경
export function updateProjectStatus(
  id: number,
  enabled: boolean,
  verification: AdminActionVerification,
) {
  return apiRequest<{ id: number; enabled: boolean; updatedAt: string }>(
    `/admin/projects/${id}/status`,
    {
      method: "PATCH",
      headers: adminActionHeaders(verification),
      json: { enabled },
    },
  );
}

// Project와 하위 데이터 삭제
export function deleteProject(id: number, verification: AdminActionVerification) {
  return apiRequest(`/admin/projects/${id}`, {
    method: "DELETE",
    headers: adminActionHeaders(verification),
  });
}

// Editor Draft와 신규 파일의 단일 Multipart 저장
export function saveProject(
  id: number,
  input: ProjectSaveInput,
  verification: AdminActionVerification,
) {
  const formData = new FormData();
  formData.append("metadata", new Blob([JSON.stringify(input.metadata)], { type: "application/json" }));
  if (input.thumbnail) {
    formData.append("thumbnail", input.thumbnail);
  }
  input.mediaFiles.forEach((file) => formData.append("mediaFiles", file));
  return apiRequest<ProjectDetail>(`/admin/projects/${id}`, {
    method: "PUT",
    headers: adminActionHeaders(verification),
    body: formData,
  });
}
