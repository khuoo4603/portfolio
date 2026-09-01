export type AccountRole = "ADMIN" | "USER";

export type TrafficPoint = {
  month: string;
  visitors: number;
  pageViews: number;
};

export type ServiceStatus = {
  serviceKey: string;
  status: "UP" | "DOWN";
  responseTimeMs: number | null;
  httpStatus: number | null;
  lastCheckedAt: string;
};

export type DashboardData = {
  traffic: {
    todayVisitors: number;
    todayPageViews: number;
    monthVisitors: number;
    monthPageViews: number;
    trend: TrafficPoint[];
  };
  serviceStatus: ServiceStatus[];
  siteSummary: {
    publicProjects: number;
    portfolioTechnologies: number;
    activeTools: number;
    activeAccounts: number;
  };
};

export type PortfolioContentCategory = "COMMON" | "MAIN" | "PROFILE" | "CONTACT" | "FOOTER";

export type PortfolioContentCode =
  | "SITE_MARK"
  | "NAME"
  | "ENGLISH_NAME"
  | "POSITION"
  | "AFFILIATION"
  | "NAV_ABOUT"
  | "NAV_TECH"
  | "NAV_PROJECTS"
  | "NAV_EDUCATION"
  | "HERO_POSITION"
  | "HERO_STATEMENT"
  | "HERO_DESCRIPTION"
  | "HERO_CUE"
  | "ABOUT_SECTION_LABEL"
  | "ABOUT_SECTION_TITLE"
  | "TECH_SECTION_LABEL"
  | "TECH_SECTION_TITLE"
  | "PROJECTS_SECTION_LABEL"
  | "PROJECTS_SECTION_TITLE"
  | "PROJECT_DETAIL_CTA"
  | "ACHIEVEMENTS_SECTION_LABEL"
  | "ACHIEVEMENTS_SECTION_TITLE"
  | "EDUCATION_GROUP_TITLE"
  | "ACTIVITY_GROUP_TITLE"
  | "AWARD_GROUP_TITLE"
  | "ABOUT_STATEMENT"
  | "ABOUT_POSITION"
  | "ABOUT_DESCRIPTION_1"
  | "ABOUT_DESCRIPTION_2"
  | "DEVELOPMENT_VALUES_TITLE"
  | "DEVELOPMENT_VALUE_1_TITLE"
  | "DEVELOPMENT_VALUE_1_DESCRIPTION"
  | "DEVELOPMENT_VALUE_2_TITLE"
  | "DEVELOPMENT_VALUE_2_DESCRIPTION"
  | "DEVELOPMENT_VALUE_3_TITLE"
  | "DEVELOPMENT_VALUE_3_DESCRIPTION"
  | "EMAIL"
  | "FOOTER_NAME"
  | "FOOTER_ROLE"
  | "RESUME_LABEL"
  | "RESUME_VIEW_LABEL"
  | "RESUME_DOWNLOAD_LABEL"
  | "CONTACT_LABEL"
  | "PORTFOLIO_LABEL"
  | "COPYRIGHT";

export type SiteContent = {
  category: PortfolioContentCategory;
  contentCode: PortfolioContentCode;
  contentValue: string;
  updatedAt: string;
};

export type ProfileEntryType = "EDUCATION" | "EXPERIENCE" | "ACTIVITY" | "AWARD" | "CERTIFICATE";

export type ProfileEntry = {
  id: number;
  entryType: ProfileEntryType;
  periodText: string | null;
  title: string;
  organization: string | null;
  role: string | null;
  description: string | null;
  achievement: string | null;
  featured: boolean;
  displayOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileEntryInput = Omit<ProfileEntry, "id" | "createdAt" | "updatedAt">;

export type TechnologyCategory = "LANGUAGE" | "BACKEND" | "DATABASE" | "FRONTEND" | "INFRA" | "DEVOPS";

export type Technology = {
  id: number;
  name: string;
  category: TechnologyCategory;
  iconUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TechnologyInput = Omit<Technology, "id" | "createdAt" | "updatedAt">;

export type PortfolioTechnology = {
  technologyId: number;
  displayOrder: number;
};

export type ProjectSummary = {
  id: number;
  slug: string;
  name: string;
  year: number;
  tagline: string;
  cardRole: string;
  thumbnailUrl: string | null;
  displayOrder: number;
  enabled: boolean;
  updatedAt: string;
};

export type ExternalLink = {
  id: number;
  name: string;
  url: string;
  displayOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExternalLinkInput = Omit<ExternalLink, "id" | "createdAt" | "updatedAt">;

export type ResumeInfo = {
  fileName: string;
  updatedAt: string;
};

export type SiteData = {
  portfolioContents: SiteContent[];
  profileEntries: ProfileEntry[];
  technologyMaster: Technology[];
  portfolioTechnologies: PortfolioTechnology[];
  projects: ProjectSummary[];
  externalLinks: ExternalLink[];
  resume: ResumeInfo | null;
};

export type AccountItem = {
  id: number;
  email: string;
  name: string;
  role: AccountRole;
  enabled: boolean;
  recentLoginAt: string | null;
};

export type AccountInput = {
  email: string;
  name: string;
  password: string;
  role: AccountRole;
  enabled: boolean;
};

export type AccountListResponse = {
  items: AccountItem[];
};

export type AccountCreateResult = Omit<AccountItem, "recentLoginAt"> & {
  createdAt: string;
};

export type ToolItem = {
  toolKey: "QUIZ" | "LINKS" | string;
  name: string;
  enabled: boolean;
  updatedAt?: string;
};

export type ToolLinkCategory = "REFERENCE" | "DEVELOPMENT" | "MY_SERVICES" | "PERSONAL";

export type ToolLink = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  category: ToolLinkCategory;
  displayOrder: number;
  enabled: boolean;
};

export type ToolLinkInput = Omit<ToolLink, "id">;

export type LoginLog = {
  id: number;
  occurredAt: string;
  email: string;
  result: "SUCCESS" | "FAILURE";
  failureReason: string | null;
  ip: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  traceId: string;
};

export type ErrorLog = {
  id: number;
  occurredAt: string;
  service: "FRONTEND" | "BACKEND";
  method: string | null;
  path: string | null;
  statusCode: number;
  errorCode: string | null;
  message: string;
  traceId: string;
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
};

export type LoginLogPage = PageResponse<LoginLog>;
export type ErrorLogPage = PageResponse<ErrorLog>;
