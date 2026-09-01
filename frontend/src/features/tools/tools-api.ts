import { apiRequest } from "@/lib/api/client";
import type {
  QuizListResponse,
  SavedQuiz,
  ToolLinkListResponse,
  ToolListResponse,
} from "@/types/api";

export type QuizSavePayload = {
  title: string;
  quizJson: unknown;
  responseJson: unknown;
};

// 인증 사용자의 활성 Tool Registry 조회
export function getTools() {
  return apiRequest<ToolListResponse>("/tools");
}

// Links Tool의 활성 Link 조회
export function getToolLinks() {
  return apiRequest<ToolLinkListResponse>("/tools/links");
}

// 현재 사용자 소유 Quiz 최근 수정순 목록 조회
export function getQuizzes() {
  return apiRequest<QuizListResponse>("/tools/quizzes");
}

// 현재 사용자 Quiz 신규 저장
export function createQuiz(payload: QuizSavePayload) {
  return apiRequest<SavedQuiz>("/tools/quizzes", {
    method: "POST",
    json: payload,
  });
}

// 현재 사용자 소유 Quiz 상세 조회
export function getQuiz(quizId: number) {
  return apiRequest<SavedQuiz>(`/tools/quizzes/${quizId}`);
}

// 현재 사용자 소유 Quiz 전체 Workspace 필드 수정
export function updateQuiz(quizId: number, payload: QuizSavePayload) {
  return apiRequest<SavedQuiz>(`/tools/quizzes/${quizId}`, {
    method: "PATCH",
    json: payload,
  });
}

// 현재 사용자 소유 Quiz 삭제
export function deleteQuiz(quizId: number) {
  return apiRequest(`/tools/quizzes/${quizId}`, { method: "DELETE" });
}
