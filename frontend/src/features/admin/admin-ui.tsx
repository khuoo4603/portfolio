import { AlertTriangle, LoaderCircle, RotateCcw } from "lucide-react";
import styles from "./admin.module.css";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

// Admin Page 상단의 동일한 정보 위계
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1 className="type-heading">{title}</h1>
        <p className="type-body">{description}</p>
      </div>
      {action && <div className={styles.pageAction}>{action}</div>}
    </header>
  );
}

// Admin 조회 중 정보 밀도를 유지하는 Loading 구조
export function PageLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.loadingPanel} role="status" aria-label="데이터 불러오는 중">
      <div className={styles.loadingHeading} />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={styles.loadingRow} />
      ))}
    </div>
  );
}

// Admin 정보 표시 오류와 명시적 재시도 Action
export function PageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorState} role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <h2 className="type-title">정보를 불러오지 못했습니다</h2>
        <p className="type-body">{message}</p>
      </div>
      <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onRetry}>
        <RotateCcw aria-hidden="true" />
        다시 시도
      </button>
    </div>
  );
}

// 현재 조건의 항목이 없을 때 사용하는 간결한 Empty 상태
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.emptyState}>
      <span aria-hidden="true" />
      <h3 className="type-title">{title}</h3>
      <p className="type-body">{description}</p>
    </div>
  );
}

// Text와 Dot을 함께 사용하는 운영 상태 표기
export function StatusLabel({
  tone,
  children,
}: {
  tone: "success" | "error" | "neutral" | "warning";
  children: React.ReactNode;
}) {
  return (
    <span className={`${styles.statusLabel} ${styles[`status_${tone}`]}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}

// 좁은 Row 안에서 사용하는 ON/OFF 조작
export function StateSwitch({
  enabled,
  onClick,
  disabled = false,
  label,
}: {
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      className={styles.stateSwitch}
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden="true" />
      <strong>{enabled ? "ON" : "OFF"}</strong>
    </button>
  );
}

// 변경 요청의 진행 상태를 유지하는 공통 주요 Button
export function SubmitButton({
  busy,
  children,
  disabled = false,
  type = "submit",
  onClick,
}: {
  busy: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      className={`${styles.primaryButton} type-body`}
      type={type}
      disabled={disabled || busy}
      onClick={onClick}
    >
      <span>{children}</span>
      {busy && <LoaderCircle className={styles.spinIcon} aria-hidden="true" />}
    </button>
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
