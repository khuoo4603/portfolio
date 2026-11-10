"use client";

import { useSyncExternalStore } from "react";
import {
  getPerformanceSnapshot,
  getServerPerformanceSnapshot,
  subscribePerformanceMode,
} from "./performance-mode";

// 전역 성능 상태를 React 컴포넌트에 연결하는 읽기 전용 구독 Hook
export function usePerformanceMode() {
  return useSyncExternalStore(
    subscribePerformanceMode,
    getPerformanceSnapshot,
    getServerPerformanceSnapshot,
  );
}
