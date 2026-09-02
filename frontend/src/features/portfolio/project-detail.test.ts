import { describe, expect, it } from "vitest";
import {
  EMPTY_PROJECT_FIXTURE,
  KYVC_PROJECT_FIXTURE,
  MEDIA_PROJECT_FIXTURE,
} from "@/test/public-project-fixture";
import { formatProjectPeriod, hasProjectArchitecture, mapProjectDetail } from "./project-detail";

describe("Project Detail Mapping", () => {
  it("종료 프로젝트의 시작·종료일을 포함한 KYvC 114일을 계산", () => {
    expect(formatProjectPeriod("2026-04-27", "2026-08-18")).toEqual({
      text: "2026.04.27 — 2026.08.18",
      duration: "총 114일",
      ongoing: false,
    });
  });

  it("진행 중 프로젝트에 종료일과 총 일수를 생성하지 않음", () => {
    expect(formatProjectPeriod("2026-04-27", null)).toEqual({
      text: "2026.04.27 — 진행 중",
      duration: null,
      ongoing: true,
    });
  });

  it("유효하지 않은 기간은 가짜 표시값으로 보정하지 않음", () => {
    expect(formatProjectPeriod("invalid", null)).toBeNull();
    expect(formatProjectPeriod(null, null)).toBeNull();
  });

  it("KYvC typed Content와 기술·Section 순서를 실제 필드로 구성", () => {
    const model = mapProjectDetail(KYVC_PROJECT_FIXTURE);

    expect(model.summaryText).toBe(KYVC_PROJECT_FIXTURE.summary);
    expect(model.technologies.map((item) => item.name)).toEqual([
      "Java",
      "Spring Boot",
      "Docker",
      "Docker Compose",
      "React",
    ]);
    expect(model.content.results).toEqual([{ title: "Fixture 성과", description: "Fixture 성과 설명" }]);
    expect(model.content.background).toEqual([{ title: "Fixture 배경 제목", body: "Fixture 문제 배경" }]);
    expect(model.content.features).toEqual([{ title: "Fixture 주요 기능", description: "Fixture 기능 설명" }]);
    expect(model.content.development[0]).toEqual({ title: "Backend", items: ["Fixture Backend 작업"] });
    expect(model.content.engineering[0].title).toBe("Fixture 문제 해결");
    expect(model.sections.map((section) => section.id)).toEqual([
      "detail-stack-result",
      "detail-background",
      "detail-development",
      "detail-architecture",
      "detail-engineering",
    ]);
  });

  it("Summary가 없으면 실제 tagline을 사용하고 빈 Content Section을 만들지 않음", () => {
    const model = mapProjectDetail(EMPTY_PROJECT_FIXTURE);

    expect(model.summaryText).toBe("실제 Fixture tagline");
    expect(model.sections).toEqual([]);
    expect(model.media).toEqual([]);
    expect(model.period).toBeNull();
  });

  it("Media와 기술은 displayOrder로 정렬하고 실제 Nullable 필드를 유지", () => {
    const model = mapProjectDetail(MEDIA_PROJECT_FIXTURE);

    expect(model.media.map((item) => item.imageUrl)).toEqual([
      "/fixture/one.webp",
      "/fixture/two.webp",
    ]);
    expect(model.media[0]).toMatchObject({ label: "화면 1", altText: "첫 화면" });
    expect(model.media[1]).toMatchObject({ label: "화면 2", altText: null });
  });

  it("Architecture Note가 하나라도 있을 때만 노출 대상으로 판단", () => {
    expect(hasProjectArchitecture({ notes: [] })).toBe(false);
    expect(hasProjectArchitecture({ notes: [{ title: "Runtime", body: "Docker" }] })).toBe(true);
  });

  it("성과·기능 Description이 없어도 실제 Title을 보존", () => {
    const model = mapProjectDetail({
      ...KYVC_PROJECT_FIXTURE,
      content: {
        ...KYVC_PROJECT_FIXTURE.content,
        results: [{ title: "Title only", description: null }],
        features: [{ title: "Feature only", description: null }],
      },
    });
    expect(model.content.results).toEqual([{ title: "Title only", description: null }]);
    expect(model.content.features).toEqual([{ title: "Feature only", description: null }]);
  });
});
