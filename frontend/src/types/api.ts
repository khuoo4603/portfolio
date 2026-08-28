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

export type PortfolioContent = {
  category: string;
  contentCode: string;
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
  featured: boolean;
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
