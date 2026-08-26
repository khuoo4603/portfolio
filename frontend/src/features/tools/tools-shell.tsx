"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import { SiteHeader, type HeaderNavigationItem } from "@/app/portfolio-chrome";
import DialogFrame from "@/features/admin/dialog-frame";
import { formatCountdown, useCountdown } from "@/features/auth/challenge-time";
import {
  MOCK_CURRENT_TOOLS_USER,
  MOCK_OTP_DURATION_MS,
  MOCK_PASSWORD_OTP,
  MOCK_RESEND_WAIT_MS,
} from "@/features/auth/mock-auth";
import OtpInput from "@/features/auth/otp-input";
import {
  MOCK_TOOLS,
  type CurrentUser,
  type ToolItem,
  type ToolKey,
} from "./mock-tools";
import styles from "./tools.module.css";

type ToolsSession = {
  user: CurrentUser;
  tools: readonly ToolItem[];
  hasTool: (toolKey: ToolKey) => boolean;
};

const ToolsSessionContext = createContext<ToolsSession | null>(null);

// Tools 하위 화면의 Mock 사용자와 활성 Tool 상태 접근
export function useToolsSession() {
  const session = useContext(ToolsSessionContext);

  if (!session) {
    throw new Error("ToolsSessionContext가 필요합니다.");
  }

  return session;
}

// 현재 Mock 계정의 읽기 전용 정보 Dialog
function ProfileDialog({
  open,
  user,
  onClose,
  onPasswordChange,
  onLogout,
}: {
  open: boolean;
  user: CurrentUser;
  onClose: () => void;
  onPasswordChange: () => void;
  onLogout: () => void;
}) {
  return (
    <DialogFrame
      open={open}
      compact
      title="Profile"
      description="현재 계정 정보"
      onClose={onClose}
    >
      <dl className={styles.profileDetails}>
        <div>
          <dt className="type-small">이름</dt>
          <dd className="type-body">{user.name}</dd>
        </div>
        <div>
          <dt className="type-small">이메일</dt>
          <dd className="type-body">
            <a href={`mailto:${user.email}`}>{user.email}</a>
          </dd>
        </div>
      </dl>
      <div className={styles.profileActions}>
        <button
          className={`${styles.secondaryButton} type-body`}
          type="button"
          onClick={onLogout}
        >
          로그아웃
        </button>
        <button
          className={`${styles.primaryButton} type-body`}
          type="button"
          onClick={onPasswordChange}
        >
          비밀번호 변경
        </button>
      </div>
    </DialogFrame>
  );
}

// PASSWORD_CHANGE Mock 인증번호와 로컬 Timer 기반 변경 Dialog
function PasswordChangeDialog({
  email,
  onClose,
  onSuccess,
}: {
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [expiresAt, setExpiresAt] = useState(() => (
    new Date(Date.now() + MOCK_OTP_DURATION_MS).toISOString()
  ));
  const [resendAvailableAt, setResendAvailableAt] = useState(() => (
    Date.now() + MOCK_RESEND_WAIT_MS
  ));
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const expiresIn = useCountdown(expiresAt);
  const resendIn = useCountdown(resendAvailableAt);
  const formInProgress = Boolean(code || newPassword || confirmPassword);

  // Mock 인증번호 만료시각과 재전송 대기시간 갱신
  const handleResend = () => {
    if (resendIn > 0) {
      return;
    }

    setExpiresAt(new Date(Date.now() + MOCK_OTP_DURATION_MS).toISOString());
    setResendAvailableAt(Date.now() + MOCK_RESEND_WAIT_MS);
    setCode("");
    setError("");
  };

  // 비밀번호 정책과 Mock PASSWORD_CHANGE 인증번호 검증
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (expiresIn === 0) {
      setError("인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }

    if (code !== MOCK_PASSWORD_OTP) {
      setError("인증번호를 확인해 주세요.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 64) {
      setError("새 비밀번호는 8자 이상 64자 이하로 입력해 주세요.");
      return;
    }

    if (newPassword.trim() !== newPassword) {
      setError("새 비밀번호의 앞뒤에는 공백을 사용할 수 없습니다.");
      return;
    }

    if (newPassword.toLowerCase() === email.trim().toLowerCase()) {
      setError("이메일과 동일한 비밀번호는 사용할 수 없습니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    onSuccess();
  };

  return (
    <DialogFrame
      open
      title="비밀번호 변경"
      description="등록된 이메일 인증 후 모든 Session 종료"
      onClose={onClose}
      closeOnBackdrop={!formInProgress}
      closeOnEscape={!formInProgress}
    >
      <form className={styles.passwordForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.readOnlyEmail}>
          <span className="type-small">인증번호 전송 이메일</span>
          <strong className="type-body">{email}</strong>
        </div>

        <OtpInput value={code} onChange={setCode} autoFocus label="인증번호" />

        <div className={`${styles.challengeMeta} type-small`}>
          <span>남은 시간 {formatCountdown(expiresIn)}</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendIn > 0}
          >
            {resendIn > 0 ? `재전송까지 ${resendIn}초` : "인증번호 재전송"}
          </button>
        </div>

        <label className={styles.formField}>
          <span className="type-small">새 비밀번호</span>
          <input
            className="type-body"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
          />
        </label>

        <label className={styles.formField}>
          <span className="type-small">새 비밀번호 확인</span>
          <input
            className="type-body"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          />
        </label>

        <p className={`${styles.passwordPolicy} type-small`}>
          8~64자 · 앞뒤 공백 불가 · 이메일과 동일한 값 불가
        </p>

        <p className={`${styles.inlineError} type-small`} role="alert" aria-live="polite">
          {expiresIn === 0 && !error
            ? "인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요."
            : error}
        </p>

        <button className={`${styles.primaryButton} type-body`} type="submit">
          비밀번호 변경
        </button>
      </form>
    </DialogFrame>
  );
}

// Tools Mock Context와 공통 Header·Profile 흐름
export default function ToolsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const session = useMemo<ToolsSession>(() => ({
    user: MOCK_CURRENT_TOOLS_USER,
    tools: MOCK_TOOLS,
    hasTool: (toolKey) => MOCK_TOOLS.some((tool) => tool.toolKey === toolKey),
  }), []);

  const navigation: HeaderNavigationItem[] = [
    { label: "Quiz", href: "/tools/quiz", active: pathname === "/tools/quiz" },
    { label: "Links", href: "/tools/links", active: pathname === "/tools/links" },
  ];

  // Mock 화면 종료와 로그인 화면 복귀
  const goToLogin = () => {
    router.replace("/login");
  };

  return (
    <div className={styles.toolsShell}>
      <SiteHeader
        mark="Tools"
        markHref="/tools"
        markLabel="Tools 홈"
        navigation={navigation}
        navigationLabel="Tools 주요 메뉴"
        utilityActions={(
          <>
            <button
              className={styles.profileBadge}
              type="button"
              onClick={() => setProfileOpen(true)}
            >
              <span className={styles.profileBadgeAvatar} aria-hidden="true">
                {session.user.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="type-small">{session.user.name}</span>
            </button>
          </>
        )}
      />

      <ToolsSessionContext.Provider value={session}>
        {children}
      </ToolsSessionContext.Provider>

      <ProfileDialog
        open={profileOpen}
        user={session.user}
        onClose={() => setProfileOpen(false)}
        onPasswordChange={() => {
          setProfileOpen(false);
          setPasswordOpen(true);
        }}
        onLogout={goToLogin}
      />
      {passwordOpen && (
        <PasswordChangeDialog
          email={session.user.email}
          onClose={() => setPasswordOpen(false)}
          onSuccess={goToLogin}
        />
      )}
    </div>
  );
}
