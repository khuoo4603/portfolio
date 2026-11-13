"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore, type ReactNode } from "react";
import Button from "@/components/ui/button";
import DialogFrame from "@/components/ui/dialog-frame";
import styles from "./admin.module.css";

type OrderManagementDialogProps = {
  open: boolean;
  dirty: boolean;
  busy?: boolean;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
  children: ReactNode;
};

const subscribeToDom = () => () => undefined;
const getClientReady = () => true;
const getServerReady = () => false;

// Site 탭 패널의 stacking context를 벗어난 공통 표시 순서 모달
export default function OrderManagementDialog({ open, dirty, busy = false, onClose, onReset, onSave, children }: OrderManagementDialogProps) {
  const mounted = useSyncExternalStore(subscribeToDom, getClientReady, getServerReady);

  const close = () => {
    if (busy) return;
    if (dirty && !window.confirm("저장하지 않은 순서 변경을 버리시겠습니까?")) return;
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <DialogFrame
      open={open}
      variant="admin"
      title="표시 순서 관리"
      onClose={close}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      footer={(
        <>
          <Button variant="secondary" type="button" disabled={!dirty || busy} onClick={onReset}>초기화</Button>
          <Button type="button" busy={busy} disabled={!dirty || busy} onClick={onSave}>순서 저장</Button>
        </>
      )}
    >
      <div className={styles.orderDialogContent}>
        <div className={styles.orderDialogScroll}>{children}</div>
      </div>
    </DialogFrame>,
    document.body,
  );
}
