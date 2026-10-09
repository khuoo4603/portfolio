import { apiRequest } from "@/lib/api/client";
import type {
  QuizListResponse,
  QuizSubject,
  QuizSubjectListResponse,
  SavedQuiz,
  ToolLinkListResponse,
  ToolListResponse,
} from "@/types/api";

export type QuizSavePayload = {
  title: string;
  quizJson: unknown;
  responseJson: unknown;
  subjectId?: number | null;
};

export type QuizUpdatePayload = Partial<QuizSavePayload>;

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
export function updateQuiz(quizId: number, payload: QuizUpdatePayload) {
  return apiRequest<SavedQuiz>(`/tools/quizzes/${quizId}`, {
    method: "PATCH",
    json: payload,
  });
}

// 현재 사용자 소유 Quiz 삭제
export function deleteQuiz(quizId: number) {
  return apiRequest(`/tools/quizzes/${quizId}`, { method: "DELETE" });
}

// 현재 사용자 소유 Quiz 과목 목록 조회
export function getQuizSubjects() {
  return apiRequest<QuizSubjectListResponse>("/tools/quiz-subjects");
}

// 현재 사용자 소유 Quiz 과목 생성
export function createQuizSubject(name: string) {
  return apiRequest<QuizSubject>("/tools/quiz-subjects", {
    method: "POST",
    json: { name },
  });
}

// 현재 사용자 소유 Quiz 과목명 변경
export function updateQuizSubject(subjectId: number, name: string) {
  return apiRequest<QuizSubject>(`/tools/quiz-subjects/${subjectId}`, {
    method: "PATCH",
    json: { name },
  });
}

// 현재 사용자 소유 Quiz 과목 삭제
export function deleteQuizSubject(subjectId: number) {
  return apiRequest(`/tools/quiz-subjects/${subjectId}`, { method: "DELETE" });
}
