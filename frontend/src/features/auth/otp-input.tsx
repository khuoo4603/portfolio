"use client";

import { useEffect, useRef } from "react";
import styles from "./auth.module.css";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
};

const OTP_LENGTH = 6;

// Login과 관리자 변경 Dialog에서 공유하는 6자리 숫자 인증 입력
export default function OtpInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  label = "6자리 인증번호",
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || "");

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const replaceDigit = (index: number, digit: string) => {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join("").slice(0, OTP_LENGTH));
  };

  // 숫자 정규화와 다음 입력칸 이동
  const handleChange = (index: number, rawValue: string) => {
    const numbers = rawValue.replace(/\D/g, "");

    if (numbers.length > 1) {
      const next = `${value.slice(0, index)}${numbers}${value.slice(index + 1)}`.slice(0, OTP_LENGTH);
      onChange(next);
      inputRefs.current[Math.min(index + numbers.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    replaceDigit(index, numbers.slice(-1));

    if (numbers && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace와 좌우 방향키 기반 입력칸 이동
  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      replaceDigit(index - 1, "");
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // 여섯 자리 숫자 Paste 분배
  const handlePaste = (event: React.ClipboardEvent<HTMLFieldSetElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <fieldset className={styles.otpFieldset} disabled={disabled} onPaste={handlePaste}>
      <legend className={styles.fieldLabel}>{label}</legend>
      <div className={styles.otpRow}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => { inputRefs.current[index] = node; }}
            className={styles.otpInput}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(index, event.currentTarget.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={`인증번호 ${index + 1}번째 숫자`}
          />
        ))}
      </div>
    </fieldset>
  );
}
