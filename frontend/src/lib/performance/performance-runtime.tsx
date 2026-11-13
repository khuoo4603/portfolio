"use client";

import { useEffect } from "react";
import { startPerformanceRuntime, stopPerformanceRuntime } from "./performance-mode";

// Root Layout에서 단일 전역 성능 측정 런타임을 시작하고 정리하는 Client Component
export default function PerformanceRuntime() {
  useEffect(() => {
    startPerformanceRuntime();
    return stopPerformanceRuntime;
  }, []);

  return null;
}
