import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { createAdminChallenge, getAdminActionGrace } from "./admin-action-api";
import { useAdminAction } from "./use-admin-action";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn(), getAdminActionGrace: vi.fn() };
});

const binding = {
  operation: "PROJECT_UPDATE" as const,
  targetType: "PROJECT" as const,
  targetId: "7",
  actionLabel: "프로젝트 수정",
};

describe("공통 ADMIN_ACTION 실행 Hook", () => {
  beforeEach(() => {
    vi.mocked(getAdminActionGrace).mockResolvedValue({ verified: false, expiresAt: null });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("Challenge 응답을 저장하고 임의 6자리 코드와 challengeId로 Mutation 실행", async () => {
    vi.mocked(createAdminChallenge).mockResolvedValue({
      challengeId: "challenge-a",
      expiresAt: "2026-09-01T14:00:00+09:00",
    });
    const mutation = vi.fn().mockResolvedValue({ id: 7 });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAdminAction());

    await act(() => result.current.start({ ...binding, mutation, onSuccess }));

    expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining(binding));
    expect(result.current.dialog).toMatchObject({
      phase: "READY",
      challengeId: "challenge-a",
      expiresAt: "2026-09-01T14:00:00+09:00",
      actionLabel: "프로젝트 수정",
    });

    await act(() => result.current.dialog?.onConfirm("654321"));

    expect(mutation).toHaveBeenCalledWith({
      challengeId: "challenge-a",
      verificationCode: "654321",
    });
    expect(onSuccess).toHaveBeenCalledWith({ id: 7 });
    expect(result.current.dialog).toBeNull();
  });

  it("유효한 서버 유예가 있으면 Dialog 없이 OTP Header 없는 Mutation 실행", async () => {
    vi.mocked(getAdminActionGrace).mockResolvedValue({
      verified: true,
      expiresAt: "2026-11-13T19:30:00+09:00",
    });
    const mutation = vi.fn().mockResolvedValue({ id: 7 });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAdminAction());

    await act(() => result.current.start({ ...binding, mutation, onSuccess }));

    expect(createAdminChallenge).not.toHaveBeenCalled();
    expect(mutation).toHaveBeenCalledWith(undefined);
    expect(onSuccess).toHaveBeenCalledWith({ id: 7 });
    expect(result.current.dialog).toBeNull();
  });

  it("유예 확인 후 Backend가 재인증을 요구하면 원 작업을 한 번만 Dialog로 재시도", async () => {
    vi.mocked(getAdminActionGrace).mockResolvedValue({
      verified: true,
      expiresAt: "2026-11-13T19:30:00+09:00",
    });
    vi.mocked(createAdminChallenge).mockResolvedValue({
      challengeId: "challenge-race",
      expiresAt: "2026-11-13T14:05:00+09:00",
    });
    const mutation = vi.fn()
      .mockRejectedValueOnce(new ApiError(403, {
        code: "AUTH_ADMIN_ACTION_REAUTH_REQUIRED",
        message: "관리자 변경 작업 재인증이 필요합니다.",
        traceId: "trace-reauth",
        fieldErrors: [],
      }))
      .mockResolvedValueOnce({ id: 7 });
    const { result } = renderHook(() => useAdminAction());

    await act(() => result.current.start({ ...binding, mutation }));

    expect(mutation).toHaveBeenNthCalledWith(1, undefined);
    expect(result.current.dialog).toMatchObject({ phase: "READY", challengeId: "challenge-race" });

    await act(() => result.current.dialog?.onConfirm("654321"));

    expect(mutation).toHaveBeenNthCalledWith(2, {
      challengeId: "challenge-race",
      verificationCode: "654321",
    });
    expect(mutation).toHaveBeenCalledTimes(2);
  });

  it("유예 조회의 일반 오류는 재인증으로 오인하지 않고 작업을 실행하지 않음", async () => {
    vi.mocked(getAdminActionGrace).mockRejectedValue(new ApiError(503, {
      code: "COMMON_INTERNAL_ERROR",
      message: "요청 처리 중 오류가 발생했습니다.",
      traceId: "trace-grace",
      fieldErrors: [],
    }));
    const mutation = vi.fn();
    const { result } = renderHook(() => useAdminAction());

    await act(() => result.current.start({ ...binding, mutation }));

    expect(createAdminChallenge).not.toHaveBeenCalled();
    expect(mutation).not.toHaveBeenCalled();
    expect(result.current.dialog).toBeNull();
    expect(result.current.startError).toContain("trace-grace");
  });

  it("재발급은 같은 바인딩으로 새 Challenge를 만들고 현재 ID를 교체", async () => {
    vi.mocked(createAdminChallenge)
      .mockResolvedValueOnce({ challengeId: "challenge-a", expiresAt: "2026-09-01T14:00:00+09:00" })
      .mockResolvedValueOnce({ challengeId: "challenge-b", expiresAt: "2026-09-01T14:05:00+09:00" });
    const { result } = renderHook(() => useAdminAction());
    await act(() => result.current.start({ ...binding, mutation: vi.fn() }));

    await act(() => result.current.dialog?.onResend());

    expect(createAdminChallenge).toHaveBeenNthCalledWith(2, expect.objectContaining(binding));
    expect(result.current.dialog).toMatchObject({
      challengeId: "challenge-b",
      expiresAt: "2026-09-01T14:05:00+09:00",
    });
  });

  it("Backend 인증 실패를 traceId와 함께 유지하고 Mutation을 자동 재시도하지 않음", async () => {
    vi.mocked(createAdminChallenge).mockResolvedValue({
      challengeId: "challenge-a",
      expiresAt: "2026-09-01T14:00:00+09:00",
    });
    const mutation = vi.fn().mockRejectedValue(new ApiError(403, {
      code: "AUTH_ADMIN_ACTION_MISMATCH",
      message: "관리자 재인증 정보가 일치하지 않습니다.",
      traceId: "trace-admin-action",
      fieldErrors: [],
    }));
    const { result } = renderHook(() => useAdminAction());
    await act(() => result.current.start({ ...binding, mutation }));

    await act(() => result.current.dialog?.onConfirm("111111"));

    expect(mutation).toHaveBeenCalledTimes(1);
    expect(result.current.dialog?.error).toContain("trace-admin-action");
    expect(result.current.dialog?.phase).toBe("ERROR");
    expect(result.current.dialog?.challengeId).toBe("challenge-a");
  });

  it("Verification ERROR 뒤 같은 바인딩 재전송으로 새 Challenge READY 상태를 복구", async () => {
    vi.mocked(createAdminChallenge)
      .mockResolvedValueOnce({ challengeId: "challenge-a", expiresAt: "2026-09-01T14:00:00+09:00" })
      .mockResolvedValueOnce({ challengeId: "challenge-b", expiresAt: "2026-09-01T14:05:00+09:00" });
    const mutation = vi.fn().mockRejectedValue(new ApiError(403, {
      code: "AUTH_ADMIN_ACTION_MISMATCH",
      message: "관리자 재인증 정보가 일치하지 않습니다.",
      traceId: "trace-retry",
      fieldErrors: [],
    }));
    const { result } = renderHook(() => useAdminAction());
    await act(() => result.current.start({ ...binding, mutation }));
    await act(() => result.current.dialog?.onConfirm("111111"));

    expect(result.current.dialog?.phase).toBe("ERROR");
    await act(() => result.current.dialog?.onResend());

    expect(createAdminChallenge).toHaveBeenNthCalledWith(2, expect.objectContaining(binding));
    expect(result.current.dialog).toMatchObject({
      phase: "READY",
      challengeId: "challenge-b",
      error: "",
    });
    expect(mutation).toHaveBeenCalledTimes(1);
  });

  it("Mutation 진행 중 중복 제출을 한 번으로 제한", async () => {
    vi.mocked(createAdminChallenge).mockResolvedValue({
      challengeId: "challenge-a",
      expiresAt: "2026-09-01T14:00:00+09:00",
    });
    let resolveMutation!: () => void;
    const mutation = vi.fn(() => new Promise<void>((resolve) => { resolveMutation = resolve; }));
    const { result } = renderHook(() => useAdminAction());
    await act(() => result.current.start({ ...binding, mutation }));

    let first!: Promise<void>;
    act(() => {
      first = result.current.dialog!.onConfirm("222222") as Promise<void>;
      void result.current.dialog!.onConfirm("222222");
    });

    expect(mutation).toHaveBeenCalledTimes(1);
    expect(result.current.dialog?.phase).toBe("VERIFYING");
    resolveMutation();
    await act(() => first);
  });

  it("서로 다른 Mutation마다 새 Challenge를 발급", async () => {
    vi.mocked(createAdminChallenge)
      .mockResolvedValueOnce({ challengeId: "challenge-project", expiresAt: "2026-09-01T14:00:00+09:00" })
      .mockResolvedValueOnce({ challengeId: "challenge-account", expiresAt: "2026-09-01T14:05:00+09:00" });
    const firstMutation = vi.fn().mockResolvedValue(undefined);
    const secondMutation = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminAction());

    await act(() => result.current.start({ ...binding, mutation: firstMutation }));
    await act(() => result.current.dialog?.onConfirm("333333"));
    await act(() => result.current.start({
      operation: "ACCOUNT_STATUS_UPDATE",
      targetType: "ACCOUNT",
      targetId: "15",
      actionLabel: "계정 비활성화",
      mutation: secondMutation,
    }));

    expect(createAdminChallenge).toHaveBeenCalledTimes(2);
    expect(secondMutation).not.toHaveBeenCalled();
    expect(result.current.dialog?.challengeId).toBe("challenge-account");
  });

  it("Challenge 발급 중 중복 시작 요청을 한 번으로 제한", async () => {
    let resolveChallenge!: (value: { challengeId: string; expiresAt: string }) => void;
    vi.mocked(createAdminChallenge).mockImplementation(() => new Promise((resolve) => { resolveChallenge = resolve; }));
    const { result } = renderHook(() => useAdminAction());

    let first!: Promise<void>;
    await act(async () => {
      first = result.current.start({ ...binding, mutation: vi.fn() });
      void result.current.start({ ...binding, mutation: vi.fn() });
      await Promise.resolve();
    });

    expect(createAdminChallenge).toHaveBeenCalledTimes(1);
    expect(result.current.dialog).toMatchObject({
      actionLabel: "프로젝트 수정",
      challengeId: null,
      expiresAt: null,
      issuing: true,
      phase: "SENDING",
    });
    resolveChallenge({ challengeId: "challenge-a", expiresAt: "2026-09-01T14:00:00+09:00" });
    await act(() => first);
  });

  it("최초 Challenge 실패를 Dialog에 유지하고 같은 작업으로 재시도", async () => {
    vi.mocked(createAdminChallenge)
      .mockRejectedValueOnce(new ApiError(503, {
        code: "MAIL_SEND_FAILED",
        message: "인증 메일을 전송하지 못했습니다.",
        traceId: "trace-mail",
        fieldErrors: [],
      }))
      .mockResolvedValueOnce({ challengeId: "challenge-retry", expiresAt: "2026-09-01T14:10:00+09:00" });
    const { result } = renderHook(() => useAdminAction());

    await act(() => result.current.start({ ...binding, mutation: vi.fn() }));
    expect(result.current.dialog).toMatchObject({
      challengeId: null,
      expiresAt: null,
      issuing: false,
      phase: "ERROR",
    });
    expect(result.current.dialog?.error).toContain("trace-mail");
    expect(result.current.startError).toBe("");

    await act(() => result.current.dialog?.onResend());
    expect(createAdminChallenge).toHaveBeenNthCalledWith(2, expect.objectContaining(binding));
    expect(result.current.dialog).toMatchObject({
      challengeId: "challenge-retry",
      expiresAt: "2026-09-01T14:10:00+09:00",
      error: "",
      phase: "READY",
    });
  });

  it("Challenge 발급 401은 Dialog를 열지 않고 /login으로 이동", async () => {
    vi.mocked(createAdminChallenge).mockRejectedValue(new ApiError(401, {
      code: "AUTH_UNAUTHORIZED",
      message: "로그인이 필요합니다.",
      traceId: "trace-401",
      fieldErrors: [],
    }));
    const { result } = renderHook(() => useAdminAction());

    await act(() => result.current.start({ ...binding, mutation: vi.fn() }));

    expect(result.current.dialog).toBeNull();
    expect(result.current.startError).toContain("trace-401");
    expect(navigation.replace).toHaveBeenCalledWith("/login");
    await waitFor(() => expect(result.current.issuing).toBe(false));
  });

  it.each([
    ["AUTH_ADMIN_ACTION_EXPIRED", "인증번호가 만료되었습니다."],
    ["AUTH_ADMIN_ACTION_LOCKED", "인증 시도 횟수를 초과했습니다."],
  ])("%s 검증 실패를 ERROR로 유지", async (code, message) => {
    vi.mocked(createAdminChallenge).mockResolvedValue({
      challengeId: "challenge-a",
      expiresAt: "2026-09-01T14:00:00+09:00",
    });
    const mutation = vi.fn().mockRejectedValue(new ApiError(403, {
      code,
      message,
      traceId: "trace-policy",
      fieldErrors: [],
    }));
    const { result } = renderHook(() => useAdminAction());
    await act(() => result.current.start({ ...binding, mutation }));

    await act(() => result.current.dialog?.onConfirm("123456"));

    expect(result.current.dialog).toMatchObject({
      phase: "ERROR",
      challengeId: "challenge-a",
    });
    expect(result.current.dialog?.error).toContain("trace-policy");
  });
});
