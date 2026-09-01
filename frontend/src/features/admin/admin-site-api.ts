import { apiRequest } from "@/lib/api/client";
import type {
  ExternalLink,
  ExternalLinkInput,
  PortfolioTechnology,
  ProfileEntry,
  ProfileEntryInput,
  ResumeInfo,
  SiteContent,
  SiteData,
  Technology,
  TechnologyInput,
} from "./admin-types";
import {
  adminActionHeaders,
  type AdminActionBinding,
  type AdminActionVerification,
} from "./admin-action-api";

export type PortfolioContentInput = Pick<SiteContent, "category" | "contentCode" | "contentValue">;

const singletonBinding = (operation: AdminActionBinding["operation"], targetType: AdminActionBinding["targetType"]): AdminActionBinding => ({
  operation,
  targetType,
  targetId: null,
});

const entityBinding = (operation: AdminActionBinding["operation"], targetType: AdminActionBinding["targetType"], id: number): AdminActionBinding => ({
  operation,
  targetType,
  targetId: String(id),
});

// Site Mutation별 ADMIN_ACTION operation·target 단일 계약
export const siteActionBindings = {
  portfolioContentUpdate: () => singletonBinding("PORTFOLIO_CONTENT_UPDATE", "PORTFOLIO_CONTENT"),
  profileEntryCreate: () => singletonBinding("PROFILE_ENTRY_CREATE", "PROFILE_ENTRY"),
  profileEntryUpdate: (id: number) => entityBinding("PROFILE_ENTRY_UPDATE", "PROFILE_ENTRY", id),
  profileEntryDelete: (id: number) => entityBinding("PROFILE_ENTRY_DELETE", "PROFILE_ENTRY", id),
  technologyCreate: () => singletonBinding("TECHNOLOGY_CREATE", "TECHNOLOGY"),
  technologyUpdate: (id: number) => entityBinding("TECHNOLOGY_UPDATE", "TECHNOLOGY", id),
  technologyDelete: (id: number) => entityBinding("TECHNOLOGY_DELETE", "TECHNOLOGY", id),
  portfolioTechnologyUpdate: () => singletonBinding("PORTFOLIO_TECHNOLOGY_UPDATE", "PORTFOLIO_TECHNOLOGY"),
  externalLinkCreate: () => singletonBinding("EXTERNAL_LINK_CREATE", "EXTERNAL_LINK"),
  externalLinkUpdate: (id: number) => entityBinding("EXTERNAL_LINK_UPDATE", "EXTERNAL_LINK", id),
  externalLinkDelete: (id: number) => entityBinding("EXTERNAL_LINK_DELETE", "EXTERNAL_LINK", id),
  resumeReplace: () => singletonBinding("RESUME_REPLACE", "RESUME"),
};

// Site 관리 초기 데이터 단일 조회
export function getAdminSite() {
  return apiRequest<SiteData>("/admin/site");
}

// 고정 콘텐츠 Batch 수정
export function updatePortfolioContents(items: PortfolioContentInput[], verification: AdminActionVerification) {
  return apiRequest<{ items: SiteContent[] }>("/admin/site/portfolio-contents", {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: { items },
  });
}

// 프로필 반복 항목 생성·수정·삭제
export function createProfileEntry(input: ProfileEntryInput, verification: AdminActionVerification) {
  return apiRequest<ProfileEntry>("/admin/site/profile-entries", {
    method: "POST",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function updateProfileEntry(id: number, input: ProfileEntryInput, verification: AdminActionVerification) {
  return apiRequest<ProfileEntry>(`/admin/site/profile-entries/${id}`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function deleteProfileEntry(id: number, verification: AdminActionVerification) {
  return apiRequest(`/admin/site/profile-entries/${id}`, {
    method: "DELETE",
    headers: adminActionHeaders(verification),
  });
}

// 기술 사전 생성·수정·삭제
export function createTechnology(input: TechnologyInput, verification: AdminActionVerification) {
  return apiRequest<Technology>("/admin/site/technologies", {
    method: "POST",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function updateTechnology(id: number, input: TechnologyInput, verification: AdminActionVerification) {
  return apiRequest<Technology>(`/admin/site/technologies/${id}`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function deleteTechnology(id: number, verification: AdminActionVerification) {
  return apiRequest(`/admin/site/technologies/${id}`, {
    method: "DELETE",
    headers: adminActionHeaders(verification),
  });
}

// 포트폴리오 메인 기술 구성 전체 교체
export function replacePortfolioTechnologies(items: PortfolioTechnology[], verification: AdminActionVerification) {
  return apiRequest<{ items: PortfolioTechnology[] }>("/admin/site/portfolio-technologies", {
    method: "PUT",
    headers: adminActionHeaders(verification),
    json: { items },
  });
}

// 외부 링크 생성·수정·삭제
export function createExternalLink(input: ExternalLinkInput, verification: AdminActionVerification) {
  return apiRequest<ExternalLink>("/admin/site/external-links", {
    method: "POST",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function updateExternalLink(id: number, input: ExternalLinkInput, verification: AdminActionVerification) {
  return apiRequest<ExternalLink>(`/admin/site/external-links/${id}`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function deleteExternalLink(id: number, verification: AdminActionVerification) {
  return apiRequest(`/admin/site/external-links/${id}`, {
    method: "DELETE",
    headers: adminActionHeaders(verification),
  });
}

// Browser가 multipart boundary를 구성하는 이력서 PDF 교체
export function replaceResume(file: File, verification: AdminActionVerification) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<ResumeInfo>("/admin/site/resume", {
    method: "PUT",
    headers: adminActionHeaders(verification),
    body,
  });
}
