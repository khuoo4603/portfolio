"use client";

import ProjectDetailContent from "@/app/projects/[slug]/project-detail-content";
import detailStyles from "@/app/projects/kyvc/kyvc-detail.module.css";
import { mapProjectDetail } from "@/features/portfolio/project-detail";
import type { PublicProjectDetail } from "@/types/api";
import type { Technology } from "./admin-types";
import type { ProjectEditorDraft } from "./project-editor-model";
import styles from "./admin.module.css";

// Local Draft를 Public Project Detail 계약으로 변환
function toPreviewProject(draft: ProjectEditorDraft, technologyMaster: Technology[]): PublicProjectDetail {
  const technologies = [...draft.technologies]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .flatMap((item) => {
      const technology = technologyMaster.find((value) => value.id === item.technologyId);
      return technology ? [{
        id: technology.id,
        name: technology.name,
        category: technology.category,
        iconUrl: technology.iconUrl,
        highlighted: item.highlighted,
        displayOrder: item.displayOrder,
      }] : [];
    });
  const media = draft.media
    .filter((item) => !item.deleted && (item.previewUrl || item.imageUrl))
    .map((item, index) => ({
      id: item.id ?? -(index + 1),
      imageUrl: item.previewUrl || item.imageUrl,
      label: item.label,
      altText: item.altText,
      displayOrder: item.displayOrder,
    }));

  return {
    id: 0,
    slug: draft.project.slug,
    name: draft.project.name,
    year: draft.project.year,
    tagline: draft.project.tagline,
    summary: draft.project.summary,
    detailRole: draft.project.detailRole,
    startedAt: draft.project.startedAt,
    endedAt: draft.project.endedAt,
    teamSize: draft.project.teamSize,
    thumbnailUrl: draft.thumbnail.previewUrl
      || (draft.thumbnail.mode === "KEEP" ? draft.thumbnail.imageUrl : null),
    architectureImageUrl: draft.architectureImage.previewUrl
      || (draft.architectureImage.mode === "KEEP" ? draft.architectureImage.imageUrl : null),
    technologies,
    content: draft.content,
    media,
  };
}

// Admin 전용 표시를 배제한 Public 공용 렌더러 기반 Draft Preview
export default function ProjectPreview({ draft, technologyMaster }: { draft: ProjectEditorDraft; technologyMaster: Technology[] }) {
  const project = mapProjectDetail(toPreviewProject(draft, technologyMaster));
  return (
    <article className={`portfolio-shell ${detailStyles.detailShell} ${styles.projectPreview}`} aria-label="Project Detail Preview">
      <ProjectDetailContent project={project} />
    </article>
  );
}
