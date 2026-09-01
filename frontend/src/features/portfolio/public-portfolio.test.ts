import { describe, expect, it } from "vitest";
import {
  groupProfiles,
  groupTechnologies,
  mapContents,
  mapExternalLinks,
  mapProjects,
  mapPublicPortfolio,
} from "./public-portfolio";
import { PUBLIC_PORTFOLIO_FIXTURE } from "@/test/public-portfolio-fixture";
import type { PortfolioContent, ProfileEntry, PublicTechnology } from "@/types/api";

describe("Public Portfolio Mapping", () => {
  it("16개 관리 Slot만 매핑하고 빈 콘텐츠와 계약 밖 코드를 제외", () => {
    const content = mapContents([
      { category: "MAIN", contentCode: "HERO_STATEMENT", contentValue: "첫 줄\n둘째 줄" },
      { category: "MAIN", contentCode: "HERO_DESCRIPTION", contentValue: "  " },
      { category: "MAIN", contentCode: "UNKNOWN", contentValue: "제외" } as unknown as PortfolioContent,
    ]);

    expect(content).toEqual({ HERO_STATEMENT: "첫 줄\n둘째 줄" });
    expect(content.HERO_DESCRIPTION).toBeUndefined();
    expect((content as Record<string, string>).UNKNOWN).toBeUndefined();
  });

  it("Public Fixture가 UI Copy 없이 정확한 16개 관리 Slot만 사용", () => {
    expect(PUBLIC_PORTFOLIO_FIXTURE.portfolioContents).toHaveLength(16);
    expect(PUBLIC_PORTFOLIO_FIXTURE.portfolioContents.map((item) => item.contentCode)).toEqual([
      "NAME",
      "ENGLISH_NAME",
      "POSITION",
      "AFFILIATION",
      "HERO_STATEMENT",
      "HERO_DESCRIPTION",
      "ABOUT_STATEMENT",
      "ABOUT_DESCRIPTION_1",
      "ABOUT_DESCRIPTION_2",
      "DEVELOPMENT_VALUE_1_TITLE",
      "DEVELOPMENT_VALUE_1_DESCRIPTION",
      "DEVELOPMENT_VALUE_2_TITLE",
      "DEVELOPMENT_VALUE_2_DESCRIPTION",
      "DEVELOPMENT_VALUE_3_TITLE",
      "DEVELOPMENT_VALUE_3_DESCRIPTION",
      "EMAIL",
    ]);
  });

  it("EDUCATION·EXPERIENCE/ACTIVITY·AWARD/CERTIFICATE를 순서대로 세 그룹에 매핑", () => {
    const entries: ProfileEntry[] = [
      { id: 5, entryType: "CERTIFICATE", periodText: null, title: "Certificate", organization: null, role: null, description: null, achievement: "Pass", featured: false, displayOrder: 5 },
      { id: 2, entryType: "EXPERIENCE", periodText: "2025", title: "Experience", organization: "Org", role: "Role", description: "Description", achievement: null, featured: false, displayOrder: 2 },
      { id: 1, entryType: "EDUCATION", periodText: "2026", title: "Major", organization: "School", role: null, description: null, achievement: "Current", featured: false, displayOrder: 1 },
      { id: 4, entryType: "AWARD", periodText: "2024", title: "Award", organization: null, role: null, description: "Project", achievement: "Winner", featured: false, displayOrder: 4 },
      { id: 3, entryType: "ACTIVITY", periodText: "2023", title: "Activity", organization: null, role: null, description: "Network", achievement: null, featured: false, displayOrder: 3 },
    ];

    const groups = groupProfiles(entries);

    expect(groups.education).toEqual([{ id: 1, period: "2026", title: "School", detail: "Major", outcome: "Current" }]);
    expect(groups.activity.map((item) => item.title)).toEqual(["Experience", "Activity"]);
    expect(groups.activity[0].detail).toBe("Org · Role · Description");
    expect(groups.award.map((item) => item.title)).toEqual(["Award", "Certificate"]);
    expect(groups.award[1].detail).toBeUndefined();
  });

  it("빈 Profile 제목과 빈 Group을 만들지 않음", () => {
    const groups = groupProfiles([
      { id: 1, entryType: "EDUCATION", periodText: null, title: " ", organization: null, role: null, description: null, achievement: null, featured: false, displayOrder: 1 },
    ]);
    expect(groups).toEqual({ education: [], activity: [], award: [] });
  });

  it("6개 허용 Technology Category 계약과 순서를 유지", () => {
    const groups = groupTechnologies(PUBLIC_PORTFOLIO_FIXTURE.portfolioTechnologies);
    expect(groups.map((group) => group.category)).toEqual([
      "LANGUAGE", "BACKEND", "DATABASE", "FRONTEND", "INFRA", "DEVOPS",
    ]);
    expect(groups.find((group) => group.category === "INFRA")?.technologies.map((item) => item.name))
      .toEqual(["Docker", "Docker Compose", "Linux", "Kubernetes"]);
  });

  it("FRONTEND 없는 Fixture는 5개 Group이며 Docker와 Docker Compose를 합치지 않음", () => {
    const technologies = PUBLIC_PORTFOLIO_FIXTURE.portfolioTechnologies
      .filter((technology) => technology.category !== "FRONTEND");
    const groups = groupTechnologies(technologies);

    expect(groups).toHaveLength(5);
    expect(groups.some((group) => group.category === "FRONTEND")).toBe(false);
    expect(groups.flatMap((group) => group.technologies).filter((item) => item.name.startsWith("Docker")))
      .toHaveLength(2);
  });

  it("허용 계약 밖 Technology Category를 표시하지 않음", () => {
    const unknown = {
      id: 99, name: "Unknown", category: "OTHER", iconUrl: null, displayOrder: 0,
    } as unknown as PublicTechnology;
    expect(groupTechnologies([unknown])).toEqual([]);
  });

  it("Project API 배열 순서와 slug를 유지하고 빈 식별자를 제외", () => {
    const [first, second] = PUBLIC_PORTFOLIO_FIXTURE.projects;
    const projects = mapProjects([
      second,
      { ...first, id: 99, slug: "", name: "Missing" },
      first,
    ]);
    expect(projects.map((project) => project.slug)).toEqual([second.slug, first.slug]);
  });

  it("External Link 빈 값 Filtering·displayOrder와 알 수 없는 실제 이름을 유지", () => {
    const links = mapExternalLinks([
      { id: 2, name: "Actual Service", url: "https://service.example", displayOrder: 2 },
      { id: 1, name: "GitHub", url: "https://github.com/example", displayOrder: 1 },
      { id: 3, name: " ", url: "https://hidden.example", displayOrder: 0 },
    ]);
    expect(links.map((link) => link.name)).toEqual(["GitHub", "Actual Service"]);
  });

  it("Resume 등록·미등록 상태를 응답 그대로 유지", () => {
    expect(mapPublicPortfolio(PUBLIC_PORTFOLIO_FIXTURE).resume).toBeNull();
    const resume = { fileName: "resume.pdf", updatedAt: "2026-08-28T00:00:00+09:00" };
    expect(mapPublicPortfolio({ ...PUBLIC_PORTFOLIO_FIXTURE, resume }).resume).toEqual(resume);
  });
});
