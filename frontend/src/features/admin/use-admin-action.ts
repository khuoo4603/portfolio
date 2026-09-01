"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, formatApiError } from "@/lib/api/client";
import {
  createAdminChallenge,
  type AdminActionBinding,
  type AdminActionVerification,
} from "./admin-action-api";

export type AdminAction<TResult = void> = AdminActionBinding & {
  actionLabel: string;
  mutation: (verification: AdminActionVerification) => Promise<TResult>;
  onSuccess?: (result: TResult) => void;
};

type ActiveAdminAction = {
  action: AdminAction<unknown>;
  challengeId: string;
  expiresAt: string;
};

// Challenge 발급부터 일회성 Mutation 제출까지 공통 ADMIN_ACTION 흐름 조정
export function useAdminAction() {
  const router = useRouter();
  const [active, setActive] = useState<ActiveAdminAction | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startError, setStartError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const issueInFlight = useRef(false);
  const mutationInFlight = useRef(false);

  const handleUnauthorized = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      router.replace("/login");
    }
  }, [router]);

  // 확정된 작업 정보로 Challenge를 먼저 발급하고 성공한 경우에만 Dialog 표시
  const start = useCallback(async <TResult,>(action: AdminAction<TResult>) => {
    if (issueInFlight.current || mutationInFlight.current || active) {
      return;
    }

    issueInFlight.current = true;
    setIssuing(true);
    setStartError("");
    setDialogError("");
    try {
      const challenge = await createAdminChallenge(action);
      setActive({
        action: action as AdminAction<unknown>,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
      });
    } catch (error) {
      setStartError(formatApiError(error));
      handleUnauthorized(error);
    } finally {
      issueInFlight.current = false;
      setIssuing(false);
    }
  }, [active, handleUnauthorized]);

  // 같은 operation·target으로 새 Challenge를 발급해 기존 Challenge 교체
  const resend = useCallback(async () => {
    if (!active || issueInFlight.current || mutationInFlight.current) {
      return;
    }

    issueInFlight.current = true;
    setIssuing(true);
    setDialogError("");
    try {
      const challenge = await createAdminChallenge(active.action);
      setActive((current) => current ? {
        ...current,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
      } : null);
    } catch (error) {
      setDialogError(formatApiError(error));
      handleUnauthorized(error);
    } finally {
      issueInFlight.current = false;
      setIssuing(false);
    }
  }, [active, handleUnauthorized]);

  // 입력값을 Backend에 그대로 전달하고 Mutation 성공 시 Challenge 상태 폐기
  const submit = useCallback(async (verificationCode: string) => {
    if (!active || issueInFlight.current || mutationInFlight.current) {
      return;
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      setDialogError("6자리 인증번호를 입력해 주세요.");
      return;
    }

    mutationInFlight.current = true;
    setSubmitting(true);
    setDialogError("");
    let successCallback: (() => void) | null = null;
    try {
      const result = await active.action.mutation({
        challengeId: active.challengeId,
        verificationCode,
      });
      setActive(null);
      successCallback = () => active.action.onSuccess?.(result);
    } catch (error) {
      setDialogError(formatApiError(error));
      handleUnauthorized(error);
    } finally {
      mutationInFlight.current = false;
      setSubmitting(false);
    }
    successCallback?.();
  }, [active, handleUnauthorized]);

  const cancel = useCallback(() => {
    if (issueInFlight.current || mutationInFlight.current) {
      return;
    }
    setActive(null);
    setDialogError("");
  }, []);

  return {
    start,
    startError,
    issuing,
    dialog: active ? {
      open: true as const,
      actionLabel: active.action.actionLabel,
      challengeId: active.challengeId,
      expiresAt: active.expiresAt,
      busy: issuing || submitting,
      error: dialogError,
      onCancel: cancel,
      onConfirm: submit,
      onResend: resend,
    } : null,
  };
}
