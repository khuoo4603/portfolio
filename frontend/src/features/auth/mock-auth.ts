export type MockAuthAccount = {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
};

// Branch 2 Admin Shell 실제화 전용 Sample 계정
export const MOCK_ADMIN_ACCOUNT: MockAuthAccount = {
  id: 1,
  email: "admin@portfolio.local",
  name: "김현우",
  role: "ADMIN",
};

export const MOCK_CURRENT_ADMIN = MOCK_ADMIN_ACCOUNT;
export const MOCK_ADMIN_OTP = "123456";
export const MOCK_OTP_DURATION_MS = 5 * 60 * 1000;
export const MOCK_RESEND_WAIT_MS = 60 * 1000;
