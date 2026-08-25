import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginScreen from "./login-screen";
import {
  MOCK_ADMIN_ACCOUNT,
  MOCK_ADMIN_OTP,
  MOCK_LOGIN_PASSWORD,
  MOCK_USER_ACCOUNT,
} from "./mock-auth";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function fillCredentials(email: string, password = MOCK_LOGIN_PASSWORD) {
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: password } });
}

async function openOtpStep() {
  fillCredentials(MOCK_ADMIN_ACCOUNT.email);
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
  return await screen.findByRole("heading", { name: "관리자 이메일 인증" });
}

describe("통합 로그인 Mock 화면", () => {
  beforeEach(() => {
    pushMock.mockReset();
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

  it("USER Mock 계정을 Tools 경로로 연결", async () => {
    render(<LoginScreen />);

    fillCredentials(MOCK_USER_ACCOUNT.email);
    fireEvent.click(screen.getByRole("checkbox", { name: "자동 로그인" }));
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/tools"));
    expect(screen.getByRole("checkbox", { name: "자동 로그인" })).toBeChecked();
  });

  it("잘못된 계정 정보를 통합 오류 문구로 표시", () => {
    render(<LoginScreen />);

    fillCredentials(MOCK_ADMIN_ACCOUNT.email, `${MOCK_LOGIN_PASSWORD}-wrong`);
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByText("이메일 또는 비밀번호를 확인하세요.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("ADMIN Mock 계정을 동일 Surface의 OTP 단계로 전환", async () => {
    render(<LoginScreen />);

    expect(await openOtpStep()).toBeInTheDocument();
    expect(screen.getByText(MOCK_ADMIN_ACCOUNT.email)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("올바른 Mock OTP를 관리자 경로로 연결", async () => {
    render(<LoginScreen />);
    await openOtpStep();

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => MOCK_ADMIN_OTP },
    });
    fireEvent.click(screen.getByRole("button", { name: "인증 완료" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
  });

  it("잘못된 Mock OTP를 인증 오류로 표시", async () => {
    render(<LoginScreen />);
    await openOtpStep();

    fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
      clipboardData: { getData: () => "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "인증 완료" }));

    expect(screen.getByText("인증번호를 확인해 주세요.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
