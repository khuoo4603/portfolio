import { apiRequest } from "@/lib/api/client";
import type {
  ToolItem,
  ToolLink,
  ToolLinkCreateMetadata,
  ToolLinkMutation,
  ToolLinkUpdateMetadata,
  ToolStatusInput,
  ToolsData,
} from "./admin-types";

function linkFormData<TMetadata>(input: ToolLinkMutation<TMetadata>) {
  const formData = new FormData();
  formData.append("metadata", new Blob([JSON.stringify(input.metadata)], { type: "application/json" }));
  if (input.image) {
    formData.append("image", input.image);
  }
  return formData;
}

// Tool Registry와 Link 관리 데이터 조회
export function getAdminTools() {
  return apiRequest<ToolsData>("/admin/tools");
}

// Tool Registry enabled JSON 변경
export function updateToolStatus(
  toolKey: string,
  input: ToolStatusInput,
) {
  return apiRequest<ToolItem>(`/admin/tools/${encodeURIComponent(toolKey)}`, {
    method: "PATCH",
    json: input,
  });
}

// Tool Link Multipart 생성
export function createToolLink(input: ToolLinkMutation<ToolLinkCreateMetadata>) {
  return apiRequest<ToolLink>("/admin/tools/links", {
    method: "POST",
    body: linkFormData(input),
  });
}

// Tool Link Multipart 일반 수정
export function updateToolLink(
  id: number,
  input: ToolLinkMutation<ToolLinkUpdateMetadata>,
) {
  return apiRequest<ToolLink>(`/admin/tools/links/${id}`, {
    method: "PATCH",
    body: linkFormData(input),
  });
}

// Tool Link enabled만 KEEP Mode로 변경
export function updateToolLinkEnabled(id: number, enabled: boolean) {
  return updateToolLink(id, {
    metadata: { enabled, imageMode: "KEEP" },
    image: null,
  });
}

// Tool Link 삭제
export function deleteToolLink(id: number) {
  return apiRequest(`/admin/tools/links/${id}`, {
    method: "DELETE",
  });
}
