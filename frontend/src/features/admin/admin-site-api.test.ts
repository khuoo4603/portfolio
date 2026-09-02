import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import type { ExternalLinkInput, ProfileEntryInput, TechnologyInput } from "./admin-types";
import {
  createExternalLink,
  createProfileEntry,
  createTechnology,
  deleteExternalLink,
  deleteProfileEntry,
  deleteTechnology,
  getAdminSite,
  replacePortfolioTechnologies,
  replaceResume,
  siteActionBindings,
  updateExternalLink,
  updatePortfolioContents,
  updateProfileEntry,
  updateTechnology,
} from "./admin-site-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

const verification = { challengeId: "challenge-site", verificationCode: "654321" };
const headers = {
  "X-Admin-Challenge-Id": "challenge-site",
  "X-Admin-Verification-Code": "654321",
};
const profile: ProfileEntryInput = {
  entryType: "EDUCATION",
  periodText: "2023.03 — 현재",
  title: "소프트웨어융합전공",
  organization: "성공회대학교",
  role: null,
  description: null,
  achievement: "재학",
  displayOrder: 1,
  enabled: true,
};
const technology: TechnologyInput = {
  name: "PostgreSQL",
  category: "DATABASE",
  iconUrl: "/icons/tech/postgresql.svg",
  enabled: true,
};
const link: ExternalLinkInput = {
  name: "GitHub",
  url: "https://github.com/example",
  displayOrder: 1,
  enabled: true,
};

describe("Admin Site API 계약", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("초기 Site 데이터를 단일 Endpoint에서 조회", () => {
    getAdminSite();
    expect(apiRequest).toHaveBeenCalledWith("/admin/site");
  });

  it("모든 Site 작업의 operation·targetType·targetId를 정확히 바인딩", () => {
    expect(siteActionBindings.portfolioContentUpdate()).toEqual({ operation: "PORTFOLIO_CONTENT_UPDATE", targetType: "PORTFOLIO_CONTENT", targetId: null });
    expect(siteActionBindings.profileEntryCreate()).toEqual({ operation: "PROFILE_ENTRY_CREATE", targetType: "PROFILE_ENTRY", targetId: null });
    expect(siteActionBindings.profileEntryUpdate(15)).toEqual({ operation: "PROFILE_ENTRY_UPDATE", targetType: "PROFILE_ENTRY", targetId: "15" });
    expect(siteActionBindings.profileEntryDelete(15)).toEqual({ operation: "PROFILE_ENTRY_DELETE", targetType: "PROFILE_ENTRY", targetId: "15" });
    expect(siteActionBindings.technologyCreate()).toEqual({ operation: "TECHNOLOGY_CREATE", targetType: "TECHNOLOGY", targetId: null });
    expect(siteActionBindings.technologyUpdate(7)).toEqual({ operation: "TECHNOLOGY_UPDATE", targetType: "TECHNOLOGY", targetId: "7" });
    expect(siteActionBindings.technologyDelete(7)).toEqual({ operation: "TECHNOLOGY_DELETE", targetType: "TECHNOLOGY", targetId: "7" });
    expect(siteActionBindings.portfolioTechnologyUpdate()).toEqual({ operation: "PORTFOLIO_TECHNOLOGY_UPDATE", targetType: "PORTFOLIO_TECHNOLOGY", targetId: null });
    expect(siteActionBindings.externalLinkCreate()).toEqual({ operation: "EXTERNAL_LINK_CREATE", targetType: "EXTERNAL_LINK", targetId: null });
    expect(siteActionBindings.externalLinkUpdate(3)).toEqual({ operation: "EXTERNAL_LINK_UPDATE", targetType: "EXTERNAL_LINK", targetId: "3" });
    expect(siteActionBindings.externalLinkDelete(3)).toEqual({ operation: "EXTERNAL_LINK_DELETE", targetType: "EXTERNAL_LINK", targetId: "3" });
    expect(siteActionBindings.resumeReplace()).toEqual({ operation: "RESUME_REPLACE", targetType: "RESUME", targetId: null });
  });

  it("콘텐츠 PATCH에 변경 Slot과 ADMIN_ACTION Header를 전달", () => {
    const items = [{ category: "COMMON" as const, contentCode: "NAME" as const, contentValue: "수정 이름" }];
    updatePortfolioContents(items, verification);
    expect(apiRequest).toHaveBeenCalledWith("/admin/site/portfolio-contents", {
      method: "PATCH",
      headers,
      json: { items },
    });
  });

  it("Profile Entry Create·Update·Delete가 실제 값과 Header를 전달", () => {
    createProfileEntry(profile, verification);
    updateProfileEntry(15, profile, verification);
    deleteProfileEntry(15, verification);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/site/profile-entries", { method: "POST", headers, json: profile });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/site/profile-entries/15", { method: "PATCH", headers, json: profile });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/admin/site/profile-entries/15", { method: "DELETE", headers });
  });

  it("Technology Master CRUD와 메인 구성 PUT을 분리", () => {
    createTechnology(technology, verification);
    updateTechnology(7, technology, verification);
    deleteTechnology(7, verification);
    replacePortfolioTechnologies([{ technologyId: 7, displayOrder: 1 }], verification);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/site/technologies", { method: "POST", headers, json: technology });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/site/technologies/7", { method: "PATCH", headers, json: technology });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/admin/site/technologies/7", { method: "DELETE", headers });
    expect(apiRequest).toHaveBeenNthCalledWith(4, "/admin/site/portfolio-technologies", {
      method: "PUT",
      headers,
      json: { items: [{ technologyId: 7, displayOrder: 1 }] },
    });
  });

  it("External Link Create·Update·Delete가 실제 계약을 사용", () => {
    createExternalLink(link, verification);
    updateExternalLink(3, link, verification);
    deleteExternalLink(3, verification);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/site/external-links", { method: "POST", headers, json: link });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/site/external-links/3", { method: "PATCH", headers, json: link });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/admin/site/external-links/3", { method: "DELETE", headers });
  });

  it("Resume PDF를 Content-Type 강제 없이 FormData file Part로 전달", () => {
    const file = new File(["pdf"], "resume.pdf", { type: "application/pdf" });
    replaceResume(file, verification);

    const options = vi.mocked(apiRequest).mock.calls[0][1];
    expect(apiRequest).toHaveBeenCalledWith("/admin/site/resume", expect.objectContaining({ method: "PUT", headers }));
    expect(options?.headers).not.toHaveProperty("Content-Type");
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("file")).toBe(file);
  });
});
