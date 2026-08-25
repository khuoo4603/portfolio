import AdminShell from "@/features/admin/admin-shell";

// 전체 Admin Route의 Session Gate와 공통 Layout
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
