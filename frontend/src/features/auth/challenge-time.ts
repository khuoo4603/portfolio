"use client";

import { useEffect, useState } from "react";

// 인증번호 만료시각 또는 UI 재전송 시각의 남은 초 계산
export function useCountdown(deadline: string | number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [deadline]);

  if (deadline === null) {
    return 0;
  }

  const deadlineMs = typeof deadline === "number" ? deadline : Date.parse(deadline);
  return Number.isFinite(deadlineMs) ? Math.max(0, Math.ceil((deadlineMs - now) / 1000)) : 0;
}

// 인증 Challenge 남은 시간의 mm:ss 표기
export function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
