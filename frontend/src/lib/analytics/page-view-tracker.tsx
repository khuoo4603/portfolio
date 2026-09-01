"use client";

import { useEffect, useRef } from "react";
import { recordPageView } from "./page-view-action";

const STORAGE_KEY = "portfolio_visitor_key";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function visitorKey() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && UUID.test(stored)) {
    return stored;
  }
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}

// Public 화면 표시와 독립적으로 Server Action에 방문 집계를 요청
export default function PageViewTracker({ path }: { path: string }) {
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    try {
      void recordPageView(visitorKey(), path);
    } catch {
      // Storage 또는 Analytics 오류는 화면에 전파하지 않는다.
    }
  }, [path]);
  return null;
}
