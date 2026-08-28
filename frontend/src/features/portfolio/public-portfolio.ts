import type {
  ExternalLink,
  ProfileEntry,
  PublicPortfolio,
  PublicProjectCard,
  PublicTechnology,
  ResumeMetadata,
  TechnologyCategory,
} from "@/types/api";

export const TECHNOLOGY_GROUPS: ReadonlyArray<{ category: TechnologyCategory; label: string }> = [
  { category: "LANGUAGE", label: "Language" },
  { category: "BACKEND", label: "Backend" },
  { category: "DATABASE", label: "Database" },
  { category: "FRONTEND", label: "Frontend" },
  { category: "INFRA", label: "Infrastructure" },
  { category: "DEVOPS", label: "DevOps" },
];

export type ContentMap = Record<string, string>;

export type ProfileRow = {
  id: number;
  period?: string;
  title: string;
  detail?: string;
  outcome?: string;
};

export type ProfileGroups = {
  education: ProfileRow[];
  activity: ProfileRow[];
  award: ProfileRow[];
};

export type TechnologyGroup = {
  category: TechnologyCategory;
  label: string;
  technologies: PublicTechnology[];
};

export type PublicViewModel = {
  content: ContentMap;
  profiles: ProfileGroups;
  technologies: TechnologyGroup[];
  projects: PublicProjectCard[];
  externalLinks: ExternalLink[];
  resume: ResumeMetadata | null;
};

function value(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function joined(values: Array<string | null | undefined>) {
  const items = values.map(value).filter((item): item is string => Boolean(item));
  return items.length > 0 ? items.join(" · ") : undefined;
}

// contentCode별 기존 UI Slot 조회 Map 구성
export function mapContents(contents: PublicPortfolio["portfolioContents"]) {
  return contents.reduce<ContentMap>((mapped, item) => {
    const contentValue = value(item.contentValue);
    if (contentValue) {
      mapped[item.contentCode] = contentValue;
    }
    return mapped;
  }, {});
}

// Profile 5개 유형의 학력·주요 활동·수상 세 그룹 변환
export function groupProfiles(entries: ProfileEntry[]): ProfileGroups {
  const groups: ProfileGroups = { education: [], activity: [], award: [] };

  [...entries].sort((first, second) => first.displayOrder - second.displayOrder).forEach((entry) => {
    const period = value(entry.periodText);
    const title = value(entry.title);
    if (!title) {
      return;
    }

    if (entry.entryType === "EDUCATION") {
      groups.education.push({
        id: entry.id,
        period,
        title: value(entry.organization) ?? title,
        detail: value(entry.organization) ? title : value(entry.description),
        outcome: value(entry.achievement) ?? value(entry.role),
      });
      return;
    }

    if (entry.entryType === "EXPERIENCE" || entry.entryType === "ACTIVITY") {
      groups.activity.push({
        id: entry.id,
        period,
        title,
        detail: joined([entry.organization, entry.role, entry.description]),
        outcome: value(entry.achievement),
      });
      return;
    }

    if (entry.entryType === "AWARD" || entry.entryType === "CERTIFICATE") {
      groups.award.push({
        id: entry.id,
        period,
        title,
        detail: value(entry.description) ?? value(entry.organization),
        outcome: value(entry.achievement),
      });
    }
  });

  return groups;
}

// 6개 허용 Category 순서의 기술 Editorial Group 구성
export function groupTechnologies(technologies: PublicTechnology[]) {
  return TECHNOLOGY_GROUPS.map<TechnologyGroup>((group) => ({
    ...group,
    technologies: technologies
      .filter((technology) => technology.category === group.category && value(technology.name))
      .sort((first, second) => first.displayOrder - second.displayOrder),
  })).filter((group) => group.technologies.length > 0);
}

// Backend 공개 배열의 순서를 유지하는 Project 카드 정규화
export function mapProjects(projects: PublicProjectCard[]) {
  return projects.filter((project) => value(project.slug) && value(project.name));
}

// 실제 URL·이름이 존재하는 External Link 정렬
export function mapExternalLinks(links: ExternalLink[]) {
  return links
    .filter((link) => value(link.name) && value(link.url))
    .sort((first, second) => first.displayOrder - second.displayOrder);
}

// Public Portfolio 응답의 화면별 데이터 조합
export function mapPublicPortfolio(portfolio: PublicPortfolio): PublicViewModel {
  return {
    content: mapContents(portfolio.portfolioContents),
    profiles: groupProfiles(portfolio.profileEntries),
    technologies: groupTechnologies(portfolio.portfolioTechnologies),
    projects: mapProjects(portfolio.projects),
    externalLinks: mapExternalLinks(portfolio.externalLinks),
    resume: portfolio.resume,
  };
}
