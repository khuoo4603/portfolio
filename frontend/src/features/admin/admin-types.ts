import type { PortfolioContentCategory, PortfolioContentCode } from "@/types/api";

export type { PortfolioContentCategory, PortfolioContentCode } from "@/types/api";

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

export type Project = ProjectSummary & {
  description: string;
  summary: string | null;
  detailRole: string | null;
  startedAt: string | null;
  endedAt: string | null;
  teamSize: number | null;
};

export type ProjectCreateInput = Omit<Project, "id" | "updatedAt">;

export type ProjectUpdateInput = Partial<Omit<ProjectCreateInput, "enabled">>;

export type ProjectTitleItem = {
  title: string;
};

export type ProjectDevelopmentItem = {
  title: string;
  items: string[];
};

export type ProjectArchitecture = {
  clients: string[];
  services: string[];
  dataAndExternal: string[];
  runtime: string[];
  delivery: string[];
};

export type ProjectEngineeringItem = {
  title: string;
  summary: string;
  problem: string;
  solution: string;
  result: string;
};

export type ProjectContent = {
  results: ProjectTitleItem[];
  background: string[];
  features: ProjectTitleItem[];
  development: ProjectDevelopmentItem[];
  architecture: ProjectArchitecture;
  engineering: ProjectEngineeringItem[];
};

export type ProjectTechnology = {
  technologyId: number;
  name: string;
  category: TechnologyCategory;
  iconUrl: string | null;
  showOnCard: boolean;
  highlighted: boolean;
  displayOrder: number;
};

export type ProjectTechnologyInput = Pick<
  ProjectTechnology,
  "technologyId" | "showOnCard" | "highlighted" | "displayOrder"
>;

export type ProjectMedia = {
  id: number;
  imageUrl: string;
  label: string | null;
  altText: string | null;
  displayOrder: number;
};

export type ProjectMediaInput = Omit<ProjectMedia, "id">;

export type ProjectDetail = {
  project: Project;
  technologies: ProjectTechnology[];
  content: ProjectContent;
  media: ProjectMedia[];
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
  toolKey: string;
  name: string;
  enabled: boolean;
};

export type ToolLinkCategory = "REFERENCE" | "MY_SERVICES";

export type ToolLink = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  category: ToolLinkCategory;
  displayOrder: number;
  enabled: boolean;
};

export type ToolLinkFields = Omit<ToolLink, "id" | "imageUrl">;

export type ToolLinkCreateImageMode = "DEFAULT" | "UPLOAD";

export type ToolLinkUpdateImageMode = "KEEP" | "DEFAULT" | "UPLOAD";

export type ToolLinkCreateMetadata = ToolLinkFields & {
  imageMode: ToolLinkCreateImageMode;
};

export type ToolLinkUpdateMetadata = Partial<ToolLinkFields> & {
  imageMode: ToolLinkUpdateImageMode;
};

export type ToolLinkMutation<TMetadata> = {
  metadata: TMetadata;
  image: File | null;
};

export type ToolStatusInput = {
  enabled: boolean;
};

export type ToolsData = {
  tools: ToolItem[];
  links: ToolLink[];
};

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
