import { apiRequest } from "@/lib/api/client";
import type {
  AdminMonitoringData,
  DashboardData,
  ErrorLogPage,
  LoginLogPage,
  MonitoringSettings,
  MonitoringSettingsInput,
  MonitoringTarget,
  MonitoringTargetCreateInput,
  MonitoringTargetUpdateInput,
} from "./admin-types";

export type DashboardMonths = 6 | 12;
export type LoginResult = "SUCCESS" | "FAILURE";
export type ErrorService = "FRONTEND" | "BACKEND";

export type LoginLogQuery = {
  from?: string;
  to?: string;
  email?: string;
  result?: LoginResult;
  page: number;
  size: number;
};

export type ErrorLogQuery = {
  from?: string;
  to?: string;
  service?: ErrorService;
  statusCode?: number;
  page: number;
  size: number;
};

// 날짜 입력값의 KST 조회 시작시각 변환
export function kstStartOfDay(value: string) {
  return value ? `${value}T00:00:00+09:00` : undefined;
}

// Backend의 inclusive to 조건에 맞춘 KST 조회 종료시각 변환
export function kstEndOfDay(value: string) {
  return value ? `${value}T23:59:59.999999999+09:00` : undefined;
}

// 선택 월 범위의 관리자 Dashboard 통합 조회
export function getAdminDashboard(months: DashboardMonths) {
  return apiRequest<DashboardData>("/admin/dashboard", {
    query: { months },
  });
}

// Monitoring 설정과 관리 대상을 함께 조회
export function getAdminMonitoring() {
  return apiRequest<AdminMonitoringData>("/admin/monitoring");
}

// Monitoring 실행 설정 변경
export function updateMonitoringSettings(input: MonitoringSettingsInput) {
  return apiRequest<MonitoringSettings>("/admin/monitoring/settings", {
    method: "PATCH",
    json: input,
  });
}

// Monitoring Target 등록
export function createMonitoringTarget(input: MonitoringTargetCreateInput) {
  return apiRequest<MonitoringTarget>("/admin/monitoring/targets", {
    method: "POST",
    json: input,
  });
}

// Monitoring Target 변경
export function updateMonitoringTarget(targetId: number, input: MonitoringTargetUpdateInput) {
  return apiRequest<MonitoringTarget>(`/admin/monitoring/targets/${targetId}`, {
    method: "PATCH",
    json: input,
  });
}

// 기간·이메일·결과와 Backend Pagination 기반 로그인 기록 조회
export function getLoginLogs(query: LoginLogQuery) {
  return apiRequest<LoginLogPage>("/admin/logs/logins", { query });
}

// 기간·서비스·HTTP 상태와 Backend Pagination 기반 오류 기록 조회
export function getErrorLogs(query: ErrorLogQuery) {
  return apiRequest<ErrorLogPage>("/admin/logs/errors", { query });
}
