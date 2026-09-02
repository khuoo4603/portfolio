import type { PublicProjectDetail } from "@/types/api";

// LOCAL 프로젝트 개수와 독립된 typed Project Detail Test Fixture
export const KYVC_PROJECT_FIXTURE: PublicProjectDetail = {
  id: 101,
  slug: "kyvc",
  name: "KYvC",
  year: 2026,
  tagline: "법인 KYC 자동 심사 서비스",
  summary: "법인 KYC 심사부터 VC 발급과 VP 검증까지 연결한 기업 인증 플랫폼",
  detailRole: "PL · Backend · Infra",
  startedAt: "2026-04-27",
  endedAt: "2026-08-18",
  teamSize: 9,
  thumbnailUrl: "/fixture/kyvc.webp",
  architectureImageUrl: "/fixture/kyvc-architecture.png",
  technologies: [
    { id: 1, name: "Java", category: "LANGUAGE", iconUrl: "/icons/tech/java.svg", highlighted: true, displayOrder: 1 },
    { id: 2, name: "Spring Boot", category: "BACKEND", iconUrl: "/icons/tech/spring-boot.svg", highlighted: true, displayOrder: 2 },
    { id: 3, name: "Docker", category: "INFRA", iconUrl: "/icons/tech/docker.svg", highlighted: true, displayOrder: 3 },
    { id: 4, name: "Docker Compose", category: "INFRA", iconUrl: "/icons/tech/docker.svg", highlighted: true, displayOrder: 4 },
    { id: 5, name: "React", category: "FRONTEND", iconUrl: "/icons/tech/react.svg", highlighted: false, displayOrder: 5 },
  ],
  content: {
    results: [{ title: "Fixture 성과", description: "Fixture 성과 설명" }],
    background: [{ title: "Fixture 배경 제목", body: "Fixture 문제 배경" }],
    features: [{ title: "Fixture 주요 기능", description: "Fixture 기능 설명" }],
    development: [{ title: "Backend", items: ["Fixture Backend 작업"] }],
    architecture: {
      notes: [
        { title: "인프라 / 실행 환경", body: "Synology DSM Reverse Proxy → Nginx → Docker / Docker Compose" },
        { title: "인프라 / 배포", body: "GitHub Actions → GHCR → Self-hosted Runner → Docker / Docker Compose" },
      ],
    },
    engineering: [{
      title: "Fixture 문제 해결",
      summary: "Fixture 요약",
      problem: "Fixture 문제",
      solution: "Fixture 개선 방안",
      result: "Fixture 결과",
    }],
  },
  media: [],
};

export const EMPTY_PROJECT_FIXTURE: PublicProjectDetail = {
  id: 202,
  slug: "empty-project",
  name: "Empty Project",
  year: 2025,
  tagline: "실제 Fixture tagline",
  summary: null,
  detailRole: null,
  startedAt: null,
  endedAt: null,
  teamSize: null,
  thumbnailUrl: null,
  architectureImageUrl: null,
  technologies: [],
  content: {
    results: [],
    background: [],
    features: [],
    development: [],
    architecture: { notes: [] },
    engineering: [],
  },
  media: [],
};

export const MEDIA_PROJECT_FIXTURE: PublicProjectDetail = {
  ...EMPTY_PROJECT_FIXTURE,
  id: 303,
  slug: "media-project",
  name: "Media Project",
  technologies: [
    { id: 31, name: "TypeScript", category: "LANGUAGE", iconUrl: null, highlighted: false, displayOrder: 1 },
  ],
  content: {
    ...EMPTY_PROJECT_FIXTURE.content,
    architecture: {
      notes: [{ title: "Fixture", body: "Fixture architecture note" }],
    },
  },
  media: [
    { id: 2, imageUrl: "/fixture/two.webp", label: "화면 2", altText: null, displayOrder: 2 },
    { id: 1, imageUrl: "/fixture/one.webp", label: "화면 1", altText: "첫 화면", displayOrder: 1 },
  ],
};
