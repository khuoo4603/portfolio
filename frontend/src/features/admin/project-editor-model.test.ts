import { describe, expect, it } from "vitest";
import type { ProjectDetail } from "./admin-types";
import {
  buildProjectSaveInput,
  createProjectDraft,
  moveProjectItem,
  validateProjectImage,
} from "./project-editor-model";

const detail: ProjectDetail = {
  project: {
    id: 1,
    slug: "draft-project",
    name: "Draft Project",
    year: null,
    tagline: null,
    description: null,
    cardRole: null,
    summary: null,
    detailRole: null,
    startedAt: null,
    endedAt: null,
    teamSize: null,
    thumbnailUrl: null,
    displayOrder: 0,
    enabled: false,
    updatedAt: "2026-09-02T12:00:00+09:00",
  },
  technologies: [],
  content: {
    results: [],
    background: [{ title: null, body: "Body" }],
    features: [],
    development: [],
    architecture: { notes: [] },
    engineering: [],
  },
  architectureImageUrl: "/media/architecture",
  media: [
    { id: 10, imageUrl: "/media/10", label: null, altText: null, displayOrder: 0 },
    { id: 11, imageUrl: "/media/11", label: "Carousel", altText: null, displayOrder: 1 },
  ],
};

describe("Project Editor Local Draft 변환", () => {
  it("기존·삭제·신규 Carousel을 단일 Metadata·File 순서로 구성", () => {
    const draft = createProjectDraft(detail);
    const carouselFile = new File(["carousel"], "carousel.webp", { type: "image/webp" });
    draft.media[0].deleted = true;
    draft.media.push(
      { key: "carousel-new", id: null, clientKey: "carousel-new", imageUrl: "", file: carouselFile, previewUrl: "blob:carousel", label: "New carousel", altText: null, displayOrder: 2, deleted: false },
    );

    const input = buildProjectSaveInput(draft);

    expect(input.mediaFiles).toEqual([carouselFile]);
    expect(input.metadata.mediaChanges).toEqual([
      { id: 10, action: "DELETE" },
      { id: 11, action: "KEEP", label: "Carousel", altText: null, displayOrder: 1 },
      { clientKey: "carousel-new", action: "UPLOAD", uploadIndex: 0, label: "New carousel", altText: null, displayOrder: 2 },
    ]);
  });

  it("Thumbnail mode별 File 포함 여부를 유지", () => {
    const draft = createProjectDraft(detail);
    const thumbnail = new File(["thumbnail"], "thumbnail.png", { type: "image/png" });
    draft.thumbnail = { ...draft.thumbnail, mode: "UPLOAD", file: thumbnail, previewUrl: "blob:thumbnail" };
    expect(buildProjectSaveInput(draft).thumbnail).toBe(thumbnail);

    draft.thumbnail = { ...draft.thumbnail, mode: "REMOVE", file: null, previewUrl: null };
    expect(buildProjectSaveInput(draft).thumbnail).toBeNull();
  });

  it("Architecture Image mode별 File 포함 여부를 유지", () => {
    const draft = createProjectDraft(detail);
    const architectureImage = new File(["architecture"], "architecture.png", { type: "image/png" });
    draft.architectureImage = { ...draft.architectureImage, mode: "UPLOAD", file: architectureImage, previewUrl: "blob:architecture" };
    expect(buildProjectSaveInput(draft).architectureImage).toBe(architectureImage);

    draft.architectureImage = { ...draft.architectureImage, mode: "REMOVE", file: null, previewUrl: null };
    expect(buildProjectSaveInput(draft).architectureImage).toBeNull();
  });

  it("경계 밖 순서 이동과 허용하지 않은 이미지 형식을 안전하게 거부", () => {
    expect(moveProjectItem(["A", "B"], 0, -1)).toEqual(["A", "B"]);
    expect(moveProjectItem(["A", "B"], 0, 1)).toEqual(["B", "A"]);
    expect(validateProjectImage(new File(["gif"], "image.gif", { type: "image/gif" }))).toContain("JPEG");
  });
});
