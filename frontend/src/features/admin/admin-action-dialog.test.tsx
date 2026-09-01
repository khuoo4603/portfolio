import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminActionDialog from "./admin-action-dialog";

const future = () => new Date(Date.now() + 5 * 60_000).toISOString();

function props(overrides: Partial<React.ComponentProps<typeof AdminActionDialog>> = {}) {
  return {
    open: true,
    actionLabel: "KYVC 프로젝트 비공개 전환",
    challengeId: "challenge-a",
    expiresAt: future(),
    issuing: false,
    resending: false,
    submitting: false,
    error: "",
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    onResend: vi.fn(),
    ...overrides,
  };
}

describe("관리자 ADMIN_ACTION 재인증 Dialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("최초 Challenge 발급 중에는 Loading만 표시하고 OTP 제출 UI를 숨김", () => {
    render(<AdminActionDialog {...props({ challengeId: null, expiresAt: null, issuing: true })} />);

    expect(screen.getByRole("status")).toHaveTextContent("인증번호 전송 중...");
    expect(screen.queryByLabelText("인증번호 1번째 숫자")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "변경 실행" })).not.toBeInTheDocument();
    expect(screen.getByText("KYVC 프로젝트 비공개 전환")).toBeInTheDocument();
  });

  it("Challenge 발급 실패를 Modal 안에 표시하고 다시 전송 가능", () => {
    const onResend = vi.fn();
    render(<AdminActionDialog {...props({
      challengeId: null,
      expiresAt: null,
      error: "인증 메일을 전송하지 못했습니다. (추적 ID: trace-mail)",
      onResend,
    })} />);

    expect(screen.getByText("인증번호 전송에 실패했습니다.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("trace-mail");
    fireEvent.click(screen.getByRole("button", { name: "다시 전송" }));
    expect(onResend).toHaveBeenCalledOnce();
  });

  it("재전송 중에는 기존 OTP UI 대신 재전송 Loading을 표시", () => {
    render(<AdminActionDialog {...props({ issuing: true, resending: true })} />);

    expect(screen.getByRole("status")).toHaveTextContent("인증번호 재전송 중...");
    expect(screen.queryByLabelText("인증번호 1번째 숫자")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "변경 실행" })).not.toBeInTheDocument();
  });

  it("임의의 6자리 인증번호를 정답 판정 없이 제출", () => {
    const onConfirm = vi.fn();
    render(<AdminActionDialog {...props({ onConfirm })} />);

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));

    expect(onConfirm).toHaveBeenCalledWith("654321");
    expect(screen.getByText("KYVC 프로젝트 비공개 전환")).toBeInTheDocument();
  });

  it("6자리 숫자가 아니면 제출 버튼을 비활성화", () => {
    const onConfirm = vi.fn();
    render(<AdminActionDialog {...props({ onConfirm })} />);

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => "12345" },
    });

    expect(screen.getByRole("button", { name: "변경 실행" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Backend 오류와 재발급 요청을 그대로 표시·전달", () => {
    const onResend = vi.fn();
    render(<AdminActionDialog {...props({ error: "인증번호가 일치하지 않습니다. (추적 ID: trace-action)", onResend })} />);

    expect(screen.getByRole("alert")).toHaveTextContent("trace-action");
    fireEvent.click(screen.getByRole("button", { name: "인증번호 재전송" }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it("재발급으로 challengeId가 바뀌면 기존 입력을 제거", () => {
    const { rerender } = render(<AdminActionDialog {...props()} />);
    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => "654321" },
    });

    rerender(<AdminActionDialog {...props({ challengeId: "challenge-b" })} />);

    expect(screen.getByLabelText("인증번호 1번째 숫자")).toHaveValue("");
  });
});
