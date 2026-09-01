"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "@/app/theme-toggle";
import { formatApiError } from "@/lib/api/client";
import { login, resendAdminLogin, verifyAdminLogin } from "@/lib/auth/auth-api";
import OtpInput from "./otp-input";
import { formatCountdown, useCountdown } from "./challenge-time";
import styles from "./auth.module.css";

const FLIP_WORDS = ["Tools.", "Admin."];
const TYPING_SPEED_MS = 110;
const DELETING_SPEED_MS = 100;
const PAUSE_BEFORE_DELETE_MS = 1_500;
const WORD_CHANGE_DELAY_MS = 240;
const RESEND_WAIT_MS = 60 * 1_000;

type FlipPhase = "typing" | "pause" | "deleting";

type ChallengeState = {
  challengeId: string;
  expiresAt: string;
  email: string;
};

// 문자별 입력·정지·삭제 순서의 Tools와 Admin 전환
function FlipWords() {
  const [frame, setFrame] = useState({
    wordIndex: 0,
    visibleLength: 1,
    phase: "typing" as FlipPhase,
  });

  useEffect(() => {
    let delay = TYPING_SPEED_MS;

    if (frame.phase === "pause") {
      delay = PAUSE_BEFORE_DELETE_MS;
    } else if (frame.phase === "deleting") {
      delay = frame.visibleLength === 0 ? WORD_CHANGE_DELAY_MS : DELETING_SPEED_MS;
    }

    const timer = window.setTimeout(() => {
      setFrame((current) => {
        const currentWord = FLIP_WORDS[current.wordIndex];

        if (current.phase === "typing") {
          const visibleLength = Math.min(current.visibleLength + 1, currentWord.length);
          return {
            ...current,
            visibleLength,
            phase: visibleLength === currentWord.length ? "pause" : "typing",
          };
        }

        if (current.phase === "pause") {
          return { ...current, phase: "deleting" };
        }

        if (current.visibleLength > 0) {
          return { ...current, visibleLength: current.visibleLength - 1 };
        }

        return {
          wordIndex: (current.wordIndex + 1) % FLIP_WORDS.length,
          visibleLength: 1,
          phase: "typing",
        };
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [frame]);

  const visibleWord = FLIP_WORDS[frame.wordIndex].slice(0, frame.visibleLength);

  return (
    <span className={styles.flipSegment} aria-hidden="true" data-motion>
      <span className={styles.flipSizer} aria-hidden="true" data-sizing-word="Admin.">
        Admin.
      </span>
      <span className={styles.flipAnimatedLine} data-testid="flipping-words">
        <span className={styles.flipCharacters}>
          {Array.from(visibleWord).map((character, index) => (
            <span
              key={`${frame.wordIndex}-${index}`}
              className={`${styles.flipCharacter} ${frame.phase === "deleting" && index === frame.visibleLength - 1 ? styles.flipCharacterDeleting : styles.flipCharacterEntering}`}
            >
              {character}
            </span>
          ))}
        </span>
        <span className={styles.cursorDot} data-phase={frame.phase} data-cursor="dot" />
      </span>
    </span>
  );
}

// 통합 로그인과 ADMIN 이메일 2차 인증 화면
export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "verification">("credentials");
  const [leaving, setLeaving] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const expiresIn = useCountdown(challenge?.expiresAt || null);
  const resendIn = useCountdown(resendAvailableAt);

  // 동일 Surface 내부 Form 전환 Motion
  const changeStep = (nextStep: "credentials" | "verification") => {
    setLeaving(true);
    window.setTimeout(() => {
      setStep(nextStep);
      setLeaving(false);
      setBusy(false);
    }, 160);
  };

  // Backend 로그인 응답의 USER·ADMIN 분기 처리
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("이메일 형식을 확인해 주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setBusy(true);

    try {
      const response = await login(normalizedEmail, password, rememberMe);

      if (response.authenticated && response.role === "USER" && response.redirect === "/tools") {
        router.push(response.redirect);
        return;
      }
      if (!response.authenticated
        && response.adminVerificationRequired
        && response.challengeId
        && response.expiresAt) {
        setChallenge({
          challengeId: response.challengeId,
          expiresAt: response.expiresAt,
          email: normalizedEmail,
        });
        setResendAvailableAt(Date.now() + RESEND_WAIT_MS);
        setCode("");
        changeStep("verification");
        return;
      }

      setError("로그인 응답을 확인할 수 없습니다.");
      setBusy(false);
    } catch (requestError) {
      setError(formatApiError(requestError));
      setBusy(false);
    }
  };

  // ADMIN 인증번호 검증과 관리자 화면 이동
  const handleVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!challenge || code.length !== 6) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }

    if (expiresIn === 0) {
      setError("인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요.");
      return;
    }

    setBusy(true);
    try {
      const response = await verifyAdminLogin(challenge.challengeId, code);
      if (response.authenticated && response.role === "ADMIN" && response.redirect === "/admin") {
        router.push(response.redirect);
        return;
      }
      setError("관리자 인증 응답을 확인할 수 없습니다.");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  // 기존 ADMIN Challenge 교체와 재전송 대기시간 갱신
  const handleResend = async () => {
    if (!challenge || resendIn > 0 || busy) {
      return;
    }

    setError("");
    setBusy(true);
    try {
      const response = await resendAdminLogin(challenge.challengeId);
      setChallenge({
        challengeId: response.challengeId,
        expiresAt: response.expiresAt,
        email: challenge.email,
      });
      setCode("");
      setResendAvailableAt(Date.now() + RESEND_WAIT_MS);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  // Credentials 단계 복귀와 기존 Challenge 화면 폐기
  const handleBackToLogin = () => {
    setError("");
    setCode("");
    setChallenge(null);
    setResendAvailableAt(null);
    changeStep("credentials");
  };

  return (
    <main className={styles.authPage}>
      {/* 중앙집중형 인증 페이지 Line Grid */}
      <div className={styles.pageBackgroundGrid} aria-hidden="true" data-decoration="page-line-grid" />

      <header className={styles.authHeader}>
        <Link className={styles.authBrand} href="/" aria-label="포트폴리오 홈">
          <span>KH</span>
          <span>KIM HYUNWOO</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className={styles.authContent}>
        <section className={styles.identityContent} aria-labelledby="auth-identity-title">
          <h1
            id="auth-identity-title"
            className={`${styles.identityHeading} type-display-xl`}
            aria-label="Sign in to Tools 또는 Admin"
          >
            <span>Sign in to</span>
            <FlipWords />
          </h1>
          <p className={`${styles.identityDescription} type-body`}>
            Tools와 Admin을 하나의 계정으로 이용할 수 있습니다. 로그인 후 계정 권한에 맞는 영역으로 연결됩니다.
          </p>
        </section>

        <section className={styles.loginSurface} aria-label="로그인 양식">
          <div className={styles.surfaceGrid} aria-hidden="true" data-pattern="line-grid" />
          <div className={styles.gridCells} aria-hidden="true" data-decoration="grid-cells" />
          <div className={styles.formLayer}>
            <div
              key={step}
              className={`${styles.formContent} ${leaving ? styles.formLeaving : ""}`}
              data-motion
            >
              {step === "credentials" ? (
                <form className={styles.credentialsForm} onSubmit={handleLogin} noValidate>
                  <div className={styles.formHeading}>
                    <h2 className="type-title">Sign in</h2>
                    <p className="type-body">로그인 후 계정 권한에 맞는 영역으로 이동합니다.</p>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={`${styles.fieldLabel} type-small`} htmlFor="login-email">이메일</label>
                    <input
                      id="login-email"
                      className={`${styles.textInput} type-body`}
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(event) => setEmail(event.currentTarget.value)}
                      placeholder="name@example.com"
                      disabled={busy}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={`${styles.fieldLabel} type-small`} htmlFor="login-password">비밀번호</label>
                    <div className={styles.passwordField}>
                      <input
                        id="login-password"
                        className={`${styles.textInput} type-body`}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.currentTarget.value)}
                        placeholder="비밀번호 입력"
                        disabled={busy}
                      />
                      <button
                        className={styles.passwordToggle}
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                      >
                        {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  <label className={`${styles.checkboxRow} type-body`}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.currentTarget.checked)}
                      disabled={busy}
                    />
                    <span aria-hidden="true" />
                    자동 로그인
                  </label>

                  <p className={`${styles.formError} type-small`} role="alert" aria-live="polite">
                    {error}
                  </p>

                  <button
                    className={`${styles.primaryButton} ${styles.loginSubmitButton} type-body`}
                    type="submit"
                    disabled={busy}
                  >
                    <span>{busy ? "로그인 확인 중" : "로그인"}</span>
                    {busy && <LoaderCircle className={styles.loaderIcon} aria-hidden="true" />}
                  </button>
                </form>
              ) : (
                <form className={styles.verificationForm} onSubmit={handleVerification} noValidate>
                  <div className={styles.formHeading}>
                    <h2 className="type-title">관리자 이메일 인증</h2>
                    <p className="type-body">
                      등록된 관리자 이메일로 전송된 6자리 인증번호를 입력해 주세요.
                    </p>
                    {challenge?.email && (
                      <p className={`${styles.maskedEmail} type-small`}>{challenge.email}</p>
                    )}
                  </div>

                  <OtpInput value={code} onChange={setCode} disabled={busy} autoFocus />

                  <div className={`${styles.challengeMeta} type-small`}>
                    <span>남은 시간</span>
                    <strong>{formatCountdown(expiresIn)}</strong>
                  </div>

                  <button
                    className={`${styles.resendButton} type-small`}
                    type="button"
                    onClick={handleResend}
                    disabled={busy || resendIn > 0}
                  >
                    {resendIn > 0 ? `재전송까지 ${resendIn}초` : "인증번호 재전송"}
                  </button>

                  <p className={`${styles.formError} type-small`} role="alert" aria-live="polite">
                    {expiresIn === 0 && !error ? "인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요." : error}
                  </p>

                  <button
                    className={`${styles.primaryButton} type-body`}
                    type="submit"
                    disabled={busy || code.length !== 6 || expiresIn === 0}
                  >
                    <span>{busy ? "인증 확인 중" : "인증 완료"}</span>
                    {busy && <LoaderCircle className={styles.loaderIcon} aria-hidden="true" />}
                  </button>

                  <button className={`${styles.textButton} type-small`} type="button" onClick={handleBackToLogin}>
                    이전 로그인 정보 수정
                  </button>
                </form>
              )}
            </div>

            <Link className={`${styles.backLink} type-small`} href="/">
              <ArrowLeft aria-hidden="true" />
              포트폴리오로 돌아가기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
