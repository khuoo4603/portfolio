import type { MockAuthAccount } from "@/features/auth/mock-auth";

export type CurrentUser = MockAuthAccount;

export type ToolKey = "QUIZ" | "LINKS";

export type ToolItem = {
  toolKey: ToolKey;
  name: string;
};

export type ToolLinkCategory = "REFERENCE" | "MY_SERVICES";

export type ToolLink = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  category: ToolLinkCategory;
  imageUrl: string;
  enabled: boolean;
};

export const DEFAULT_LINK_IMAGE_URL = "/images/tools/links/default-link-preview.svg";

// Tools Launcher UI 검증용 활성 Tool 목록
export const MOCK_TOOLS: readonly ToolItem[] = [
  { toolKey: "QUIZ", name: "Quiz" },
  { toolKey: "LINKS", name: "Links" },
];

// Links UI 검증용 활성 Link 목록
export const MOCK_TOOL_LINKS: readonly ToolLink[] = [
  {
    id: 4,
    name: "React Bits",
    description: "Public Background / Shader / Noise / Hover / Text Interaction 레퍼런스",
    url: "https://reactbits.dev/",
    category: "REFERENCE",
    imageUrl: "/images/tools/links/react-bits.webp",
    enabled: true,
  },
  {
    id: 5,
    name: "Aceternity UI",
    description: "Public UI / Interaction / Project Showcase 레퍼런스",
    url: "https://ui.aceternity.com/",
    category: "REFERENCE",
    imageUrl: "/images/tools/links/aceternity-ui.webp",
    enabled: true,
  },
  {
    id: 6,
    name: "Magic UI",
    description: "Admin / Tools UI Component 레퍼런스",
    url: "https://magicui.design/",
    category: "REFERENCE",
    imageUrl: "/images/tools/links/magic-ui.webp",
    enabled: true,
  },
  {
    id: 7,
    name: "Color Hunt",
    description: "컬러 팔레트 탐색 및 색 조합 레퍼런스",
    url: "https://colorhunt.co/",
    category: "REFERENCE",
    imageUrl: "/images/tools/links/color-hunt.webp",
    enabled: true,
  },
  {
    id: 8,
    name: "Adobe Color",
    description: "컬러 팔레트 생성 및 색 조합 탐색",
    url: "https://color.adobe.com/",
    category: "REFERENCE",
    imageUrl: "/images/tools/links/adobe-color.webp",
    enabled: true,
  },
  {
    id: 9,
    name: "Happy Hues",
    description: "컬러 팔레트와 실제 UI 적용 예시",
    url: "https://www.happyhues.co/",
    category: "REFERENCE",
    imageUrl: "/images/tools/links/happy-hues.webp",
    enabled: true,
  },
  {
    id: 10,
    name: "Realtime Colors",
    description: "웹 화면에서 색 조합을 실시간으로 확인하는 도구",
    url: "https://www.realtimecolors.com/",
    category: "REFERENCE",
    imageUrl: "/images/tools/links/realtime-colors.webp",
    enabled: true,
  },
  {
    id: 11,
    name: "KYvC",
    description: "KYvC 서비스",
    url: "https://kyvc.kr/",
    category: "MY_SERVICES",
    imageUrl: "/images/profile/project-intro-kyvc.webp",
    enabled: true,
  },
  {
    id: 12,
    name: "KYvC Intro",
    description: "KYvC 소개 페이지",
    url: "https://intro.kyvc.kr/",
    category: "MY_SERVICES",
    imageUrl: DEFAULT_LINK_IMAGE_URL,
    enabled: true,
  },
  {
    id: 13,
    name: "SKHUTrack",
    description: "SKHUTrack 서비스",
    url: "https://skhutrack.com/",
    category: "MY_SERVICES",
    imageUrl: "/images/profile/project-intro-skhutrack.webp",
    enabled: true,
  },
  {
    id: 14,
    name: "khuoo.synology.me",
    description: "개인 서비스",
    url: "https://khuoo.synology.me/",
    category: "MY_SERVICES",
    imageUrl: DEFAULT_LINK_IMAGE_URL,
    enabled: true,
  },
];
