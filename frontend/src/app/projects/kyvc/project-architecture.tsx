"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProjectArchitecture as ProjectArchitectureData } from "@/types/api";
import styles from "./kyvc-detail.module.css";

type ProjectArchitectureProps = {
  projectName: string;
  architectureImageUrl: string | null;
  architecture: ProjectArchitectureData;
};

// Architecture Image와 운영 Notes의 공용 상세 표현
export default function ProjectArchitecture({
  projectName,
  architectureImageUrl,
  architecture,
}: ProjectArchitectureProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = architectureImageUrl === failedImageUrl;

  if (!architectureImageUrl && architecture.notes.length === 0) {
    return <p className={`${styles.emptyValue} type-body`}>-</p>;
  }

  return (
    <div className={styles.architectureVisual} data-architecture>
      {architectureImageUrl ? (
        <figure className={styles.architectureImageFrame}>
          {imageFailed ? (
            <span className={`${styles.architectureImagePlaceholder} type-small`} role="img" aria-label="아키텍처 이미지 없음">
              이미지 미리보기 없음
            </span>
          ) : (
            <Image
              alt={`${projectName} 시스템 아키텍처`}
              className={styles.architectureImage}
              fill
              onError={() => setFailedImageUrl(architectureImageUrl)}
              sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 84vw, 1040px"
              src={architectureImageUrl}
              unoptimized
            />
          )}
        </figure>
      ) : null}
      {architecture.notes.length > 0 ? (
        <dl className={styles.architectureNotes}>
          {architecture.notes.map((note, index) => (
            <div className={styles.architectureNote} key={`${index}-${note.title}`}>
              <dt className="type-title">{note.title}</dt>
              <dd className="type-body">{note.body}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
