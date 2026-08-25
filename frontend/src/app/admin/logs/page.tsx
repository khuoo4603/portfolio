import { Suspense } from "react";
import LogsScreen from "@/features/admin/logs-screen";

// 운영 로그인 및 5xx 오류 기록 관리 Page
export default function AdminLogsPage() {
  return (
    <Suspense fallback={null}>
      <LogsScreen />
    </Suspense>
  );
}
