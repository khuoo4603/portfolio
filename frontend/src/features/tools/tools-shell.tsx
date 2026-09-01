"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { SiteHeader, type HeaderNavigationItem } from "@/app/portfolio-chrome";
import DialogFrame from "@/features/admin/dialog-frame";
import { formatCountdown, useCountdown } from "@/features/auth/challenge-time";
import OtpInput from "@/features/auth/otp-input";
import { formatApiError } from "@/lib/api/client";
import {
  changePassword,
  issuePasswordChallenge,
  logout as logoutRequest,
} from "@/lib/auth/auth-api";
import { useAuthSession } from "@/lib/auth/use-auth-session";
import type { ChallengeResponse, CurrentUser, ToolItem, ToolKey } from "@/types/api";
import { getTools } from "./tools-api";
import styles from "./tools.module.css";

type ToolsSession = {
  user: CurrentUser;
  tools: readonly ToolItem[];
  hasTool: (toolKey: ToolKey) => boolean;
};

const PASSWORD_RESEND_WAIT_MS = 60_000;
const ToolsSessionContext = createContext<ToolsSession | null>(null);

// Tools 하위 화면의 실제 사용자와 활성 Tool 상태 접근
export function useToolsSession() {
  const session = useContext(ToolsSessionContext);

  if (!session) {
    throw new Error("ToolsSessionContext가 필요합니다.");
  }

  return session;
}

// 현재 Session 계정의 읽기 전용 정보 Dialog
function ProfileDialog({
  open,
  user,
  error,
  onClose,
  onPasswordChange,
  onLogout,
}: {
  open: boolean;
  user: CurrentUser;
  error: string;
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
      <p className={`${styles.inlineError} type-small`} role="alert" aria-live="polite">{error}</p>
      <div className={styles.profileActions}>
        <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onLogout}>
          로그아웃
        </button>
        <button className={`${styles.primaryButton} type-body`} type="button" onClick={onPasswordChange}>
          비밀번호 변경
        </button>
      </div>
    </DialogFrame>
  );
}

// 실제 PASSWORD_CHANGE Challenge와 동일 Endpoint 재발급 기반 변경 Dialog
export function PasswordChangeDialog({
  email,
  onClose,
  onSuccess,
}: {
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const initialRequest = useRef<Promise<ChallengeResponse> | null>(null);
  const expiresIn = useCountdown(challenge?.expiresAt ?? null);
  const resendIn = useCountdown(resendAvailableAt);
  const formInProgress = Boolean(code || newPassword || confirmPassword || challengeLoading || submitting);

  useEffect(() => {
    let active = true;
    initialRequest.current ??= issuePasswordChallenge();
    void initialRequest.current
      .then((response) => {
        if (!active) return;
        setChallenge(response);
        setResendAvailableAt(Date.now() + PASSWORD_RESEND_WAIT_MS);
      })
      .catch((caught: unknown) => {
        if (active) setError(formatApiError(caught));
      })
      .finally(() => {
        if (active) setChallengeLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // 60초 제한 후 기존 Password Challenge Endpoint 재호출
  const handleResend = async () => {
    if (resendIn > 0 || challengeLoading) {
      return;
    }

    setChallengeLoading(true);
    setError("");
    try {
      const response = await issuePasswordChallenge();
      setChallenge(response);
      setResendAvailableAt(Date.now() + PASSWORD_RESEND_WAIT_MS);
      setCode("");
    } catch (caught) {
      setError(formatApiError(caught));
    } finally {
      setChallengeLoading(false);
    }
  };

  // 비밀번호 정책과 PASSWORD_CHANGE 인증번호 기반 실제 변경 요청
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!challenge) {
      setError("인증번호 발급을 완료하지 못했습니다.");
      return;
    }
    if (expiresIn === 0) {
      setError("인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("6자리 인증번호를 입력해 주세요.");
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

    setSubmitting(true);
    try {
      await changePassword(challenge.challengeId, code, newPassword);
      onSuccess();
    } catch (caught) {
      setError(formatApiError(caught));
    } finally {
      setSubmitting(false);
    }
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
      <form className={styles.passwordForm} onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className={styles.readOnlyEmail}>
          <span className="type-small">인증번호 전송 이메일</span>
          <strong className="type-body">{email}</strong>
        </div>

        <OtpInput value={code} onChange={setCode} autoFocus label="인증번호" />

        <div className={`${styles.challengeMeta} type-small`}>
          <span>{challengeLoading ? "인증번호 요청 중" : `남은 시간 ${formatCountdown(expiresIn)}`}</span>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendIn > 0 || challengeLoading}
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
          {challenge && expiresIn === 0 && !error
            ? "인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요."
            : error}
        </p>

        <button className={`${styles.primaryButton} type-body`} type="submit" disabled={submitting || challengeLoading}>
          {submitting ? "변경 중" : "비밀번호 변경"}
        </button>
      </form>
    </DialogFrame>
  );
}

function isKnownTool(item: ToolItem): item is ToolItem {
  return item.toolKey === "QUIZ" || item.toolKey === "LINKS";
}

// 공통 Auth Session과 실제 Tool Registry 기반 Tools Shell
export default function ToolsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthSession();
  const [tools, setTools] = useState<ToolItem[] | null>(null);
  const [registryError, setRegistryError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  useEffect(() => {
    if (auth.status !== "authenticated") {
      return;
    }

    let active = true;
    void getTools()
      .then((response) => {
        if (active) setTools(response.items.filter(isKnownTool));
      })
      .catch((caught: unknown) => {
        if (active) setRegistryError(formatApiError(caught));
      });
    return () => {
      active = false;
    };
  }, [auth.status, auth.user?.id]);

  const session = useMemo<ToolsSession | null>(() => {
    if (auth.status !== "authenticated" || !tools) {
      return null;
    }
    return {
      user: auth.user,
      tools,
      hasTool: (toolKey) => tools.some((tool) => tool.toolKey === toolKey),
    };
  }, [auth.status, auth.user, tools]);

  // 실제 Logout과 Local Auth Session 초기화
  const handleLogout = async () => {
    setProfileError("");
    try {
      await logoutRequest();
      auth.clear();
      router.replace("/login");
    } catch (caught) {
      setProfileError(formatApiError(caught));
    }
  };

  if (auth.status === "loading" || (auth.status === "authenticated" && !tools && !registryError)) {
    return <main className={styles.toolsPage} aria-busy="true" aria-label="Tools 불러오는 중" />;
  }
  if (auth.status === "unauthenticated") {
    return null;
  }
  if (auth.status === "error" || registryError || !session) {
    return (
      <main className={styles.toolsPage} role="alert">
        <div className="content-container">{registryError || formatApiError(auth.error)}</div>
      </main>
    );
  }

  const navigation: HeaderNavigationItem[] = session.tools.flatMap((tool) => {
    if (tool.toolKey === "QUIZ") {
      return [{ label: tool.name, href: "/tools/quiz", active: pathname === "/tools/quiz" }];
    }
    if (tool.toolKey === "LINKS") {
      return [{ label: tool.name, href: "/tools/links", active: pathname === "/tools/links" }];
    }
    return [];
  });

  return (
    <div className={styles.toolsShell}>
      <SiteHeader
        mark="Tools"
        markHref="/tools"
        markLabel="Tools 홈"
        navigation={navigation}
        navigationLabel="Tools 주요 메뉴"
        utilityActions={(
          <button className={styles.profileBadge} type="button" onClick={() => setProfileOpen(true)}>
            <span className={styles.profileBadgeAvatar} aria-hidden="true">
              {session.user.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="type-small">{session.user.name}</span>
          </button>
        )}
      />

      <ToolsSessionContext.Provider value={session}>{children}</ToolsSessionContext.Provider>

      <ProfileDialog
        open={profileOpen}
        user={session.user}
        error={profileError}
        onClose={() => setProfileOpen(false)}
        onPasswordChange={() => {
          setProfileOpen(false);
          setPasswordOpen(true);
        }}
        onLogout={() => void handleLogout()}
      />
      {passwordOpen ? (
        <PasswordChangeDialog
          email={session.user.email}
          onClose={() => setPasswordOpen(false)}
          onSuccess={() => {
            auth.clear();
            router.replace("/login");
          }}
        />
      ) : null}
    </div>
  );
}
