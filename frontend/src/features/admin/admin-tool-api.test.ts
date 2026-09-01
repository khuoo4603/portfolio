import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import type { ToolLinkInput } from "./admin-types";
import {
  createToolLink,
  deleteToolLink,
  getAdminTools,
  toolActionBindings,
  updateToolLink,
  updateToolStatus,
} from "./admin-tool-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

const verification = { challengeId: "challenge-tools", verificationCode: "123456" };
const headers = {
  "X-Admin-Challenge-Id": "challenge-tools",
  "X-Admin-Verification-Code": "123456",
};
const link: ToolLinkInput = {
  name: "Spring Docs",
  description: "Reference",
  url: "https://spring.io",
  imageUrl: "/images/spring.webp",
  category: "REFERENCE",
  displayOrder: 1,
  enabled: true,
};

describe("Admin Tools API 계약", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("Tool Registry와 Link를 단일 Endpoint로 조회", () => {
    getAdminTools();
    expect(apiRequest).toHaveBeenCalledWith("/admin/tools");
  });

  it("operation·targetType·실제 Entity ID를 바인딩", () => {
    expect(toolActionBindings.status("QUIZ")).toEqual({ operation: "TOOL_STATUS_UPDATE", targetType: "TOOL", targetId: "QUIZ" });
    expect(toolActionBindings.linkCreate()).toEqual({ operation: "TOOL_LINK_CREATE", targetType: "TOOL_LINK", targetId: null });
    expect(toolActionBindings.linkUpdate(15)).toEqual({ operation: "TOOL_LINK_UPDATE", targetType: "TOOL_LINK", targetId: "15" });
    expect(toolActionBindings.linkDelete(15)).toEqual({ operation: "TOOL_LINK_DELETE", targetType: "TOOL_LINK", targetId: "15" });
  });

  it("Tool 상태 PATCH에 ADMIN_ACTION Header를 전달", () => {
    updateToolStatus("LINKS", false, verification);
    expect(apiRequest).toHaveBeenCalledWith("/admin/tools/LINKS", {
      method: "PATCH",
      headers,
      json: { enabled: false },
    });
  });

  it("Link CRUD가 imageUrl과 정확한 Header를 전달", () => {
    createToolLink(link, verification);
    updateToolLink(15, { ...link, category: "MY_SERVICES" }, verification);
    deleteToolLink(15, verification);
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/tools/links", { method: "POST", headers, json: link });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/tools/links/15", { method: "PATCH", headers, json: { ...link, category: "MY_SERVICES" } });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/admin/tools/links/15", { method: "DELETE", headers });
  });
});
