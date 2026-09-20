import type { Metadata } from "next";
import MonitoringScreen from "@/features/admin/monitoring-screen";

export const metadata: Metadata = {
  title: "Monitoring | Portfolio Admin",
};

// Monitoring 설정과 Target 관리 Route
export default function MonitoringPage() {
  return <MonitoringScreen />;
}
