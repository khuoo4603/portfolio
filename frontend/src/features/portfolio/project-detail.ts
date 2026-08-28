import type {
  ProjectArchitecture,
  ProjectContent,
  ProjectMedia,
  PublicProjectDetail,
  PublicProjectTechnology,
} from "@/types/api";

export type ProjectSection = {
  id: string;
  label: string;
};

export type ProjectPeriod = {
  text: string;
  duration: string | null;
  ongoing: boolean;
};

export type ProjectDetailModel = Omit<PublicProjectDetail, "content" | "media" | "technologies"> & {
  summaryText: string;
  period: ProjectPeriod | null;
  technologies: PublicProjectTechnology[];
  content: ProjectContent;
  media: ProjectMedia[];
  sections: ProjectSection[];
};

const SECTION_LABELS = {
  stackResult: { id: "detail-stack-result", label: "기술 스택 · 성과" },
  background: { id: "detail-background", label: "문제 배경 · 주요 기능" },
  development: { id: "detail-development", label: "직접 담당한 개발 영역" },
  architecture: { id: "detail-architecture", label: "아키텍처" },
  engineering: { id: "detail-engineering", label: "기술적 문제 해결" },
} as const;

function clean(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function cleanList(values: string[] | undefined) {
  return (values ?? []).flatMap((value) => {
    const normalized = clean(value);
    return normalized ? [normalized] : [];
  });
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return { display: `${match[1]}.${match[2]}.${match[3]}`, time };
}

// ISO 개발 기간의 표시값과 시작·종료일 포함 일수 계산
export function formatProjectPeriod(startedAt: string | null, endedAt: string | null): ProjectPeriod | null {
  if (!startedAt) {
    return null;
  }

  const start = parseDate(startedAt);
  if (!start) {
    return null;
  }

  if (!endedAt) {
    return { text: `${start.display} — 진행 중`, duration: null, ongoing: true };
  }

  const end = parseDate(endedAt);
  if (!end || end.time < start.time) {
    return { text: start.display, duration: null, ongoing: false };
  }

  const days = Math.floor((end.time - start.time) / 86_400_000) + 1;
  return {
    text: `${start.display} — ${end.display}`,
    duration: `총 ${days}일`,
    ongoing: false,
  };
}

// Backend가 제공한 Architecture Node Group 존재 여부 확인
export function hasProjectArchitecture(architecture: ProjectArchitecture) {
  return [
    architecture.clients,
    architecture.services,
    architecture.dataAndExternal,
    architecture.runtime,
    architecture.delivery,
  ].some((nodes) => (nodes?.length ?? 0) > 0);
}

function mapArchitecture(architecture: ProjectArchitecture): ProjectArchitecture {
  return {
    clients: cleanList(architecture.clients),
    services: cleanList(architecture.services),
    dataAndExternal: cleanList(architecture.dataAndExternal),
    runtime: cleanList(architecture.runtime),
    delivery: cleanList(architecture.delivery),
  };
}

// 공개 프로젝트 상세의 빈 값 제거와 기존 Editorial Section 구성
export function mapProjectDetail(project: PublicProjectDetail): ProjectDetailModel {
  const technologies = [...project.technologies]
    .flatMap((technology) => {
      const name = clean(technology.name);
      return name ? [{ ...technology, name, iconUrl: clean(technology.iconUrl) }] : [];
    })
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const architecture = mapArchitecture(project.content.architecture ?? {});
  const content: ProjectContent = {
    results: project.content.results.flatMap((item) => {
      const title = clean(item.title);
      return title ? [{ title }] : [];
    }),
    background: cleanList(project.content.background),
    features: project.content.features.flatMap((item) => {
      const title = clean(item.title);
      return title ? [{ title }] : [];
    }),
    development: project.content.development.flatMap((item) => {
      const title = clean(item.title);
      return title ? [{ title, items: cleanList(item.items) }] : [];
    }),
    architecture,
    engineering: project.content.engineering.flatMap((item) => {
      const title = clean(item.title);
      if (!title) {
        return [];
      }
      return [{
        title,
        summary: clean(item.summary) ?? "",
        problem: clean(item.problem) ?? "",
        solution: clean(item.solution) ?? "",
        result: clean(item.result) ?? "",
      }];
    }),
  };
  const media = [...project.media]
    .flatMap((item) => {
      const imageUrl = clean(item.imageUrl);
      return imageUrl ? [{
        ...item,
        imageUrl,
        label: clean(item.label),
        altText: clean(item.altText),
      }] : [];
    })
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const sections: ProjectSection[] = [];

  if (technologies.length > 0 || content.results.length > 0) {
    sections.push(SECTION_LABELS.stackResult);
  }
  if (content.background.length > 0 || content.features.length > 0) {
    sections.push(SECTION_LABELS.background);
  }
  if (content.development.length > 0) {
    sections.push(SECTION_LABELS.development);
  }
  if (hasProjectArchitecture(architecture)) {
    sections.push(SECTION_LABELS.architecture);
  }
  if (content.engineering.length > 0) {
    sections.push(SECTION_LABELS.engineering);
  }

  return {
    ...project,
    name: clean(project.name) ?? "",
    tagline: clean(project.tagline) ?? "",
    summary: clean(project.summary),
    detailRole: clean(project.detailRole),
    summaryText: clean(project.summary) ?? clean(project.tagline) ?? "",
    period: formatProjectPeriod(project.startedAt, project.endedAt),
    technologies,
    content,
    media,
    sections,
  };
}
