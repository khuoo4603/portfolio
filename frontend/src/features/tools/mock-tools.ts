import type { MockAuthAccount } from "@/features/auth/mock-auth";

export type CurrentUser = MockAuthAccount;

export type ToolKey = "QUIZ" | "LINKS";

export type ToolItem = {
  toolKey: ToolKey;
  name: string;
};

export type ToolLinkCategory = "REFERENCE" | "DEVELOPMENT" | "MY_SERVICES" | "PERSONAL";

export type ToolLink = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  category: ToolLinkCategory;
};

// Tools Launcher UI 검증용 활성 Tool 목록
export const MOCK_TOOLS: readonly ToolItem[] = [
  { toolKey: "QUIZ", name: "Quiz" },
  { toolKey: "LINKS", name: "Links" },
];

// Links UI 검증용 활성 Link 목록
export const MOCK_TOOL_LINKS: readonly ToolLink[] = [
  {
    id: 1,
    name: "Spring Guides",
    description: "Spring 공식 가이드",
    url: "https://spring.io/guides",
    category: "REFERENCE",
  },
  {
    id: 2,
    name: "MDN Web Docs",
    description: "Web 기술 문서",
    url: "https://developer.mozilla.org/",
    category: "DEVELOPMENT",
  },
  {
    id: 3,
    name: "GitHub",
    description: "김현우 GitHub",
    url: "https://github.com/khuoo4603",
    category: "PERSONAL",
  },
];
