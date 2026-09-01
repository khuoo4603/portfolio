import { apiRequest } from "@/lib/api/client";
import type {
  Project,
  ProjectContent,
  ProjectCreateInput,
  ProjectDetail,
  ProjectMedia,
  ProjectMediaInput,
  ProjectTechnologyInput,
  ProjectUpdateInput,
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

export function getAdminProject(id: number) {
  return apiRequest<ProjectDetail>(`/admin/site/projects/${id}`);
}

export function createProject(input: ProjectCreateInput, verification: AdminActionVerification) {
  return apiRequest<Project & { createdAt: string }>("/admin/site/projects", {
    method: "POST",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function updateProject(
  id: number,
  input: ProjectUpdateInput,
  verification: AdminActionVerification,
) {
  return apiRequest<Project>(`/admin/site/projects/${id}`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function updateProjectStatus(
  id: number,
  enabled: boolean,
  verification: AdminActionVerification,
) {
  return apiRequest<{ id: number; enabled: boolean; updatedAt: string }>(
    `/admin/site/projects/${id}/status`,
    {
      method: "PATCH",
      headers: adminActionHeaders(verification),
      json: { enabled },
    },
  );
}

export function deleteProject(id: number, verification: AdminActionVerification) {
  return apiRequest(`/admin/site/projects/${id}`, {
    method: "DELETE",
    headers: adminActionHeaders(verification),
  });
}

export function replaceProjectContent(
  id: number,
  content: ProjectContent,
  verification: AdminActionVerification,
) {
  return apiRequest<ProjectContent & { updatedAt: string }>(`/admin/site/projects/${id}/content`, {
    method: "PUT",
    headers: adminActionHeaders(verification),
    json: content,
  });
}

export function replaceProjectTechnologies(
  id: number,
  items: ProjectTechnologyInput[],
  verification: AdminActionVerification,
) {
  return apiRequest<{ items: ProjectTechnologyInput[] }>(`/admin/site/projects/${id}/technologies`, {
    method: "PUT",
    headers: adminActionHeaders(verification),
    json: { items },
  });
}

export function replaceProjectMedia(
  id: number,
  items: ProjectMediaInput[],
  verification: AdminActionVerification,
) {
  return apiRequest<{ items: ProjectMedia[] }>(`/admin/site/projects/${id}/media`, {
    method: "PUT",
    headers: adminActionHeaders(verification),
    json: { items },
  });
}
