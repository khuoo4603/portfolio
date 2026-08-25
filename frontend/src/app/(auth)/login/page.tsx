import type { Metadata } from "next";
import LoginScreen from "@/features/auth/login-screen";

export const metadata: Metadata = {
  title: "로그인 | 김현우 포트폴리오",
  description: "Tools 및 관리자 영역 통합 로그인",
};

// Authentication 통합 로그인 Route
export default function LoginPage() {
  return <LoginScreen />;
}
