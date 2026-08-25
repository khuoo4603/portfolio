import type { Metadata } from "next";
import DashboardScreen from "@/features/admin/dashboard-screen";

export const metadata: Metadata = {
  title: "Dashboard | Portfolio Admin",
};

// 포트폴리오 운영 Dashboard Route
export default function AdminPage() {
  return <DashboardScreen />;
}
