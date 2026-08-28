import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, clearCsrfToken } from "@/lib/api/client";
import { getCurrentUser, login, logout, resendAdminLogin, verifyAdminLogin } from "./auth-api";

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
  clearCsrfToken: vi.fn(),
}));

describe("Authentication API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("실제 Login·ADMIN Verify·Resend·Me 계약을 사용", async () => {
    vi.mocked(apiRequest).mockResolvedValue(undefined);

    await login("user@example.com", "password", true);
    await verifyAdminLogin("challenge-1", "123456");
    await resendAdminLogin("challenge-1");
    await getCurrentUser();

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/auth/login", {
      method: "POST",
      json: { email: "user@example.com", password: "password", rememberMe: true },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/auth/admin-login/verify", {
      method: "POST",
      json: { challengeId: "challenge-1", code: "123456" },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/auth/admin-login/resend", {
      method: "POST",
      json: { challengeId: "challenge-1" },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(4, "/auth/me");
  });

  it("Logout 성공과 실패 모두 CSRF Cache를 초기화", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("failure"));

    await logout();
    await expect(logout()).rejects.toThrow("failure");

    expect(apiRequest).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
    expect(clearCsrfToken).toHaveBeenCalledTimes(2);
  });
});
