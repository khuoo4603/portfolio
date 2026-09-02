"use client";

import Image from "next/image";
import { useState } from "react";

type TechnologyIconProps = {
  className: string;
  name: string;
  size: number;
  src: string | null;
};

// 기술 아이콘의 누락·로딩 실패를 동일한 중립 상태로 전환
export default function TechnologyIcon({ className, name, size, src }: TechnologyIconProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <span
        aria-label={`${name} 아이콘 없음`}
        className={`${className} technology-icon-fallback`}
        role="img"
      >
        ·
      </span>
    );
  }

  return (
    <Image
      alt=""
      className={className}
      height={size}
      onError={() => setFailedSrc(src)}
      src={src}
      unoptimized
      width={size}
    />
  );
}
