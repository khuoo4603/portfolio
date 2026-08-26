"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import styles from "./border-glow.module.css";

type BorderGlowProps = {
  children: ReactNode;
  className?: string;
};

// Pointer 접근 방향 기반 Border Glow 카드 표현
export default function BorderGlow({ children, className }: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 카드 중심과 가장자리 기준 Glow 방향 및 근접도 갱신
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    const deltaX = x - halfWidth;
    const deltaY = y - halfHeight;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    const proximity = Math.min(
      Math.max(Math.abs(deltaX) / halfWidth, Math.abs(deltaY) / halfHeight),
      1,
    );

    card.style.setProperty("--glow-angle", `${angle}deg`);
    card.style.setProperty("--glow-proximity", proximity.toFixed(3));
  };

  // Pointer 이탈 시 Border Glow 비활성화
  const handlePointerLeave = () => {
    cardRef.current?.style.setProperty("--glow-proximity", "0");
  };

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-border-glow
      onPointerCancel={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={cardRef}
    >
      <span aria-hidden="true" className={styles.glow} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
