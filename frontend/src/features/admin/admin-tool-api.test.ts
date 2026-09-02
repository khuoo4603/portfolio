import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import type { ToolLinkCreateMetadata, ToolLinkUpdateMetadata } from "./admin-types";
import {
  createToolLink,
  deleteToolLink,
  getAdminTools,
  updateToolLink,
  updateToolLinkEnabled,
  updateToolStatus,
} from "./admin-tool-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

const createMetadata: ToolLinkCreateMetadata = {
  name: "Spring Docs",
  description: "Reference",
  url: "https://spring.io",
  imageMode: "UPLOAD",
  category: "REFERENCE",
  displayOrder: 1,
  enabled: true,
};

async function formDataJson(formData: FormData) {
  const metadata = formData.get("metadata");
  if (!(metadata instanceof Blob)) throw new Error("metadata Blob 누락");
  return JSON.parse(await metadata.text()) as unknown;
}

describe("Admin Tools API 계약", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("Tool Registry와 Link를 단일 Endpoint로 조회", () => {
    getAdminTools();
    expect(apiRequest).toHaveBeenCalledWith("/admin/tools");
  });

  it("Tool 상태 PATCH는 enabled JSON만 전달", () => {
    updateToolStatus("LINKS", { enabled: false });
    expect(apiRequest).toHaveBeenCalledWith("/admin/tools/LINKS", {
      method: "PATCH",
      json: { enabled: false },
    });
  });

  it("Link 생성은 JSON metadata Blob과 선택 이미지를 FormData로 전달", async () => {
    const image = new File(["image"], "spring.webp", { type: "image/webp" });
    createToolLink({ metadata: createMetadata, image });

    const options = vi.mocked(apiRequest).mock.calls[0][1]!;
    expect(options).toMatchObject({ method: "POST" });
    expect(options).not.toHaveProperty("headers");
    expect(options.body).toBeInstanceOf(FormData);
    const body = options.body as FormData;
    expect(await formDataJson(body)).toEqual(createMetadata);
    expect(body.get("image")).toBe(image);
  });

  it("Link 일반 수정과 enabled 전용 수정의 Mode·Image 계약을 분리", async () => {
    const metadata: ToolLinkUpdateMetadata = { category: "MY_SERVICES", imageMode: "DEFAULT" };
    updateToolLink(15, { metadata, image: null });
    updateToolLinkEnabled(15, false);

    const general = vi.mocked(apiRequest).mock.calls[0][1]!.body as FormData;
    const enabledOnly = vi.mocked(apiRequest).mock.calls[1][1]!.body as FormData;
    expect(await formDataJson(general)).toEqual(metadata);
    expect(general.has("image")).toBe(false);
    expect(await formDataJson(enabledOnly)).toEqual({ enabled: false, imageMode: "KEEP" });
    expect(enabledOnly.has("image")).toBe(false);
  });

  it("Link 삭제는 ADMIN_ACTION Header 없이 요청", () => {
    deleteToolLink(15);
    expect(apiRequest).toHaveBeenCalledWith("/admin/tools/links/15", { method: "DELETE" });
  });
});
