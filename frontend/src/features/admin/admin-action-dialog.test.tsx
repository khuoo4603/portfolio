import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOCK_ADMIN_OTP } from "@/features/auth/mock-auth";
import AdminActionDialog from "./admin-action-dialog";

describe("관리자 Mock 재인증 Dialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("올바른 6자리 Mock OTP에서 대기 중인 변경을 실행", async () => {
    const onConfirm = vi.fn();

    render(
      <AdminActionDialog
        open
        actionLabel="KYVC 프로젝트 비공개 전환"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => MOCK_ADMIN_OTP },
    });
    fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(screen.getByText("KYVC 프로젝트 비공개 전환")).toBeInTheDocument();
  });

  it("잘못된 Mock OTP에서 변경 실행을 차단", () => {
    const onConfirm = vi.fn();
    render(
      <AdminActionDialog
        open
        actionLabel="계정 비활성화"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));

    expect(screen.getByText("관리자 인증번호를 확인해 주세요.")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
