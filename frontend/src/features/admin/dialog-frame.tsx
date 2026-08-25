"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import styles from "./admin.module.css";

type DialogFrameProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  secure?: boolean;
};

const FOCUSABLE = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";

// Escape와 Focus Trap을 포함한 Admin 공통 Dialog Frame
export default function DialogFrame({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  secure = false,
}: DialogFrameProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")
        || dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <div
        ref={dialogRef}
        className={`${styles.dialogFrame} ${secure ? styles.secureDialog : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        aria-describedby={description ? "admin-dialog-description" : undefined}
      >
        <header className={styles.dialogHeader}>
          <div>
            <h2 id="admin-dialog-title" className="type-title">{title}</h2>
            {description && (
              <p id="admin-dialog-description" className="type-body">{description}</p>
            )}
          </div>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label="대화상자 닫기">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className={styles.dialogBody}>{children}</div>
        {footer && <footer className={styles.dialogFooter}>{footer}</footer>}
      </div>
    </div>
  );
}
