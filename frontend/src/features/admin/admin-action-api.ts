import { apiRequest } from "@/lib/api/client";
import type { ChallengeResponse } from "@/types/api";

export type AdminActionOperation =
  | "PORTFOLIO_CONTENT_UPDATE"
  | "PROFILE_ENTRY_CREATE"
  | "PROFILE_ENTRY_UPDATE"
  | "PROFILE_ENTRY_DELETE"
  | "RESUME_REPLACE"
  | "TECHNOLOGY_CREATE"
  | "TECHNOLOGY_UPDATE"
  | "TECHNOLOGY_DELETE"
  | "PORTFOLIO_TECHNOLOGY_UPDATE"
  | "PROJECT_CREATE"
  | "PROJECT_UPDATE"
  | "PROJECT_DELETE"
  | "PROJECT_STATUS_UPDATE"
  | "EXTERNAL_LINK_CREATE"
  | "EXTERNAL_LINK_UPDATE"
  | "EXTERNAL_LINK_DELETE"
  | "ACCOUNT_CREATE"
  | "ACCOUNT_STATUS_UPDATE"
  | "ACCOUNT_ROLE_UPDATE"
  | "ACCOUNT_PASSWORD_RESET"
  | "TOOL_STATUS_UPDATE"
  | "TOOL_LINK_CREATE"
  | "TOOL_LINK_UPDATE"
  | "TOOL_LINK_DELETE";

export type AdminActionTarget =
  | "PORTFOLIO_CONTENT"
  | "PROFILE_ENTRY"
  | "RESUME"
  | "TECHNOLOGY"
  | "PORTFOLIO_TECHNOLOGY"
  | "PROJECT"
  | "EXTERNAL_LINK"
  | "ACCOUNT"
  | "TOOL"
  | "TOOL_LINK";

export type AdminActionBinding = {
  operation: AdminActionOperation;
  targetType: AdminActionTarget | null;
  targetId: string | null;
};

export type AdminActionVerification = {
  challengeId: string;
  verificationCode: string;
};

// 현재 ADMIN과 단일 변경 작업을 바인딩한 ADMIN_ACTION Challenge 발급
export function createAdminChallenge(binding: AdminActionBinding) {
  const { operation, targetType, targetId } = binding;
  return apiRequest<ChallengeResponse>("/admin/auth/challenges", {
    method: "POST",
    json: { operation, targetType, targetId },
  });
}

// 관리자 Mutation에만 전달하는 재인증 Header 조합
export function adminActionHeaders(verification: AdminActionVerification) {
  return {
    "X-Admin-Challenge-Id": verification.challengeId,
    "X-Admin-Verification-Code": verification.verificationCode,
  } satisfies Record<string, string>;
}
