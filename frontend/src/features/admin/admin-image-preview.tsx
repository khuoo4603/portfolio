"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type AdminImagePreviewProps = {
  alt: string;
  fallback: ReactNode;
  sizes: string;
  src: string | null;
};

// 관리자 이미지 미리보기의 누락·로딩 실패 상태 통합
export default function AdminImagePreview({ alt, fallback, sizes, src }: AdminImagePreviewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return fallback;
  }

  return (
    <Image
      alt={alt}
      fill
      onError={() => setFailedSrc(src)}
      sizes={sizes}
      src={src}
      unoptimized
    />
  );
}
