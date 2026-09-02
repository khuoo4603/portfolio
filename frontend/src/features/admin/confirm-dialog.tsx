"use client";

import { useRef, useState } from "react";
import DialogFrame from "./dialog-frame";
import styles from "./admin.module.css";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

// 반복 확인 작업의 동일한 취소·실행 순서 제공
export default function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel,
  cancelLabel = "취소",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const locked = busy || submitting;

  const handleConfirm = async () => {
    if (locked || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      compact
      title={title}
      description={description}
      onClose={locked ? () => undefined : onCancel}
      closeOnBackdrop={!locked}
      closeOnEscape={!locked}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCancel} disabled={locked}>
            {cancelLabel}
          </button>
          <button
            className={`${danger ? styles.dangerButton : styles.primaryButton} type-body`}
            type="button"
            onClick={() => void handleConfirm()}
            disabled={locked}
          >
            {confirmLabel}
          </button>
        </>
      )}
    >
      {detail ? (
        <p className={`${styles.confirmMessage} type-body`}>
          대상: <strong>{detail}</strong>
        </p>
      ) : null}
    </DialogFrame>
  );
}
