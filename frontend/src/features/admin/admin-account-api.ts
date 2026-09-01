import { apiRequest } from "@/lib/api/client";
import type {
  AccountInput,
  AccountListResponse,
  AccountCreateResult,
  AccountRole,
} from "./admin-types";
import {
  adminActionHeaders,
  type AdminActionBinding,
  type AdminActionVerification,
} from "./admin-action-api";

export type AccountQuery = {
  role?: AccountRole;
  enabled?: boolean;
  keyword?: string;
};

const accountBinding = (operation: AdminActionBinding["operation"], id: number | null): AdminActionBinding => ({
  operation,
  targetType: "ACCOUNT",
  targetId: id === null ? null : String(id),
});

// Account Mutation별 ADMIN_ACTION operation·target 단일 계약
export const accountActionBindings = {
  create: () => accountBinding("ACCOUNT_CREATE", null),
  status: (id: number) => accountBinding("ACCOUNT_STATUS_UPDATE", id),
  role: (id: number) => accountBinding("ACCOUNT_ROLE_UPDATE", id),
  password: (id: number) => accountBinding("ACCOUNT_PASSWORD_RESET", id),
};

// Backend 조건 기반 계정 목록 조회
export function getAdminAccounts(query: AccountQuery) {
  return apiRequest<AccountListResponse>("/admin/accounts", {
    query: {
      role: query.role,
      enabled: query.enabled,
      keyword: query.keyword,
    },
  });
}

// 계정 생성·상태·권한·비밀번호 Mutation
export function createAccount(input: AccountInput, verification: AdminActionVerification) {
  return apiRequest<AccountCreateResult>("/admin/accounts", {
    method: "POST",
    headers: adminActionHeaders(verification),
    json: input,
  });
}

export function updateAccountStatus(id: number, enabled: boolean, verification: AdminActionVerification) {
  return apiRequest(`/admin/accounts/${id}/status`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: { enabled },
  });
}

export function updateAccountRole(id: number, role: AccountRole, verification: AdminActionVerification) {
  return apiRequest(`/admin/accounts/${id}/role`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: { role },
  });
}

export function resetAccountPassword(id: number, newPassword: string, verification: AdminActionVerification) {
  return apiRequest(`/admin/accounts/${id}/password`, {
    method: "PATCH",
    headers: adminActionHeaders(verification),
    json: { newPassword },
  });
}
