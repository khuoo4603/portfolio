import type { Metadata } from "next";
import ToolsScreen from "@/features/admin/tools-screen";

export const metadata: Metadata = {
  title: "Tools | Portfolio Admin",
};

// Tool Registry 관리 Route
export default function ToolsPage() {
  return <ToolsScreen />;
}
