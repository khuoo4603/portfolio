"use client";

import { FlaskConical } from "lucide-react";
import DialogFrame from "./dialog-frame";
import styles from "./admin.module.css";

type LocalActionDialogProps = {
  open: boolean;
  actionLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

// 실제 저장 API 연결 전 Mock 화면의 로컬 상태 변경을 명시적으로 격리
export default function LocalActionDialog({
  open,
  actionLabel,
  onCancel,
  onConfirm,
}: LocalActionDialogProps) {
  return (
    <DialogFrame
      open={open}
      title="로컬 미리보기 변경"
      description="실제 Backend 저장이나 관리자 재인증을 수행하지 않습니다."
      onClose={onCancel}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCancel}>
            취소
          </button>
          <button className={`${styles.primaryButton} type-body`} type="button" onClick={onConfirm}>
            로컬 변경 적용
          </button>
        </>
      )}
    >
      <div className={styles.secureActionSummary}>
        <FlaskConical aria-hidden="true" />
        <div>
          <span className="type-small">미리보기 작업</span>
          <strong className="type-body">{actionLabel}</strong>
        </div>
      </div>
    </DialogFrame>
  );
}
