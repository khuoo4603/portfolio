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
  year: number | null;
  thumbnailUrl: string | null;
  displayOrder: number;
  enabled: boolean;
  updatedAt: string;
};

export type Project = ProjectSummary & {
  tagline: string | null;
  description: string | null;
  cardRole: string | null;
  summary: string | null;
  detailRole: string | null;
  startedAt: string | null;
  endedAt: string | null;
  teamSize: number | null;
};

export type ProjectCreateInput = Pick<Project, "name" | "slug">;

export type ProjectCreateResult = ProjectCreateInput & {
  id: number;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
};

export type ProjectFields = Omit<Project, "id" | "thumbnailUrl" | "enabled" | "updatedAt">;

export type ProjectResultItem = {
  title: string;
  description: string | null;
};

export type ProjectBackgroundItem = {
  title: string | null;
  body: string;
};

export type ProjectFeatureItem = {
  title: string;
  description: string | null;
};

export type ProjectDevelopmentItem = {
  title: string;
  items: string[];
};

export type ProjectArchitecture = {
  notes: Array<{ title: string; body: string }>;
};

export type ProjectEngineeringItem = {
  title: string;
  summary: string | null;
  problem: string;
  solution: string;
  result: string;
};

export type ProjectContent = {
  results: ProjectResultItem[];
  background: ProjectBackgroundItem[];
  features: ProjectFeatureItem[];
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

export type ProjectDetail = {
  project: Project;
  technologies: ProjectTechnology[];
  content: ProjectContent;
  architectureImageUrl: string | null;
  media: ProjectMedia[];
};

export type ProjectSaveContent = ProjectContent;

export type ProjectMediaChange = {
  id?: number;
  clientKey?: string;
  action: "KEEP" | "DELETE" | "UPLOAD";
  uploadIndex?: number;
  label?: string | null;
  altText?: string | null;
  displayOrder?: number;
};

export type ProjectSaveMetadata = {
  project: ProjectFields;
  content: ProjectSaveContent;
  technologies: ProjectTechnologyInput[];
  thumbnailMode: "KEEP" | "REMOVE" | "UPLOAD";
  architectureImageMode: "KEEP" | "REMOVE" | "UPLOAD";
  mediaChanges: ProjectMediaChange[];
};

export type ProjectSaveInput = {
  metadata: ProjectSaveMetadata;
  thumbnail: File | null;
  architectureImage: File | null;
  mediaFiles: File[];
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
