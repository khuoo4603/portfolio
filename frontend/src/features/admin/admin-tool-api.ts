import { apiRequest } from "@/lib/api/client";
import type { ToolItem, ToolLink, ToolLinkInput, ToolsData } from "./admin-types";
import {
  adminActionHeaders,
  type AdminActionBinding,
  type AdminActionVerification,
} from "./admin-action-api";

const toolBinding = (toolKey: string): AdminActionBinding => ({
  operation: "TOOL_STATUS_UPDATE",
  targetType: "TOOL",
  targetId: toolKey,
});

const linkBinding = (
  operation: "TOOL_LINK_CREATE" | "TOOL_LINK_UPDATE" | "TOOL_LINK_DELETE",
  id: number | null,
): AdminActionBinding => ({
  operation,
  targetType: "TOOL_LINK",
  targetId: id === null ? null : String(id),
});

export const toolActionBindings = {
  status: toolBinding,
  linkCreate: () => linkBinding("TOOL_LINK_CREATE", null),
  linkUpdate: (id: number) => linkBinding("TOOL_LINK_UPDATE", id),
  linkDelete: (id: number) => linkBinding("TOOL_LINK_DELETE", id),
};

export function getAdminTools() {
  return apiRequest<ToolsData>("/admin/tools");
}

export function updateToolStatus(
  toolKey: string,
  enabled: boolean,
  verification: AdminActionVerification,
) {
  return apiRequest<ToolItem>(`/admin/tools/${encodeURIComponent(toolKey)}`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: { enabled },
  });
}

export function createToolLink(input: ToolLinkInput, verification: AdminActionVerification) {
  return apiRequest<ToolLink>("/admin/tools/links", {
    method: "POST",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function updateToolLink(
  id: number,
  input: ToolLinkInput,
  verification: AdminActionVerification,
) {
  return apiRequest<ToolLink>(`/admin/tools/links/${id}`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function deleteToolLink(id: number, verification: AdminActionVerification) {
  return apiRequest(`/admin/tools/links/${id}`, {
    method: "DELETE",
    headers: adminActionHeaders(verification),
  });
}
