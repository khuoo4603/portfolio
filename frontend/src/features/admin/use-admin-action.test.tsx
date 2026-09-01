import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { createAdminChallenge } from "./admin-action-api";
import { useAdminAction } from "./use-admin-action";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn() };
});

const binding = {
  operation: "PROJECT_UPDATE" as const,
  targetType: "PROJECT" as const,
  targetId: "7",
  actionLabel: "프로젝트 수정",
};

describe("공통 ADMIN_ACTION 실행 Hook", () => {
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
    expect(result.current.dialog?.challengeId).toBe("challenge-a");
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
    act(() => {
      first = result.current.start({ ...binding, mutation: vi.fn() });
      void result.current.start({ ...binding, mutation: vi.fn() });
    });

    expect(createAdminChallenge).toHaveBeenCalledTimes(1);
    expect(result.current.dialog).toMatchObject({
      actionLabel: "프로젝트 수정",
      challengeId: null,
      expiresAt: null,
      issuing: true,
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
    });
    expect(result.current.dialog?.error).toContain("trace-mail");
    expect(result.current.startError).toBe("");

    await act(() => result.current.dialog?.onResend());
    expect(createAdminChallenge).toHaveBeenNthCalledWith(2, expect.objectContaining(binding));
    expect(result.current.dialog).toMatchObject({
      challengeId: "challenge-retry",
      expiresAt: "2026-09-01T14:10:00+09:00",
      error: "",
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
});
