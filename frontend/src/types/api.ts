export type AccountRole = "USER" | "ADMIN";

export type FieldErrorResponse = {
  field: string;
  message: string;
};

export type ErrorResponse = {
  code: string;
  message: string;
  traceId: string;
  fieldErrors: FieldErrorResponse[];
};

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: AccountRole;
};

export type LoginResponse = {
  authenticated: boolean;
  role?: AccountRole;
  redirect?: string;
  adminVerificationRequired?: boolean;
  challengeId?: string;
  expiresAt?: string;
};

export type ChallengeResponse = {
  challengeId: string;
  expiresAt: string;
};

export type PortfolioContentCategory = "COMMON" | "MAIN" | "PROFILE" | "CONTACT";

export type PortfolioContentCode =
  | "NAME"
  | "ENGLISH_NAME"
  | "POSITION"
  | "AFFILIATION"
  | "HERO_STATEMENT"
  | "HERO_DESCRIPTION"
  | "ABOUT_STATEMENT"
  | "ABOUT_DESCRIPTION_1"
  | "ABOUT_DESCRIPTION_2"
  | "DEVELOPMENT_VALUE_1_TITLE"
  | "DEVELOPMENT_VALUE_1_DESCRIPTION"
  | "DEVELOPMENT_VALUE_2_TITLE"
  | "DEVELOPMENT_VALUE_2_DESCRIPTION"
  | "DEVELOPMENT_VALUE_3_TITLE"
  | "DEVELOPMENT_VALUE_3_DESCRIPTION"
  | "EMAIL";

export type PortfolioContent = {
  category: PortfolioContentCategory;
  contentCode: PortfolioContentCode;
  contentValue: string;
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
};

export type TechnologyCategory = "LANGUAGE" | "BACKEND" | "DATABASE" | "FRONTEND" | "INFRA" | "DEVOPS";

export type PublicTechnology = {
  id: number;
  name: string;
  category: TechnologyCategory;
  iconUrl: string | null;
  displayOrder: number;
};

export type PublicProjectCard = {
  id: number;
  slug: string;
  name: string;
  year: number;
  tagline: string;
  description: string;
  cardRole: string;
  thumbnailUrl: string | null;
  technologies: PublicTechnology[];
};

export type PublicProjectTechnology = PublicTechnology & {
  highlighted: boolean;
};

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

export type ProjectMedia = {
  id: number;
  imageUrl: string;
  label: string | null;
  altText: string | null;
  displayOrder: number;
};

export type PublicProjectDetail = {
  id: number;
  slug: string;
  name: string;
  year: number | null;
  tagline: string | null;
  summary: string | null;
  detailRole: string | null;
  startedAt: string | null;
  endedAt: string | null;
  teamSize: number | null;
  thumbnailUrl: string | null;
  architectureImageUrl: string | null;
  technologies: PublicProjectTechnology[];
  content: ProjectContent;
  media: ProjectMedia[];
};

export type ToolKey = "QUIZ" | "LINKS";

export type ToolItem = {
  toolKey: ToolKey;
  name: string;
};

export type ToolListResponse = {
  items: ToolItem[];
};

export type ToolLinkCategory = "REFERENCE" | "MY_SERVICES";

export type ToolLink = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  category: ToolLinkCategory;
};

export type ToolLinkListResponse = {
  items: ToolLink[];
};

export type QuizSummary = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type QuizListResponse = {
  items: QuizSummary[];
};

export type SavedQuiz = QuizSummary & {
  quizJson: unknown;
  responseJson: unknown | null;
};

export type ExternalLink = {
  id: number;
  name: string;
  url: string;
  displayOrder: number;
};

export type ResumeMetadata = {
  fileName: string;
  updatedAt: string;
};

export type PublicPortfolio = {
  portfolioContents: PortfolioContent[];
  profileEntries: ProfileEntry[];
  portfolioTechnologies: PublicTechnology[];
  projects: PublicProjectCard[];
  externalLinks: ExternalLink[];
  resume: ResumeMetadata | null;
};
