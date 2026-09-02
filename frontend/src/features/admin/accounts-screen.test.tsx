import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { AccountItem } from "./admin-types";
import { createAdminChallenge } from "./admin-action-api";
import {
  createAccount,
  getAdminAccounts,
  resetAccountPassword,
  updateAccountRole,
  updateAccountStatus,
} from "./admin-account-api";
import AccountsScreen from "./accounts-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn() };
});
vi.mock("./admin-account-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-account-api")>();
  return {
    ...actual,
    getAdminAccounts: vi.fn(),
    createAccount: vi.fn(),
    updateAccountStatus: vi.fn(),
    updateAccountRole: vi.fn(),
    resetAccountPassword: vi.fn(),
  };
});

const account: AccountItem = {
  id: 9,
  email: "admin@example.com",
  name: "관리자",
  role: "ADMIN",
  enabled: true,
  recentLoginAt: "2026-09-01T10:00:00+09:00",
};
const userAccount: AccountItem = {
  id: 10,
  email: "user@example.com",
  name: "사용자",
  role: "USER",
  enabled: false,
  recentLoginAt: null,
};

function submitOtp(code = "123456") {
  fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
    clipboardData: { getData: () => code },
  });
  fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));
}

describe("Admin Accounts 실제 API 관리", () => {
  beforeEach(() => {
    vi.mocked(getAdminAccounts).mockReset().mockResolvedValue({ items: [account] });
    vi.mocked(createAdminChallenge).mockReset().mockResolvedValue({ challengeId: "challenge-account", expiresAt: "2099-09-01T12:00:00+09:00" });
    vi.mocked(createAccount).mockReset().mockResolvedValue({ id: 10, email: "user@example.com", name: "사용자", role: "USER", enabled: true, createdAt: "2026-09-01T12:00:00+09:00" });
    vi.mocked(updateAccountStatus).mockReset().mockResolvedValue(undefined);
    vi.mocked(updateAccountRole).mockReset().mockResolvedValue(undefined);
    vi.mocked(resetAccountPassword).mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => cleanup());

  it("초기 목록과 role·enabled·keyword Filter를 Backend Query로 조회", async () => {
    render(<AccountsScreen />);

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
    expect(getAdminAccounts).toHaveBeenCalledWith({ keyword: undefined, role: undefined, enabled: undefined });

    fireEvent.change(screen.getByPlaceholderText("이메일 또는 이름"), { target: { value: "kim" } });
    fireEvent.change(screen.getByLabelText("권한"), { target: { value: "ADMIN" } });
    fireEvent.change(screen.getByLabelText("활성 상태"), { target: { value: "false" } });
    fireEvent.click(screen.getByRole("button", { name: "조회" }));

    await waitFor(() => expect(getAdminAccounts).toHaveBeenLastCalledWith({ keyword: "kim", role: "ADMIN", enabled: false }));
  });

  it("계정 작업 메뉴는 내부 Pointer를 유지하고 외부 Pointer에서 닫힘", async () => {
    render(<AccountsScreen />);
    await screen.findByText("admin@example.com");

    const trigger = screen.getByRole("button", { name: "admin@example.com 계정 작업" });
    fireEvent.click(trigger);
    const statusAction = screen.getByRole("button", { name: "비활성화" });
    fireEvent.pointerDown(statusAction);
    expect(statusAction).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("button", { name: "비활성화" })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const reopenedAction = screen.getByRole("button", { name: "비활성화" });
    fireEvent.pointerDown(reopenedAction);
    fireEvent.click(reopenedAction);
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "ACCOUNT_STATUS_UPDATE",
      targetId: "9",
    })));
  });

  it("대표 Critical 작업은 Challenge 대기 중 즉시 SENDING Modal을 열고 READY·VERIFYING으로 전환", async () => {
    let resolveChallenge!: (value: { challengeId: string; expiresAt: string }) => void;
    let resolveMutation!: () => void;
    vi.mocked(createAdminChallenge).mockImplementation(() => new Promise((resolve) => {
      resolveChallenge = resolve;
    }));
    vi.mocked(updateAccountStatus).mockImplementation(() => new Promise<void>((resolve) => {
      resolveMutation = resolve;
    }));
    render(<AccountsScreen />);
    await screen.findByText("admin@example.com");

    fireEvent.click(screen.getByRole("button", { name: "admin@example.com 계정 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "비활성화" }));

    expect(await screen.findByRole("heading", { name: "관리자 이메일 재인증" })).toBeInTheDocument();
    expect(document.querySelector('[data-admin-action-phase="SENDING"]')).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("인증번호 전송 중...");
    expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeDisabled();
    expect(screen.getByRole("button", { name: "변경 실행" })).toBeDisabled();

    await act(async () => resolveChallenge({
      challengeId: "challenge-pending",
      expiresAt: "2099-09-01T12:00:00+09:00",
    }));
    await waitFor(() => expect(document.querySelector('[data-admin-action-phase="READY"]')).toBeInTheDocument());
    expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeEnabled();

    submitOtp("246810");
    await waitFor(() => expect(updateAccountStatus).toHaveBeenCalledWith(9, false, {
      challengeId: "challenge-pending",
      verificationCode: "246810",
    }));
    expect(document.querySelector('[data-admin-action-phase="VERIFYING"]')).toBeInTheDocument();
    expect(screen.getByLabelText("인증번호 1번째 숫자")).toBeDisabled();

    await act(async () => resolveMutation());
    await waitFor(() => expect(screen.queryByRole("heading", { name: "관리자 이메일 재인증" })).not.toBeInTheDocument());
  });

  it("다른 Row 작업 버튼을 누르면 새 Row 메뉴 하나만 표시", async () => {
    vi.mocked(getAdminAccounts).mockResolvedValue({ items: [account, userAccount] });
    render(<AccountsScreen />);
    await screen.findByText("user@example.com");

    const firstTrigger = screen.getByRole("button", { name: "admin@example.com 계정 작업" });
    const secondTrigger = screen.getByRole("button", { name: "user@example.com 계정 작업" });
    fireEvent.click(firstTrigger);
    expect(firstTrigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerDown(secondTrigger);
    fireEvent.click(secondTrigger);
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
    expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { name: "활성화" })).toHaveLength(1);
  });

  it("계정 생성 Password를 ADMIN_ACTION Mutation까지 전달하고 성공 후 재조회", async () => {
    render(<AccountsScreen />);
    await screen.findByText("admin@example.com");
    fireEvent.click(screen.getByRole("button", { name: "계정 생성" }));
    const createDialog = screen.getByRole("dialog");

    fireEvent.change(within(createDialog).getByLabelText("이메일"), { target: { value: "USER@EXAMPLE.COM" } });
    fireEvent.change(within(createDialog).getByLabelText("이름"), { target: { value: "사용자" } });
    fireEvent.change(within(createDialog).getByLabelText("초기 비밀번호"), { target: { value: "initial-password" } });
    fireEvent.click(within(createDialog).getByRole("button", { name: "계정 생성" }));

    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "ACCOUNT_CREATE",
      targetType: "ACCOUNT",
      targetId: null,
    })));
    submitOtp();

    await waitFor(() => expect(createAccount).toHaveBeenCalledWith({
      email: "user@example.com",
      name: "사용자",
      password: "initial-password",
      role: "USER",
      enabled: true,
    }, { challengeId: "challenge-account", verificationCode: "123456" }));
    await waitFor(() => expect(getAdminAccounts).toHaveBeenCalledTimes(2));
    expect(screen.queryByDisplayValue("initial-password")).not.toBeInTheDocument();
  });

  it("상태와 권한 변경에 대상 accountId를 바인딩", async () => {
    render(<AccountsScreen />);
    await screen.findByText("admin@example.com");

    fireEvent.click(screen.getByRole("button", { name: "admin@example.com 계정 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "비활성화" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "ACCOUNT_STATUS_UPDATE",
      targetType: "ACCOUNT",
      targetId: "9",
    })));
    fireEvent.click(screen.getByRole("button", { name: "취소" }));

    fireEvent.click(screen.getByRole("button", { name: "admin@example.com 계정 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "USER로 변경" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenLastCalledWith(expect.objectContaining({
      operation: "ACCOUNT_ROLE_UPDATE",
      targetType: "ACCOUNT",
      targetId: "9",
    })));
  });

  it("입력한 새 Password를 Password Reset Mutation까지 전달", async () => {
    render(<AccountsScreen />);
    await screen.findByText("admin@example.com");
    fireEvent.click(screen.getByRole("button", { name: "admin@example.com 계정 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 초기화" }));
    const passwordDialog = screen.getByRole("dialog");

    fireEvent.change(within(passwordDialog).getByLabelText("새 비밀번호"), { target: { value: "new-password" } });
    fireEvent.click(within(passwordDialog).getByRole("button", { name: "비밀번호 초기화" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "ACCOUNT_PASSWORD_RESET",
      targetType: "ACCOUNT",
      targetId: "9",
    })));
    submitOtp();

    await waitFor(() => expect(resetAccountPassword).toHaveBeenCalledWith(9, "new-password", {
      challengeId: "challenge-account",
      verificationCode: "123456",
    }));
    expect(screen.queryByDisplayValue("new-password")).not.toBeInTheDocument();
  });

  it("마지막 ADMIN 보호 등 Backend 오류를 traceId와 함께 표시", async () => {
    vi.mocked(updateAccountStatus).mockRejectedValue(new ApiError(409, {
      code: "ACCOUNT_LAST_ADMIN",
      message: "마지막 활성 관리자는 비활성화할 수 없습니다.",
      traceId: "trace-last-admin",
      fieldErrors: [],
    }));
    render(<AccountsScreen />);
    await screen.findByText("admin@example.com");
    fireEvent.click(screen.getByRole("button", { name: "admin@example.com 계정 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "비활성화" }));
    await screen.findByRole("heading", { name: "관리자 이메일 재인증" });
    submitOtp();

    expect(await screen.findByText("마지막 활성 관리자는 비활성화할 수 없습니다. (추적 ID: trace-last-admin)")).toBeInTheDocument();
    expect(getAdminAccounts).toHaveBeenCalledTimes(1);
  });
});
