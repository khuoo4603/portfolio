"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "medium" | "small";

type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonClassNameOptions & {
  busy?: boolean;
  children: ReactNode;
};

// Button과 Button 형태 Link·Label이 공유하는 시각 Class 조합
export function buttonClassName({
  variant = "primary",
  size = "medium",
  className,
}: ButtonClassNameOptions = {}) {
  return [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
}

// Admin·Tools 주요 Action의 공통 상태와 시각 표현
export default function Button({
  busy = false,
  children,
  className,
  disabled = false,
  size = "medium",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={busy || undefined}
      className={buttonClassName({ variant, size, className })}
      data-button-variant={variant}
      data-button-size={size}
      disabled={disabled || busy}
    >
      <span className={styles.content}>{children}</span>
      {busy ? <LoaderCircle className={styles.loader} aria-hidden="true" /> : null}
    </button>
  );
}

export type { ButtonProps, ButtonSize, ButtonVariant };
