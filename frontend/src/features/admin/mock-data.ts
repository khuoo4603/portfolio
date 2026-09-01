import type {
  ToolItem,
  ToolLink,
} from "./admin-types";

const MOCK_UPDATED_AT = "2026-08-25T12:00:00+09:00";

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
