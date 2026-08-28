import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { getCurrentUser } from "./auth-api";
import { useAuthSession } from "./use-auth-session";

vi.mock("./auth-api", () => ({ getCurrentUser: vi.fn() }));

const users = {
  USER: { id: 1, email: "user@example.com", name: "사용자", role: "USER" as const },
  ADMIN: { id: 2, email: "admin@example.com", name: "관리자", role: "ADMIN" as const },
};

describe("공통 Auth Session Hook", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each(["USER", "ADMIN"] as const)("/auth/me %s 응답을 authenticated Role 상태로 제공", async (role) => {
    vi.mocked(getCurrentUser).mockResolvedValue(users[role]);
    const { result } = renderHook(() => useAuthSession());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(users[role]);
  });

  it("/auth/me 401을 unauthenticated로 구분", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new ApiError(401, {
      code: "AUTH_UNAUTHORIZED",
      message: "로그인이 필요합니다.",
      traceId: "trace-401",
      fieldErrors: [],
    }));
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(result.current.user).toBeNull();
  });

  it("403과 Network 오류를 비인증 상태로 오인하지 않음", async () => {
    const forbidden = new ApiError(403, {
      code: "AUTH_FORBIDDEN",
      message: "권한이 없습니다.",
      traceId: "trace-403",
      fieldErrors: [],
    });
    vi.mocked(getCurrentUser).mockRejectedValue(forbidden);
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe(forbidden);
  });

  it("Logout 적용 화면이 Session 상태를 즉시 초기화 가능", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(users.USER);
    const { result } = renderHook(() => useAuthSession());
    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    act(() => result.current.clear());

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.user).toBeNull();
  });
});
