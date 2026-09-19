"use client";

import { useState } from "react";
import { ApiError, formatApiError } from "@/lib/api/client";
import type { MonitoringTarget, MonitoringTargetCreateInput, MonitoringTargetUpdateInput } from "./admin-types";
import { createMonitoringTarget, updateMonitoringTarget } from "./admin-read-api";
import { StateSwitch, SubmitButton } from "./admin-ui";
import DialogFrame from "./dialog-frame";
import styles from "./admin.module.css";

type MonitoringTargetDialogProps = {
  target: MonitoringTarget | null;
  targetCount: number;
  initialEnabled?: boolean;
  onClose: () => void;
  onSaved: () => Promise<boolean>;
};

type TargetDraft = {
  serviceKey: string;
  displayName: string;
  healthUrl: string;
  enabled: boolean;
  displayOrder: string;
};

// Target 응답을 수정 가능한 Form 상태로 변환
function toDraft(target: MonitoringTarget | null, targetCount: number, initialEnabled: boolean): TargetDraft {
  return target ? {
    serviceKey: target.serviceKey,
    displayName: target.displayName,
    healthUrl: target.healthUrl ?? "",
    enabled: initialEnabled,
    displayOrder: String(target.displayOrder),
  } : {
    serviceKey: "",
    displayName: "",
    healthUrl: "",
    enabled: initialEnabled,
    displayOrder: String(targetCount),
  };
}

// Target Dialog의 생성·수정 Form
export default function MonitoringTargetDialog({
  target,
  targetCount,
  initialEnabled = target?.enabled ?? false,
  onClose,
  onSaved,
}: MonitoringTargetDialogProps) {
  const [draft, setDraft] = useState(() => toDraft(target, targetCount, initialEnabled));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mutationError, setMutationError] = useState("");
  const [saving, setSaving] = useState(false);

  // Target Form의 생성·수정 요청
  const saveTarget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) {
      return;
    }

    const nextErrors: Record<string, string> = {};
    const serviceKey = draft.serviceKey.trim();
    const displayName = draft.displayName.trim();
    const healthUrl = draft.healthUrl.trim();
    const displayOrder = Number(draft.displayOrder);

    if (!target && !serviceKey) {
      nextErrors.serviceKey = "Service Key를 입력하세요.";
    }
    if (!displayName) {
      nextErrors.displayName = "표시명을 입력하세요.";
    }
    if (draft.enabled && !healthUrl) {
      nextErrors.healthUrl = "활성 Target에는 Health URL이 필요합니다.";
    }
    if (!draft.displayOrder.trim() || !Number.isInteger(displayOrder) || displayOrder < 0) {
      nextErrors.displayOrder = "0 이상의 정수를 입력하세요.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const input: MonitoringTargetUpdateInput = {
      displayName,
      healthUrl: healthUrl || null,
      enabled: draft.enabled,
      displayOrder,
    };

    setSaving(true);
    setErrors({});
    setMutationError("");
    try {
      if (target) {
        await updateMonitoringTarget(target.id, input);
      } else {
        const createInput: MonitoringTargetCreateInput = { ...input, serviceKey };
        await createMonitoringTarget(createInput);
      }
      await onSaved();
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.response.fieldErrors.reduce<Record<string, string>>((fieldErrors, item) => {
          fieldErrors[item.field] = item.message;
          return fieldErrors;
        }, {}));
      }
      setMutationError(formatApiError(caught));
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = target ? "Target 저장" : "Target 등록";
  const switchLabel = `${draft.displayName || "Target"} ${draft.enabled ? "비활성화" : "활성화"}`;

  return (
    <DialogFrame
      open
      title={target ? "Target 수정" : "Target 추가"}
      description="서비스 점검 대상의 연결 정보와 사용 상태를 관리합니다."
      onClose={onClose}
      footer={
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" disabled={saving} onClick={onClose}>취소</button>
          <SubmitButton busy={saving} onClick={() => (document.getElementById("monitoring-target-form") as HTMLFormElement | null)?.requestSubmit()}>{actionLabel}</SubmitButton>
        </>
      }
    >
      <form id="monitoring-target-form" className={styles.targetDialogForm} onSubmit={saveTarget} noValidate>
        <div className={styles.targetDialogFields}>
          <label className={styles.formField}>
            <span>Service Key</span>
            {target ? <code>{target.serviceKey}</code> : (
              <input
                value={draft.serviceKey}
                aria-label="Service Key"
                aria-invalid={Boolean(errors.serviceKey)}
                disabled={saving}
                onChange={(event) => setDraft((current) => ({ ...current, serviceKey: event.target.value }))}
              />
            )}
            {errors.serviceKey && <p className={`${styles.inlineError} type-small`}>{errors.serviceKey}</p>}
          </label>
          <label className={styles.formField}>
            <span>표시명</span>
            <input
              value={draft.displayName}
              aria-label="표시명"
              aria-invalid={Boolean(errors.displayName)}
              disabled={saving}
              onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
            />
            {errors.displayName && <p className={`${styles.inlineError} type-small`}>{errors.displayName}</p>}
          </label>
          <label className={`${styles.formField} ${styles.targetDialogWideField}`}>
            <span>Health URL</span>
            <input
              type="url"
              placeholder="http://service:8080/health"
              value={draft.healthUrl}
              aria-label="Health URL"
              aria-invalid={Boolean(errors.healthUrl)}
              disabled={saving}
              onChange={(event) => setDraft((current) => ({ ...current, healthUrl: event.target.value }))}
            />
            <p className={`${styles.fieldHint} type-small`}>비활성 Target은 비워 두면 URL 미설정으로 저장합니다.</p>
            {errors.healthUrl && <p className={`${styles.inlineError} type-small`}>{errors.healthUrl}</p>}
          </label>
          <label className={styles.formField}>
            <span>표시 순서</span>
            <div className={styles.unitField}>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={draft.displayOrder}
                aria-label="표시 순서"
                aria-invalid={Boolean(errors.displayOrder)}
                disabled={saving}
                onChange={(event) => setDraft((current) => ({ ...current, displayOrder: event.target.value }))}
              />
              <span>순서</span>
            </div>
            {errors.displayOrder && <p className={`${styles.inlineError} type-small`}>{errors.displayOrder}</p>}
          </label>
          <div className={styles.targetDialogSwitchField}>
            <span>사용 상태</span>
            <StateSwitch
              enabled={draft.enabled}
              disabled={saving}
              label={switchLabel}
              onClick={() => setDraft((current) => ({ ...current, enabled: !current.enabled }))}
            />
          </div>
        </div>
        {mutationError && <p className={`${styles.inlineError} type-small`} role="alert">{mutationError}</p>}
      </form>
    </DialogFrame>
  );
}
