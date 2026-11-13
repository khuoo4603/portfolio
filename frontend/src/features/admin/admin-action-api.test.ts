import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { adminActionHeaders, createAdminChallenge, getAdminActionGrace } from "./admin-action-api";

vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));

describe("ADMIN_ACTION API 계약", () => {
  afterEach(() => vi.clearAllMocks());

  it("실제 Challenge Endpoint에 operation·target·targetId를 전달", async () => {
    await createAdminChallenge({
      operation: "PROJECT_UPDATE",
      targetType: "PROJECT",
      targetId: "7",
    });

    expect(apiRequest).toHaveBeenCalledWith("/admin/auth/challenges", {
      method: "POST",
      json: {
        operation: "PROJECT_UPDATE",
        targetType: "PROJECT",
        targetId: "7",
      },
    });
  });

  it("신규 생성 작업의 nullable targetId를 계약 그대로 전달", async () => {
    await createAdminChallenge({
      operation: "ACCOUNT_CREATE",
      targetType: "ACCOUNT",
      targetId: null,
    });

    expect(apiRequest).toHaveBeenCalledWith("/admin/auth/challenges", {
      method: "POST",
      json: {
        operation: "ACCOUNT_CREATE",
        targetType: "ACCOUNT",
        targetId: null,
      },
    });
  });

  it("Mutation용 관리자 Challenge Header 이름과 값을 정확히 구성", () => {
    expect(adminActionHeaders({
      challengeId: "challenge-7",
      verificationCode: "654321",
    })).toEqual({
      "X-Admin-Challenge-Id": "challenge-7",
      "X-Admin-Verification-Code": "654321",
    });
  });

  it("A2 관리자 작업 유예 상태 Endpoint를 조회", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ verified: true, expiresAt: "2026-11-13T19:30:00+09:00" });

    await getAdminActionGrace();

    expect(apiRequest).toHaveBeenCalledWith("/admin/auth/action-grace");
  });

  it("유예 상태에서는 관리자 OTP Header를 생략", () => {
    expect(adminActionHeaders()).toEqual({});
  });
});
