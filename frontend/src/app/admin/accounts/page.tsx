import type { Metadata } from "next";
import AccountsScreen from "@/features/admin/accounts-screen";

export const metadata: Metadata = {
  title: "Accounts | Portfolio Admin",
};

// 관리자 계정 관리 Route
export default function AccountsPage() {
  return <AccountsScreen />;
}
