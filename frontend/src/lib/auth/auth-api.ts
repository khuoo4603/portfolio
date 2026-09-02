import { apiRequest, clearCsrfToken } from "@/lib/api/client";
import type { ChallengeResponse, CurrentUser, LoginResponse } from "@/types/api";

// 이메일·비밀번호 기반 USER 로그인 또는 ADMIN Challenge 발급
export function login(email: string, password: string, rememberMe: boolean) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    json: { email, password, rememberMe },
  });
}

// ADMIN_LOGIN 인증번호 검증과 Session 생성
export function verifyAdminLogin(challengeId: string, code: string) {
  return apiRequest<LoginResponse>("/auth/admin-login/verify", {
    method: "POST",
    json: { challengeId, code },
  });
}

// ADMIN_LOGIN 기존 Challenge 교체 요청
export function resendAdminLogin(challengeId: string) {
  return apiRequest<ChallengeResponse>("/auth/admin-login/resend", {
    method: "POST",
    json: { challengeId },
  });
}

// 현재 Backend Session 계정 조회
export function getCurrentUser() {
  return apiRequest<CurrentUser>("/auth/me");
}

// 현재 Session 폐기와 Client CSRF 상태 초기화
export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    clearCsrfToken();
  }
}

// 현재 Session 계정의 PASSWORD_CHANGE Challenge 발급
export function issuePasswordChallenge() {
  return apiRequest<ChallengeResponse>("/auth/password/challenge", { method: "POST" });
}

// PASSWORD_CHANGE 검증과 Backend 전체 Session 폐기 반영
export async function changePassword(challengeId: string, code: string, newPassword: string) {
  await apiRequest("/auth/password", {
    method: "PATCH",
    json: { challengeId, code, newPassword },
  });
  clearCsrfToken();
}
