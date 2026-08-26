import type { Metadata } from "next";
import LinksScreen from "@/features/tools/links-screen";

export const metadata: Metadata = {
  title: "Links | Tools",
};

// 활성 공통 Link 조회 Route
export default function LinksPage() {
  return <LinksScreen />;
}
