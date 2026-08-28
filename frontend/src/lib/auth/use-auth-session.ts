"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getCurrentUser } from "./auth-api";
import type { CurrentUser } from "@/types/api";

export type AuthSessionState =
  | { status: "loading"; user: null; error: null }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "authenticated"; user: CurrentUser; error: null }
  | { status: "error"; user: null; error: unknown };

const LOADING: AuthSessionState = { status: "loading", user: null, error: null };

// `/auth/me` 기준 USER·ADMIN Session 상태 관리
export function useAuthSession() {
  const [state, setState] = useState<AuthSessionState>(LOADING);

  const refresh = useCallback(async () => {
    setState(LOADING);
    try {
      const user = await getCurrentUser();
      setState({ status: "authenticated", user, error: null });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setState({ status: "unauthenticated", user: null, error: null });
        return;
      }
      setState({ status: "error", user: null, error });
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then((user) => {
        if (active) {
          setState({ status: "authenticated", user, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          setState({ status: "unauthenticated", user: null, error: null });
          return;
        }
        setState({ status: "error", user: null, error });
      });

    return () => {
      active = false;
    };
  }, []);

  // Logout·비밀번호 변경 이후 Local Session 상태 초기화
  const clear = useCallback(() => {
    setState({ status: "unauthenticated", user: null, error: null });
  }, []);

  return { ...state, refresh, clear };
}
