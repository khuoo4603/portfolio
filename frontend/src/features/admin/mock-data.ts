import type {
  AccountItem,
  SiteData,
  ToolItem,
  ToolLink,
} from "./admin-types";

const MOCK_UPDATED_AT = "2026-08-25T12:00:00+09:00";

// 현재 Public 정적 콘텐츠 기반 Site 관리 초기값
export const MOCK_SITE_DATA: SiteData = {
  siteContents: [
    { category: "COMMON", contentCode: "NAME", contentValue: "김현우", updatedAt: MOCK_UPDATED_AT },
    { category: "COMMON", contentCode: "ENGLISH_NAME", contentValue: "KIM HYUNWOO", updatedAt: MOCK_UPDATED_AT },
    { category: "COMMON", contentCode: "POSITION", contentValue: "Backend / Infrastructure", updatedAt: MOCK_UPDATED_AT },
    { category: "COMMON", contentCode: "AFFILIATION", contentValue: "성공회대학교 소프트웨어융합전공", updatedAt: MOCK_UPDATED_AT },
    { category: "MAIN", contentCode: "HERO_TITLE", contentValue: "Backend 개발부터 배포 / 운영까지 고려", updatedAt: MOCK_UPDATED_AT },
    { category: "MAIN", contentCode: "HERO_DESCRIPTION", contentValue: "문제에 맞는 기술 선택 · 서비스 설계 · 구현 · 실제 운영", updatedAt: MOCK_UPDATED_AT },
    { category: "FOOTER", contentCode: "FOOTER_MESSAGE", contentValue: "BACKEND / INFRA DEVELOPER", updatedAt: MOCK_UPDATED_AT },
    { category: "PROFILE", contentCode: "ABOUT", contentValue: "성공회대학교에 재학 중인 김현우입니다. Spring Boot 기반 Backend 개발을 중심으로 Database 설계, Docker·Linux 실행 환경, CI/CD와 배포·운영까지 하나의 서비스 흐름으로 다룹니다.", updatedAt: MOCK_UPDATED_AT },
    { category: "PROFILE", contentCode: "DEVELOPMENT_VALUES", contentValue: "문서화의 가치 · 덜어냄의 미학 · 운영까지", updatedAt: MOCK_UPDATED_AT },
    { category: "PROFILE", contentCode: "INTEREST_AREAS", contentValue: "Backend · Infrastructure · Database · CI/CD", updatedAt: MOCK_UPDATED_AT },
    { category: "PROFILE", contentCode: "PREFERRED_WORK_STYLE", contentValue: "문제와 서비스 규모에 맞는 구조 선택", updatedAt: MOCK_UPDATED_AT },
    { category: "PROFILE", contentCode: "CURRENT_FOCUS", contentValue: "Spring Boot 기반 Backend와 운영 가능한 실행 환경", updatedAt: MOCK_UPDATED_AT },
    { category: "PROFILE", contentCode: "FUTURE_DIRECTION", contentValue: "설계·구현·배포·운영을 함께 고려하는 개발", updatedAt: MOCK_UPDATED_AT },
    { category: "CONTACT", contentCode: "EMAIL", contentValue: "khuoo4603@gmail.com", updatedAt: MOCK_UPDATED_AT },
    { category: "EDUCATION", contentCode: "SCHOOL_NAME", contentValue: "성공회대학교", updatedAt: MOCK_UPDATED_AT },
    { category: "EDUCATION", contentCode: "MAJOR", contentValue: "소프트웨어융합전공", updatedAt: MOCK_UPDATED_AT },
    { category: "EDUCATION", contentCode: "EDUCATION_STATUS", contentValue: "2023.03 — 현재 · 재학", updatedAt: MOCK_UPDATED_AT },
  ],
  profileEntries: [
    { id: 1, entryType: "ACTIVITY", periodText: "2026.04 — 현재", title: "QED", organization: "성공회대학교", role: null, description: "성공회대학교 보안동아리", achievement: null, featured: true, displayOrder: 1, enabled: true, updatedAt: MOCK_UPDATED_AT },
    { id: 2, entryType: "ACTIVITY", periodText: "2023.03 — 2023.12", title: "One Think IT's", organization: null, role: null, description: "특성화고 졸업자 네트워크", achievement: null, featured: false, displayOrder: 2, enabled: true, updatedAt: MOCK_UPDATED_AT },
    { id: 3, entryType: "AWARD", periodText: "2026", title: "성공회대학교 소프트웨어경진대회", organization: "성공회대학교", role: null, description: "SKHUTRack", achievement: "1등", featured: true, displayOrder: 3, enabled: true, updatedAt: MOCK_UPDATED_AT },
    { id: 4, entryType: "AWARD", periodText: "2026", title: "KFIP 2026", organization: null, role: null, description: "KYvC", achievement: "Toss 특별상", featured: true, displayOrder: 4, enabled: true, updatedAt: MOCK_UPDATED_AT },
    { id: 5, entryType: "AWARD", periodText: "2023", title: "성공회대학교 IT경진대회", organization: "성공회대학교", role: null, description: "SKHURoad", achievement: "3등", featured: false, displayOrder: 5, enabled: true, updatedAt: MOCK_UPDATED_AT },
    { id: 6, entryType: "CERTIFICATE", periodText: "2021", title: "현대오토에버 특성화 고교생 화이트해커 양성교육", organization: "현대오토에버", role: null, description: null, achievement: "수료/입상", featured: false, displayOrder: 6, enabled: true, updatedAt: MOCK_UPDATED_AT },
    { id: 7, entryType: "AWARD", periodText: "2021", title: "SW·AI 교육 수기 공모전", organization: null, role: null, description: null, achievement: "최우수상 · 과학기술정보통신부 장관상", featured: false, displayOrder: 7, enabled: true, updatedAt: MOCK_UPDATED_AT },
    { id: 8, entryType: "AWARD", periodText: "2021", title: "Hello New() World", organization: null, role: null, description: "NewLife", achievement: "대상", featured: false, displayOrder: 8, enabled: false, updatedAt: MOCK_UPDATED_AT },
  ],
  technologies: [
    { id: 1, name: "Java", category: "LANGUAGE", iconKey: "java", displayOrder: 1, enabled: true },
    { id: 2, name: "SQL", category: "LANGUAGE", iconKey: "sql", displayOrder: 2, enabled: true },
    { id: 3, name: "Spring Boot", category: "BACKEND", iconKey: "spring-boot", displayOrder: 3, enabled: true },
    { id: 4, name: "PostgreSQL", category: "BACKEND", iconKey: "postgresql", displayOrder: 4, enabled: true },
    { id: 5, name: "MySQL", category: "BACKEND", iconKey: "mysql", displayOrder: 5, enabled: true },
    { id: 6, name: "Docker", category: "INFRA", iconKey: "docker", displayOrder: 6, enabled: true },
    { id: 7, name: "Linux", category: "INFRA", iconKey: "linux", displayOrder: 7, enabled: true },
    { id: 8, name: "Kubernetes", category: "INFRA", iconKey: "kubernetes", displayOrder: 8, enabled: true },
    { id: 9, name: "GitHub Actions", category: "DEVOPS", iconKey: "github-actions", displayOrder: 9, enabled: true },
    { id: 10, name: "GHCR", category: "DEVOPS", iconKey: "ghcr", displayOrder: 10, enabled: true },
    { id: 11, name: "Git", category: "DEVOPS", iconKey: "git", displayOrder: 11, enabled: false },
  ],
  projects: [
    { projectKey: "KYVC", enabled: true, updatedAt: MOCK_UPDATED_AT },
    { projectKey: "SHKUTRACK", enabled: true, updatedAt: MOCK_UPDATED_AT },
    { projectKey: "SHKULOAD", enabled: false, updatedAt: MOCK_UPDATED_AT },
  ],
  externalLinks: [
    { id: 1, name: "GitHub", url: "https://github.com/khuoo4603", displayOrder: 1, enabled: true },
    { id: 2, name: "Instagram", url: "https://www.instagram.com/hyun_woooooooooo/", displayOrder: 2, enabled: true },
    { id: 3, name: "LinkedIn", url: "https://www.linkedin.com/in/%ED%98%84%EC%9A%B0-%EA%B9%80-b0201a414/", displayOrder: 3, enabled: true },
  ],
  resume: null,
};

// 계정 관리 상호작용 검증용 Sample 계정
export const MOCK_ACCOUNTS: AccountItem[] = [
  { id: 1, email: "admin@portfolio.local", name: "김현우", role: "ADMIN", enabled: true, recentLoginAt: "2026-08-25T11:55:00+09:00" },
  { id: 2, email: "user@portfolio.local", name: "Mock User", role: "USER", enabled: true, recentLoginAt: "2026-08-25T10:22:00+09:00" },
  { id: 3, email: "editor@portfolio.local", name: "Mock Editor", role: "ADMIN", enabled: false, recentLoginAt: "2026-08-20T17:10:00+09:00" },
  { id: 4, email: "viewer@example.test", name: "Sample Viewer", role: "USER", enabled: true, recentLoginAt: null },
  { id: 5, email: "disabled@example.test", name: "Disabled Sample", role: "USER", enabled: false, recentLoginAt: "2026-07-31T09:30:00+09:00" },
];

// Admin Tools Registry와 Link 편집용 Sample 데이터
export const MOCK_TOOLS: ToolItem[] = [
  { toolKey: "QUIZ", name: "Quiz", enabled: true, updatedAt: MOCK_UPDATED_AT },
  { toolKey: "LINKS", name: "Links", enabled: false, updatedAt: MOCK_UPDATED_AT },
];

export const MOCK_TOOL_LINKS: ToolLink[] = [
  { id: 1, name: "Spring Guides", description: "Spring 공식 가이드", url: "https://spring.io/guides", category: "REFERENCE", displayOrder: 1, enabled: true },
  { id: 2, name: "MDN Web Docs", description: "Web 기술 문서", url: "https://developer.mozilla.org/", category: "DEVELOPMENT", displayOrder: 2, enabled: true },
  { id: 3, name: "KYvC", description: "법인 KYC 자동 심사 프로젝트", url: "https://github.com/khuoo4603", category: "MY_SERVICES", displayOrder: 3, enabled: false },
  { id: 4, name: "GitHub", description: "김현우 GitHub", url: "https://github.com/khuoo4603", category: "PERSONAL", displayOrder: 4, enabled: true },
];
