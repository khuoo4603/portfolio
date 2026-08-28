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
