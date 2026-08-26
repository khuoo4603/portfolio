import type { Metadata } from "next";
import ToolsShell from "@/features/tools/tools-shell";

export const metadata: Metadata = {
  title: "Tools | Kim Hyunwoo",
};

// 전체 Tools Route의 Session Gate와 공통 Header
export default function ToolsLayout({ children }: LayoutProps<"/tools">) {
  return <ToolsShell>{children}</ToolsShell>;
}
