import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import type { AccountInput } from "./admin-types";
import {
  accountActionBindings,
  createAccount,
  getAdminAccounts,
  resetAccountPassword,
  updateAccountRole,
  updateAccountStatus,
} from "./admin-account-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

const verification = { challengeId: "challenge-account", verificationCode: "123456" };
const headers = {
  "X-Admin-Challenge-Id": "challenge-account",
  "X-Admin-Verification-Code": "123456",
};

describe("Admin Account API 계약", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("role·enabled·keyword를 Pagination 없이 조회 Query로 전달", () => {
    getAdminAccounts({ role: "ADMIN", enabled: false, keyword: "kim" });
    expect(apiRequest).toHaveBeenCalledWith("/admin/accounts", {
      query: { role: "ADMIN", enabled: false, keyword: "kim" },
    });
  });

  it("Account 작업별 operation·target을 정확히 바인딩", () => {
    expect(accountActionBindings.create()).toEqual({ operation: "ACCOUNT_CREATE", targetType: "ACCOUNT", targetId: null });
    expect(accountActionBindings.status(9)).toEqual({ operation: "ACCOUNT_STATUS_UPDATE", targetType: "ACCOUNT", targetId: "9" });
    expect(accountActionBindings.role(9)).toEqual({ operation: "ACCOUNT_ROLE_UPDATE", targetType: "ACCOUNT", targetId: "9" });
    expect(accountActionBindings.password(9)).toEqual({ operation: "ACCOUNT_PASSWORD_RESET", targetType: "ACCOUNT", targetId: "9" });
  });

  it("계정 생성에 사용자가 입력한 비밀번호와 ADMIN_ACTION Header를 전달", () => {
    const input: AccountInput = {
      email: "user@example.com",
      name: "사용자",
      password: "initial-password",
      role: "USER",
      enabled: true,
    };
    createAccount(input, verification);
    expect(apiRequest).toHaveBeenCalledWith("/admin/accounts", { method: "POST", headers, json: input });
  });

  it("상태·권한·비밀번호 변경 Endpoint와 Request Body를 정확히 사용", () => {
    updateAccountStatus(9, false, verification);
    updateAccountRole(9, "ADMIN", verification);
    resetAccountPassword(9, "new-password", verification);

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/admin/accounts/9/status", { method: "PATCH", headers, json: { enabled: false } });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/admin/accounts/9/role", { method: "PATCH", headers, json: { role: "ADMIN" } });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/admin/accounts/9/password", { method: "PATCH", headers, json: { newPassword: "new-password" } });
  });
});
