import Image from "next/image";
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
  if (!architectureImageUrl && architecture.notes.length === 0) {
    return <p className={`${styles.emptyValue} type-body`}>-</p>;
  }

  return (
    <div className={styles.architectureVisual} data-architecture>
      {architectureImageUrl ? (
        <figure className={styles.architectureImageFrame}>
          <Image
            alt={`${projectName} 시스템 아키텍처`}
            className={styles.architectureImage}
            src={architectureImageUrl}
            fill
            sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 84vw, 1040px"
            unoptimized
          />
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
