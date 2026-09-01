"use client";

import { MailCheck } from "lucide-react";
import { useState } from "react";
import OtpInput from "@/features/auth/otp-input";
import { formatCountdown, useCountdown } from "@/features/auth/challenge-time";
import DialogFrame from "./dialog-frame";
import { SubmitButton } from "./admin-ui";
import styles from "./admin.module.css";

type AdminActionDialogProps = {
  open: boolean;
  actionLabel: string;
  challengeId: string;
  expiresAt: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (code: string) => Promise<void> | void;
  onResend: () => Promise<void> | void;
};

// ADMIN_ACTION 인증번호 입력과 Backend 오류 표시만 담당하는 재인증 Dialog
export default function AdminActionDialog({
  challengeId,
  ...props
}: AdminActionDialogProps) {
  return <AdminActionDialogContent key={challengeId} challengeId={challengeId} {...props} />;
}

function AdminActionDialogContent({
  open,
  actionLabel,
  expiresAt,
  busy,
  error,
  onCancel,
  onConfirm,
  onResend,
}: AdminActionDialogProps) {
  const [code, setCode] = useState("");
  const expiresIn = useCountdown(expiresAt);

  const validCode = /^\d{6}$/.test(code);

  return (
    <DialogFrame
      open={open}
      title="관리자 이메일 재인증"
      description="상태 변경 작업마다 새로운 인증번호 확인이 필요합니다."
      onClose={busy ? () => undefined : onCancel}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      secure
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCancel} disabled={busy}>
            취소
          </button>
          <SubmitButton busy={busy} type="button" onClick={() => void onConfirm(code)} disabled={!validCode || expiresIn === 0}>
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
        onClick={() => void onResend()}
        disabled={busy}
      >
        인증번호 재전송
      </button>

      <p className={`${styles.inlineError} type-small`} role="alert" aria-live="polite">
        {expiresIn === 0 && !error
          ? "인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요."
          : error}
      </p>
    </DialogFrame>
  );
}
