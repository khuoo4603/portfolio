export type MockAuthAccount = {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
};

// Authentication UI 검증용 명시적 Sample 계정
export const MOCK_ADMIN_ACCOUNT: MockAuthAccount = {
  id: 1,
  email: "admin@portfolio.local",
  name: "김현우",
  role: "ADMIN",
};

export const MOCK_USER_ACCOUNT: MockAuthAccount = {
  id: 2,
  email: "user@portfolio.local",
  name: "Mock User",
  role: "USER",
};

export const MOCK_AUTH_ACCOUNTS = [MOCK_ADMIN_ACCOUNT, MOCK_USER_ACCOUNT];
export const MOCK_CURRENT_ADMIN = MOCK_ADMIN_ACCOUNT;
export const MOCK_LOGIN_PASSWORD = "password123";
export const MOCK_ADMIN_OTP = "123456";
export const MOCK_OTP_DURATION_MS = 5 * 60 * 1000;
export const MOCK_RESEND_WAIT_MS = 60 * 1000;
