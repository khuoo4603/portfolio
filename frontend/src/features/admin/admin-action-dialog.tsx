"use client";

import { MailCheck } from "lucide-react";
import { useState } from "react";
import OtpInput from "@/features/auth/otp-input";
import { formatCountdown, useCountdown } from "@/features/auth/challenge-time";
import {
  MOCK_ADMIN_OTP,
  MOCK_OTP_DURATION_MS,
  MOCK_RESEND_WAIT_MS,
} from "@/features/auth/mock-auth";
import DialogFrame from "./dialog-frame";
import { SubmitButton } from "./admin-ui";
import styles from "./admin.module.css";

type AdminActionDialogProps = {
  open: boolean;
  actionLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

// 상태 변경 전 Mock 관리자 인증번호를 확인하는 재인증 Dialog
export default function AdminActionDialog({
  open,
  actionLabel,
  onCancel,
  onConfirm,
}: AdminActionDialogProps) {
  const [expiresAt, setExpiresAt] = useState<string | null>(() => (
    new Date(Date.now() + MOCK_OTP_DURATION_MS).toISOString()
  ));
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(() => (
    Date.now() + MOCK_RESEND_WAIT_MS
  ));
  const expiresIn = useCountdown(expiresAt);
  const resendIn = useCountdown(resendAvailableAt);

  // Mock 인증번호 만료시각과 재전송 대기시간 갱신
  const handleResend = () => {
    if (busy || resendIn > 0) {
      return;
    }

    setExpiresAt(new Date(Date.now() + MOCK_OTP_DURATION_MS).toISOString());
    setResendAvailableAt(Date.now() + MOCK_RESEND_WAIT_MS);
    setCode("");
    setError("");
  };

  // 유효한 Mock 인증번호 확인 후 대기 중인 로컬 변경 실행
  const handleConfirm = async () => {
    if (code.length !== 6) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }

    if (expiresIn === 0) {
      setError("인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요.");
      return;
    }

    if (code !== MOCK_ADMIN_OTP) {
      setError("관리자 인증번호를 확인해 주세요.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await onConfirm();
    } catch {
      setError("변경 작업을 완료하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      title="관리자 이메일 재인증"
      description="상태 변경 작업마다 새로운 인증번호 확인이 필요합니다."
      onClose={busy ? () => undefined : onCancel}
      secure
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCancel} disabled={busy}>
            취소
          </button>
          <SubmitButton busy={busy} type="button" onClick={handleConfirm} disabled={code.length !== 6 || expiresIn === 0}>
            변경 실행
          </SubmitButton>
        </>
      )}
    >
      <div className={styles.secureActionSummary}>
        <MailCheck aria-hidden="true" />
        <div>
          <span className="type-small">현재 작업</span>
          <strong className="type-body">{actionLabel}</strong>
        </div>
      </div>

      <OtpInput value={code} onChange={setCode} disabled={busy} autoFocus label="관리자 인증번호" />
      <div className={`${styles.challengeMeta} type-small`}>
        <span>남은 시간</span>
        <strong>{formatCountdown(expiresIn)}</strong>
      </div>
      <button
        className={`${styles.textButton} type-small`}
        type="button"
        onClick={handleResend}
        disabled={busy || resendIn > 0}
      >
        {resendIn > 0 ? `재전송까지 ${resendIn}초` : "인증번호 재전송"}
      </button>

      <p className={`${styles.inlineError} type-small`} role="alert" aria-live="polite">
        {expiresIn === 0 && !error
          ? "인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요."
          : error}
      </p>
    </DialogFrame>
  );
}
