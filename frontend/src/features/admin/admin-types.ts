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

export type SiteContent = {
  category: string;
  contentCode: string;
  contentValue: string;
  updatedAt: string;
};

export type ProfileEntryType = "EXPERIENCE" | "ACTIVITY" | "AWARD" | "CERTIFICATE";

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
  createdAt?: string;
  updatedAt: string;
};

export type ProfileEntryInput = Omit<ProfileEntry, "id" | "createdAt" | "updatedAt">;

export type TechnologyCategory = "LANGUAGE" | "BACKEND" | "INFRA" | "DEVOPS";

export type Technology = {
  id: number;
  name: string;
  category: TechnologyCategory;
  iconKey: string | null;
  displayOrder: number;
  enabled: boolean;
};

export type TechnologyInput = Omit<Technology, "id">;

export type ProjectStatus = {
  projectKey: string;
  enabled: boolean;
  updatedAt: string;
};

export type ExternalLink = {
  id: number;
  name: string;
  url: string;
  displayOrder: number;
  enabled: boolean;
};

export type ExternalLinkInput = Omit<ExternalLink, "id">;

export type ResumeInfo = {
  fileName: string;
  size: number;
  updatedAt: string;
};

export type SiteData = {
  siteContents: SiteContent[];
  profileEntries: ProfileEntry[];
  technologies: Technology[];
  projects: ProjectStatus[];
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
