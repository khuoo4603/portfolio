import type {
  ProjectDetail,
  ProjectFields,
  ProjectMedia,
  ProjectMediaChange,
  ProjectSaveContent,
  ProjectSaveInput,
  ProjectTechnologyInput,
} from "./admin-types";

export type EditorMedia = {
  key: string;
  id: number | null;
  clientKey: string | null;
  imageUrl: string;
  file: File | null;
  previewUrl: string | null;
  label: string | null;
  altText: string | null;
  displayOrder: number;
  deleted: boolean;
};

export type ThumbnailDraft = {
  mode: "KEEP" | "REMOVE" | "UPLOAD";
  imageUrl: string | null;
  file: File | null;
  previewUrl: string | null;
};

export type ArchitectureImageDraft = ThumbnailDraft;

export type ProjectEditorDraft = {
  project: ProjectFields;
  content: ProjectSaveContent;
  technologies: ProjectTechnologyInput[];
  thumbnail: ThumbnailDraft;
  architectureImage: ArchitectureImageDraft;
  media: EditorMedia[];
};

// Editor GET 응답의 nullable 값을 제어 가능한 Local Draft로 변환
export function createProjectDraft(detail: ProjectDetail): ProjectEditorDraft {
  return {
    project: {
      slug: detail.project.slug,
      name: detail.project.name,
      year: detail.project.year,
      tagline: detail.project.tagline,
      description: detail.project.description,
      cardRole: detail.project.cardRole,
      summary: detail.project.summary,
      detailRole: detail.project.detailRole,
      startedAt: detail.project.startedAt,
      endedAt: detail.project.endedAt,
      teamSize: detail.project.teamSize,
      displayOrder: detail.project.displayOrder,
    },
    content: {
      results: detail.content.results.map((item) => ({ ...item })),
      background: detail.content.background.map((item) => ({ ...item })),
      features: detail.content.features.map((item) => ({ ...item })),
      development: detail.content.development.map((item) => ({ ...item, items: [...item.items] })),
      architecture: {
        notes: detail.content.architecture.notes.map((note) => ({ ...note })),
      },
      engineering: detail.content.engineering.map((item) => ({ ...item })),
    },
    technologies: detail.technologies.map((item) => ({
      technologyId: item.technologyId,
      showOnCard: item.showOnCard,
      highlighted: item.highlighted,
      displayOrder: item.displayOrder,
    })),
    thumbnail: {
      mode: "KEEP",
      imageUrl: detail.project.thumbnailUrl,
      file: null,
      previewUrl: null,
    },
    architectureImage: {
      mode: "KEEP",
      imageUrl: detail.architectureImageUrl,
      file: null,
      previewUrl: null,
    },
    media: detail.media.map(toEditorMedia),
  };
}

function toEditorMedia(media: ProjectMedia): EditorMedia {
  return {
    key: `media-${media.id}`,
    id: media.id,
    clientKey: null,
    imageUrl: media.imageUrl,
    file: null,
    previewUrl: null,
    label: media.label,
    altText: media.altText,
    displayOrder: media.displayOrder,
    deleted: false,
  };
}

// Dirty 비교용 File 식별 정보와 Draft 데이터 직렬화
export function projectDraftSignature(draft: ProjectEditorDraft) {
  return JSON.stringify({
    project: draft.project,
    content: draft.content,
    technologies: draft.technologies,
    thumbnail: {
      mode: draft.thumbnail.mode,
      imageUrl: draft.thumbnail.imageUrl,
      file: fileSignature(draft.thumbnail.file),
    },
    architectureImage: {
      mode: draft.architectureImage.mode,
      imageUrl: draft.architectureImage.imageUrl,
      file: fileSignature(draft.architectureImage.file),
    },
    media: draft.media.map((item) => ({
      ...item,
      file: fileSignature(item.file),
      previewUrl: undefined,
    })),
  });
}

function fileSignature(file: File | null) {
  return file ? { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified } : null;
}

// Local Draft의 신규 File 순서와 Metadata uploadIndex 단일 계약 조합
export function buildProjectSaveInput(draft: ProjectEditorDraft): ProjectSaveInput {
  const uploads = draft.media.filter((item) => item.id === null && !item.deleted && item.file);
  const uploadIndexes = new Map(uploads.map((item, index) => [item.clientKey, index]));
  return {
    metadata: {
      project: draft.project,
      content: draft.content,
      technologies: [...draft.technologies].sort((left, right) => left.displayOrder - right.displayOrder),
      thumbnailMode: draft.thumbnail.mode,
      architectureImageMode: draft.architectureImage.mode,
      mediaChanges: draft.media.flatMap<ProjectMediaChange>((item) => {
        if (item.id !== null) {
          return item.deleted ? [{ id: item.id, action: "DELETE" as const }] : [{
            id: item.id,
            action: "KEEP" as const,
            label: item.label,
            altText: item.altText,
            displayOrder: item.displayOrder,
          }];
        }
        if (item.deleted || !item.file || !item.clientKey) return [];
        return [{
          clientKey: item.clientKey,
          action: "UPLOAD" as const,
          uploadIndex: uploadIndexes.get(item.clientKey),
          label: item.label,
          altText: item.altText,
          displayOrder: item.displayOrder,
        }];
      }),
    },
    thumbnail: draft.thumbnail.mode === "UPLOAD" ? draft.thumbnail.file : null,
    architectureImage: draft.architectureImage.mode === "UPLOAD" ? draft.architectureImage.file : null,
    mediaFiles: uploads.flatMap((item) => item.file ? [item.file] : []),
  };
}

// JPEG·PNG·WEBP 기본 File 선택 제약
export function validateProjectImage(file: File) {
  const extension = file.name.toLowerCase().split(".").pop();
  const validExtension = extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "webp";
  const validType = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
  if (!validExtension || !validType) return "JPEG, PNG, WEBP 파일만 선택할 수 있습니다.";
  if (file.size > 5 * 1024 * 1024) return "이미지 파일은 5MB 이하여야 합니다.";
  return "";
}

// 배열 항목의 경계 내 위·아래 순서 이동
export function moveProjectItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
