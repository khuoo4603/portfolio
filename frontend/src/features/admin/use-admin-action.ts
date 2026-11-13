"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, formatApiError } from "@/lib/api/client";
import {
  createAdminChallenge,
  getAdminActionGrace,
  type AdminActionBinding,
  type AdminActionGraceResponse,
  type AdminActionVerification,
} from "./admin-action-api";

export type AdminAction<TResult = void> = AdminActionBinding & {
  actionLabel: string;
  mutation: (verification?: AdminActionVerification) => Promise<TResult>;
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
  const [grace, setGrace] = useState<AdminActionGraceResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const startInFlight = useRef(false);
  const issueInFlight = useRef(false);
  const mutationInFlight = useRef(false);

  const handleUnauthorized = useCallback((error: unknown) => {
    const unauthorized = error instanceof ApiError && error.status === 401;
    if (error instanceof ApiError && error.response.code === "AUTH_FORBIDDEN") {
      setGrace(null);
    }
    if (unauthorized) {
      setGrace(null);
      router.replace("/login");
    }
    return unauthorized;
  }, [router]);

  const refreshGrace = useCallback(async () => {
    try {
      const response = await getAdminActionGrace();
      setGrace(response);
    } catch (error) {
      if (handleUnauthorized(error)) {
        setGrace(null);
      }
    }
  }, [handleUnauthorized]);

  const issueChallenge = useCallback(async (action: AdminAction<unknown>, resending = false) => {
    issueInFlight.current = true;
    setActive((current) => current ?? {
      action,
      challengeId: null,
      expiresAt: null,
    });
    setIssuing(true);
    setResending(resending);
    setPhase("SENDING");
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
      setResending(false);
    }
  }, [handleUnauthorized]);

  const executeMutation = useCallback(async <TResult,>(action: AdminAction<TResult>, verification?: AdminActionVerification) => {
    mutationInFlight.current = true;
    setSubmitting(true);
    try {
      const result = await action.mutation(verification);
      void refreshGrace();
      action.onSuccess?.(result);
      return result;
    } finally {
      mutationInFlight.current = false;
      setSubmitting(false);
    }
  }, [refreshGrace]);

  // 서버 유예 확인 후 필요할 때만 기존 Challenge Dialog를 여는 Critical 작업 시작
  const start = useCallback(async <TResult,>(action: AdminAction<TResult>) => {
    if (startInFlight.current || issueInFlight.current || mutationInFlight.current || active) {
      return;
    }

    startInFlight.current = true;
    setStarting(true);
    setStartError("");
    try {
      const currentGrace = await getAdminActionGrace();
      setGrace(currentGrace);
      if (!currentGrace.verified) {
        await issueChallenge(action as AdminAction<unknown>);
        return;
      }

      try {
        await executeMutation(action);
      } catch (error) {
        if (!isReauthenticationRequired(error)) {
          throw error;
        }
        await issueChallenge(action as AdminAction<unknown>);
      }
    } catch (error) {
      const message = formatApiError(error);
      if (handleUnauthorized(error)) {
        setStartError(message);
      } else {
        setStartError(message);
      }
    } finally {
      startInFlight.current = false;
      setStarting(false);
    }
  }, [active, executeMutation, handleUnauthorized, issueChallenge]);

  // 같은 operation·target으로 새 Challenge를 발급해 기존 Challenge 교체
  const resend = useCallback(async () => {
    if (!active || issueInFlight.current || mutationInFlight.current) {
      return;
    }

    await issueChallenge(active.action, true);
  }, [active, issueChallenge]);

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
      void refreshGrace();
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
  }, [active, handleUnauthorized, refreshGrace]);

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
    busy: starting || issuing || submitting || active !== null,
    grace,
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
      grace,
      onCancel: cancel,
      onConfirm: submit,
      onResend: resend,
    } : null,
  };
}

function isReauthenticationRequired(error: unknown) {
  return error instanceof ApiError
    && error.response.code === "AUTH_ADMIN_ACTION_REAUTH_REQUIRED";
}
