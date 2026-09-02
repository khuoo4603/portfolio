"use client";

import Image from "next/image";
import ProjectArchitecture from "@/app/projects/kyvc/project-architecture";
import ProjectMediaCarousel from "@/app/projects/kyvc/project-media-carousel";
import { formatProjectPeriod } from "@/features/portfolio/project-detail";
import type { ProjectContentMediaReference, Technology } from "./admin-types";
import type { EditorMedia, ProjectEditorDraft } from "./project-editor-model";
import styles from "./admin.module.css";

function mediaSource(media: EditorMedia) {
  return media.previewUrl || media.imageUrl;
}

function referencedMedia(reference: ProjectContentMediaReference, media: EditorMedia[]) {
  return media.find((item) => !item.deleted && item.mediaType === "CONTENT"
    && (reference.mediaId ? item.id === reference.mediaId : reference.clientKey ? item.clientKey === reference.clientKey : false));
}

function ContentImage({ reference, media, alt }: { reference: ProjectContentMediaReference; media: EditorMedia[]; alt: string }) {
  const item = referencedMedia(reference, media);
  const source = item ? mediaSource(item) : "";
  return source ? <div className={styles.projectPreviewImage}><Image src={source} alt={item?.altText || alt} fill sizes="(max-width: 1023px) 100vw, 720px" unoptimized /></div> : null;
}

// Local Draft를 공개 전에도 렌더링하는 Project Detail Preview
export default function ProjectPreview({ draft, technologyMaster }: { draft: ProjectEditorDraft; technologyMaster: Technology[] }) {
  const period = formatProjectPeriod(draft.project.startedAt, draft.project.endedAt);
  const technologies = [...draft.technologies].sort((left, right) => left.displayOrder - right.displayOrder);
  const carousel = draft.media.filter((item) => item.mediaType === "CAROUSEL" && !item.deleted && mediaSource(item)).map((item, index) => ({
    id: item.id ?? -(index + 1), imageUrl: mediaSource(item), label: item.label, altText: item.altText, displayOrder: item.displayOrder,
  }));
  return (
    <article className={styles.projectPreview} aria-label="Project Detail Preview">
      <header className={styles.projectPreviewHero}>
        <span className="type-small">PROJECT / {draft.project.year ?? "DRAFT"}</span>
        <h2>{draft.project.name || "Untitled Project"}</h2>
        <p>{draft.project.summary || draft.project.tagline || "상세 요약 미입력"}</p>
        <dl><div><dt>역할</dt><dd>{draft.project.detailRole || "—"}</dd></div><div><dt>개발 기간</dt><dd>{period?.text || "—"}</dd></div><div><dt>참여 인원</dt><dd>{draft.project.teamSize ? `${draft.project.teamSize}명` : "—"}</dd></div></dl>
      </header>

      <section className={styles.projectPreviewMedia} aria-label="Carousel Preview">
        {carousel.length > 0 ? <ProjectMediaCarousel media={carousel} projectName={draft.project.name || "Project"} /> : <p className="type-body">Carousel 이미지 없음</p>}
      </section>

      <section className={styles.projectPreviewSection}>
        <h3>기술 스택 · 성과</h3>
        <div className={styles.projectPreviewSplit}>
          <div><h4>기술 스택</h4><ul>{technologies.map((item) => { const technology = technologyMaster.find((value) => value.id === item.technologyId); return <li data-highlighted={item.highlighted ? "true" : "false"} key={item.technologyId}>{technology?.name ?? `Technology #${item.technologyId}`}{item.showOnCard ? " · Card" : ""}</li>; })}</ul></div>
          <div><h4>성과</h4><ol>{draft.content.results.map((item, index) => <li key={`result-${index}`}><strong>{item.title || "제목 미입력"}</strong><p>{item.description}</p></li>)}</ol></div>
        </div>
      </section>

      <section className={styles.projectPreviewSection}>
        <h3>문제 배경 · 주요 기능</h3>
        <div className={styles.projectPreviewSplit}>
          <div>{draft.content.background.map((item, index) => <article key={`background-${index}`}><h4>{item.title || "문제 배경"}</h4><p>{item.body}</p><ContentImage reference={item} media={draft.media} alt="문제 배경 이미지" /></article>)}</div>
          <div>{draft.content.features.map((item, index) => <article key={`feature-${index}`}><h4>{item.title || "기능 미입력"}</h4><p>{item.description}</p><ContentImage reference={item} media={draft.media} alt="주요 기능 이미지" /></article>)}</div>
        </div>
      </section>

      <section className={styles.projectPreviewSection}>
        <h3>직접 담당한 개발 영역</h3>
        <div className={styles.projectPreviewColumns}>{draft.content.development.map((item, index) => <article key={`development-${index}`}><h4>{item.title || "영역 미입력"}</h4><ul>{item.items.map((task, taskIndex) => <li key={`task-${taskIndex}`}>{task}</li>)}</ul><ContentImage reference={item} media={draft.media} alt="개발 영역 이미지" /></article>)}</div>
      </section>

      <section className={styles.projectPreviewSection}>
        <h3>아키텍처</h3>
        <ProjectArchitecture slug={draft.project.slug} projectName={draft.project.name || "Project"} architecture={draft.content.architecture} />
      </section>

      <section className={styles.projectPreviewSection}>
        <h3>기술적 문제 해결</h3>
        <div className={styles.projectPreviewEngineering}>{draft.content.engineering.map((item, index) => <article key={`engineering-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><h4>{item.title || "제목 미입력"}</h4>{item.summary && <p>{item.summary}</p>}<dl><div><dt>Problem</dt><dd>{item.problem}</dd></div><div><dt>Solution</dt><dd>{item.solution}</dd></div><div><dt>Result</dt><dd>{item.result}</dd></div></dl><ContentImage reference={item} media={draft.media} alt="문제 해결 이미지" /></article>)}</div>
      </section>
    </article>
  );
}
