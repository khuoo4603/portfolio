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

export type AdminActionPhase = "SENDING" | "READY" | "VERIFYING" | "ERROR";

type ActiveAdminAction = {
  action: AdminAction<unknown>;
  challengeId: string | null;
  expiresAt: string | null;
};

// Challenge 발급부터 일회성 Mutation 제출까지 공통 ADMIN_ACTION 흐름 조정
export function useAdminAction() {
  const router = useRouter();
  const [active, setActive] = useState<ActiveAdminAction | null>(null);
  const [phase, setPhase] = useState<AdminActionPhase>("SENDING");
  const [issuing, setIssuing] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startError, setStartError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const issueInFlight = useRef(false);
  const mutationInFlight = useRef(false);

  const handleUnauthorized = useCallback((error: unknown) => {
    const unauthorized = error instanceof ApiError && error.status === 401;
    if (unauthorized) {
      router.replace("/login");
    }
    return unauthorized;
  }, [router]);

  // 확정된 작업 정보를 먼저 표시한 뒤 Dialog 내부에서 Challenge 발급
  const start = useCallback(async <TResult,>(action: AdminAction<TResult>) => {
    if (issueInFlight.current || mutationInFlight.current || active) {
      return;
    }

    issueInFlight.current = true;
    setActive({
      action: action as AdminAction<unknown>,
      challengeId: null,
      expiresAt: null,
    });
    setIssuing(true);
    setResending(false);
    setPhase("SENDING");
    setStartError("");
    setDialogError("");
    try {
      const challenge = await createAdminChallenge(action);
      setActive((current) => current ? {
        ...current,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
      } : null);
      setPhase("READY");
    } catch (error) {
      const message = formatApiError(error);
      if (handleUnauthorized(error)) {
        setStartError(message);
        setActive(null);
      } else {
        setDialogError(message);
        setPhase("ERROR");
      }
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
    setResending(true);
    setPhase("SENDING");
    setDialogError("");
    try {
      const challenge = await createAdminChallenge(active.action);
      setActive((current) => current ? {
        ...current,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
      } : null);
      setPhase("READY");
    } catch (error) {
      const message = formatApiError(error);
      if (handleUnauthorized(error)) {
        setStartError(message);
        setActive(null);
      } else {
        setDialogError(message);
        setPhase("ERROR");
      }
    } finally {
      issueInFlight.current = false;
      setIssuing(false);
      setResending(false);
    }
  }, [active, handleUnauthorized]);

  // 입력값을 Backend에 그대로 전달하고 Mutation 성공 시 Challenge 상태 폐기
  const submit = useCallback(async (verificationCode: string) => {
    if (!active || issueInFlight.current || mutationInFlight.current) {
      return;
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      setDialogError("6자리 인증번호를 입력해 주세요.");
      setPhase("ERROR");
      return;
    }
    if (!active.challengeId) {
      setDialogError("인증번호 발급을 완료하지 못했습니다.");
      setPhase("ERROR");
      return;
    }

    const challengeId = active.challengeId;
    mutationInFlight.current = true;
    setSubmitting(true);
    setPhase("VERIFYING");
    setDialogError("");
    let successCallback: (() => void) | null = null;
    try {
      const result = await active.action.mutation({
        challengeId,
        verificationCode,
      });
      setActive(null);
      successCallback = () => active.action.onSuccess?.(result);
    } catch (error) {
      setDialogError(formatApiError(error));
      setPhase("ERROR");
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
    setResending(false);
  }, []);

  return {
    start,
    startError,
    issuing,
    dialog: active ? {
      open: true as const,
      actionLabel: active.action.actionLabel,
      phase,
      challengeId: active.challengeId,
      expiresAt: active.expiresAt,
      issuing,
      resending,
      submitting,
      error: dialogError,
      onCancel: cancel,
      onConfirm: submit,
      onResend: resend,
    } : null,
  };
}
