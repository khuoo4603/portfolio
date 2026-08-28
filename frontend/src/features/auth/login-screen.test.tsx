import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { login, resendAdminLogin, verifyAdminLogin } from "@/lib/auth/auth-api";
import LoginScreen from "./login-screen";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("@/lib/auth/auth-api", () => ({
  login: vi.fn(),
  resendAdminLogin: vi.fn(),
  verifyAdminLogin: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const USER_EMAIL = "user@example.com";
const ADMIN_EMAIL = "admin@example.com";
const PASSWORD = "safe-test-password";
const OTP = "123456";
const CHALLENGE = {
  authenticated: false,
  adminVerificationRequired: true,
  challengeId: "550e8400-e29b-41d4-a716-446655440000",
  expiresAt: "2099-08-28T12:00:00+09:00",
};

function fillCredentials(email: string, password = PASSWORD) {
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: password } });
}

async function openOtpStep() {
  vi.mocked(login).mockResolvedValueOnce(CHALLENGE);
  fillCredentials(ADMIN_EMAIL);
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
  return await screen.findByRole("heading", { name: "관리자 이메일 인증" });
}

function apiError(status: number, code: string, message: string) {
  return new ApiError(status, {
    code,
    message,
    traceId: `trace-${status}`,
    fieldErrors: [],
  });
}

describe("통합 로그인 실제 API 화면", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(login).mockReset();
    vi.mocked(resendAdminLogin).mockReset();
    vi.mocked(verifyAdminLogin).mockReset();
    document.documentElement.dataset.theme = "dark";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("단일 Composition에서 문자별 Flipping Words와 Line Grid Form Surface를 표시", async () => {
    vi.useFakeTimers();

    try {
      render(<LoginScreen />);

      expect(screen.getByRole("heading", { level: 1, name: /Sign in to Tools 또는 Admin/ })).toBeInTheDocument();
      expect(
        screen.getByText(
          "Tools와 Admin을 하나의 계정으로 이용할 수 있습니다. 로그인 후 계정 권한에 맞는 영역으로 연결됩니다.",
        ),
      ).toBeInTheDocument();
      expect(document.querySelector("[data-decoration='page-line-grid']")).toBeInTheDocument();
      expect(document.querySelector("[data-sizing-word='Admin.']")).toHaveAttribute("aria-hidden", "true");

      const flippingWords = screen.getByTestId("flipping-words");
      expect(flippingWords).toHaveTextContent("T");
      expect(flippingWords.querySelector("[data-cursor='dot']")).toBeInTheDocument();

      for (let index = 0; index < 6; index += 1) {
        await act(async () => vi.advanceTimersToNextTimerAsync());
      }
      expect(flippingWords).toHaveTextContent("Tools.");

      for (let index = 0; index < 13; index += 1) {
        await act(async () => vi.advanceTimersToNextTimerAsync());
      }
      expect(flippingWords).toHaveTextContent("Admin.");

      const loginSurface = screen.getByLabelText("로그인 양식");
      expect(loginSurface.querySelector("[data-pattern='line-grid']")).toBeInTheDocument();
      expect(loginSurface.querySelector("[data-decoration='grid-cells']")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Sign in" })).toBeInTheDocument();
      expect(screen.getByText("로그인 후 계정 권한에 맞는 영역으로 이동합니다.")).toBeInTheDocument();
      expect(screen.getByLabelText("이메일")).toBeInTheDocument();
      expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    } finally {
      cleanup();
      vi.useRealTimers();
    }
  });

  it("USER 로그인 응답을 Tools 경로로 연결", async () => {
    vi.mocked(login).mockResolvedValue({ authenticated: true, role: "USER", redirect: "/tools" });
    render(<LoginScreen />);

    fillCredentials(USER_EMAIL);
    fireEvent.click(screen.getByRole("checkbox", { name: "자동 로그인" }));
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/tools"));
    expect(login).toHaveBeenCalledWith(USER_EMAIL, PASSWORD, true);
    expect(screen.getByRole("checkbox", { name: "자동 로그인" })).toBeChecked();
  });

  it("Login ErrorResponse의 Field Error와 traceId를 기존 오류 영역에 표시", async () => {
    vi.mocked(login).mockRejectedValue(new ApiError(400, {
      code: "COMMON_VALIDATION_ERROR",
      message: "입력값을 확인하세요.",
      traceId: "trace-login",
      fieldErrors: [{ field: "email", message: "이메일 형식이 올바르지 않습니다." }],
    }));
    render(<LoginScreen />);

    fillCredentials(ADMIN_EMAIL);
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("이메일 형식이 올바르지 않습니다. (추적 ID: trace-login)")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("ADMIN Challenge를 동일 Surface의 OTP 단계로 전환하고 입력 이메일을 표시", async () => {
    render(<LoginScreen />);

    expect(await openOtpStep()).toBeInTheDocument();
    expect(screen.getByText(ADMIN_EMAIL)).toBeInTheDocument();
    expect(screen.queryByText(/maskedEmail/)).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("ADMIN OTP 성공 응답을 관리자 경로로 연결", async () => {
    vi.mocked(verifyAdminLogin).mockResolvedValue({ authenticated: true, role: "ADMIN", redirect: "/admin" });
    render(<LoginScreen />);
    await openOtpStep();

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => OTP },
    });
    fireEvent.click(screen.getByRole("button", { name: "인증 완료" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
    expect(verifyAdminLogin).toHaveBeenCalledWith(CHALLENGE.challengeId, OTP);
  });

  it.each([
    [401, "AUTH_VERIFICATION_FAILED", "인증번호가 일치하지 않습니다."],
    [410, "AUTH_VERIFICATION_EXPIRED", "인증번호가 만료되었습니다."],
    [423, "AUTH_VERIFICATION_LOCKED", "인증 시도 횟수를 초과했습니다."],
  ])("ADMIN OTP %s 오류를 Backend 메시지와 traceId로 표시", async (status, code, message) => {
    vi.mocked(verifyAdminLogin).mockRejectedValue(apiError(status, code, message));
    render(<LoginScreen />);
    await openOtpStep();

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "인증 완료" }));

    expect(await screen.findByText(`${message} (추적 ID: trace-${status})`)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("60초 후 ADMIN OTP 재전송 응답의 새 Challenge를 반영", async () => {
    vi.useFakeTimers({ now: new Date("2026-08-28T00:00:00Z") });
    vi.mocked(login).mockResolvedValue(CHALLENGE);
    vi.mocked(resendAdminLogin).mockResolvedValue({
      challengeId: "660e8400-e29b-41d4-a716-446655440000",
      expiresAt: "2099-08-28T12:05:00+09:00",
    });

    try {
      render(<LoginScreen />);
      fillCredentials(ADMIN_EMAIL);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "로그인" }));
        await Promise.resolve();
      });
      await act(async () => vi.advanceTimersByTimeAsync(160));
      expect(screen.getByRole("button", { name: /재전송까지 6[01]초/ })).toBeDisabled();

      await act(async () => vi.advanceTimersByTimeAsync(60_000));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "인증번호 재전송" }));
        await Promise.resolve();
      });

      expect(resendAdminLogin).toHaveBeenCalledWith(CHALLENGE.challengeId);
      expect(screen.getByRole("button", { name: /재전송까지 6[01]초/ })).toBeDisabled();
    } finally {
      cleanup();
      vi.useRealTimers();
    }
  });
});
