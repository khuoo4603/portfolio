"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { useNotification } from "@/components/ui/notification/notification-provider";
import { ApiError, formatApiError } from "@/lib/api/client";
import type { AdminMonitoringData, MonitoringSettings, MonitoringSettingsInput, MonitoringTarget, MonitoringTargetUpdateInput } from "./admin-types";
import { getAdminMonitoring, updateMonitoringSettings, updateMonitoringTarget } from "./admin-read-api";
import { PageError, PageHeader, PageLoading, StateSwitch } from "./admin-ui";
import MonitoringTargetDialog from "./monitoring-target-dialog";
import styles from "./admin.module.css";

type SettingsDraft = Record<Exclude<keyof MonitoringSettingsInput, "enabled">, string>;

type SettingsField = keyof SettingsDraft;

type TargetDialogState = {
  target: MonitoringTarget | null;
  initialEnabled?: boolean;
};

const SETTINGS_FIELDS: ReadonlyArray<{ key: SettingsField; label: string; unit: string; minimum: number }> = [
  { key: "checkIntervalSeconds", label: "검사 주기", unit: "초", minimum: 1 },
  { key: "connectTimeoutMs", label: "연결 Timeout", unit: "ms", minimum: 1 },
  { key: "requestTimeoutMs", label: "요청 Timeout", unit: "ms", minimum: 1 },
  { key: "retryDelayMs", label: "Retry Delay", unit: "ms", minimum: 0 },
  { key: "maxRetries", label: "최대 재시도", unit: "회", minimum: 0 },
];

// API 설정값의 숫자를 빈 입력도 허용하는 Form 상태로 변환
function toSettingsDraft(settings: MonitoringSettings): SettingsDraft {
  return {
    checkIntervalSeconds: String(settings.checkIntervalSeconds),
    connectTimeoutMs: String(settings.connectTimeoutMs),
    requestTimeoutMs: String(settings.requestTimeoutMs),
    retryDelayMs: String(settings.retryDelayMs),
    maxRetries: String(settings.maxRetries),
  };
}

// Monitoring 설정 숫자 입력의 최소값 검증
function validateInteger(value: string, minimum: number) {
  const parsed = Number(value);
  if (!value.trim() || !Number.isInteger(parsed) || parsed < minimum) {
    return minimum === 0 ? "0 이상의 정수를 입력하세요." : "0보다 큰 정수를 입력하세요.";
  }
  return "";
}

// Monitoring 설정과 Target을 관리하는 독립 Admin 화면
export default function MonitoringScreen() {
  const { notify } = useNotification();
  const [data, setData] = useState<AdminMonitoringData | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [targetBusyId, setTargetBusyId] = useState<number | null>(null);
  const [targetDialog, setTargetDialog] = useState<TargetDialogState | null>(null);
  const requestSequence = useRef(0);

  // 최신 요청만 반영하는 Monitoring 데이터 조회
  const loadMonitoring = useCallback(async (initialLoad = false) => {
    const requestId = ++requestSequence.current;
    if (initialLoad) {
      setLoading(true);
      setLoadError("");
    }
    try {
      const response = await getAdminMonitoring();
      if (requestSequence.current !== requestId) {
        return false;
      }
      setData(response);
      setSettingsDraft(toSettingsDraft(response.settings));
      return true;
    } catch (caught) {
      if (requestSequence.current === requestId) {
        if (initialLoad) {
          setData(null);
          setSettingsDraft(null);
          setLoadError(formatApiError(caught));
        }
      }
      return false;
    } finally {
      if (requestSequence.current === requestId) {
        if (initialLoad) {
          setLoading(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadMonitoring(true);
      }
    });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [loadMonitoring]);

  // Settings Form 저장과 Backend 최신 상태 반영
  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settingsDraft || settingsSaving) {
      return;
    }

    const nextErrors = SETTINGS_FIELDS.reduce<Record<string, string>>((errors, field) => {
      const message = validateInteger(settingsDraft[field.key], field.minimum);
      if (message) {
        errors[field.key] = message;
      }
      return errors;
    }, {});
    if (Object.keys(nextErrors).length > 0) {
      setSettingsErrors(nextErrors);
      return;
    }

    const input = SETTINGS_FIELDS.reduce<MonitoringSettingsInput>((settings, field) => ({
      ...settings,
      [field.key]: Number(settingsDraft[field.key]),
    }), { enabled: true } as MonitoringSettingsInput);

    setSettingsSaving(true);
    setSettingsErrors({});
    try {
      await updateMonitoringSettings(input);
      if (await loadMonitoring()) {
        notify({ type: "success", title: "Monitoring 설정 저장 완료", message: "변경한 점검 설정을 반영했습니다." });
      } else {
        notify({ type: "error", title: "Monitoring 설정 저장 완료", message: "저장은 완료됐지만 최신 상태를 불러오지 못했습니다." });
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.response.fieldErrors.length > 0) {
        setSettingsErrors(caught.response.fieldErrors.reduce<Record<string, string>>((errors, item) => {
          errors[item.field] = item.message;
          return errors;
        }, {}));
        return;
      }
      notify({ type: "error", title: "Monitoring 설정 저장 실패", message: formatApiError(caught) });
    } finally {
      setSettingsSaving(false);
    }
  };

  // Target 목록의 즉시 사용 상태 변경
  const toggleTarget = async (target: MonitoringTarget) => {
    const nextEnabled = !target.enabled;
    if (nextEnabled && !target.healthUrl) {
      setTargetDialog({ target, initialEnabled: true });
      return;
    }

    const input: MonitoringTargetUpdateInput = {
      displayName: target.displayName,
      healthUrl: target.healthUrl,
      enabled: nextEnabled,
      displayOrder: target.displayOrder,
    };
    setTargetBusyId(target.id);
    try {
      await updateMonitoringTarget(target.id, input);
      if (await loadMonitoring()) {
        notify({ type: "success", title: "Target 상태 변경 완료", message: `${target.displayName} 상태를 변경했습니다.` });
      } else {
        notify({ type: "error", title: "Target 상태 변경 완료", message: "상태 변경 후 최신 목록을 불러오지 못했습니다." });
      }
    } catch (caught) {
      notify({ type: "error", title: "Target 상태 변경 실패", message: formatApiError(caught) });
    } finally {
      setTargetBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Monitoring" description="서비스 점검 설정과 Monitoring Target을 관리합니다." />
      {loading ? <PageLoading rows={8} /> : loadError ? (
        <PageError message={loadError} onRetry={() => void loadMonitoring(true)} />
      ) : data && settingsDraft ? (
        <div className={styles.pageSections}>
          <section className={styles.managementSurface} aria-labelledby="monitoring-settings-title">
            <form className={styles.monitoringSettingsForm} onSubmit={saveSettings} noValidate>
              <div className={`${styles.managementSurfaceHeader} ${styles.monitoringSurfaceHeader}`}>
                <div>
                  <h2 id="monitoring-settings-title" className="type-title">Monitoring 설정</h2>
                </div>
                <Button busy={settingsSaving}>설정 저장</Button>
              </div>
              <div className={styles.monitoringSettingsBody}>
                <div className={styles.monitoringSettingsGrid}>
                {SETTINGS_FIELDS.map((field) => (
                  <label key={field.key} className={styles.formField}>
                    <span>{field.label}</span>
                    <div className={styles.unitField}>
                      <input
                        type="number"
                        min={field.minimum}
                        step="1"
                        inputMode="numeric"
                        value={settingsDraft[field.key]}
                        aria-label={field.label}
                        aria-invalid={Boolean(settingsErrors[field.key])}
                        disabled={settingsSaving}
                        onChange={(event) => setSettingsDraft((current) => current ? { ...current, [field.key]: event.target.value } : current)}
                      />
                      <span>{field.unit}</span>
                    </div>
                    {settingsErrors[field.key] && <p className={`${styles.inlineError} type-small`}>{settingsErrors[field.key]}</p>}
                  </label>
                ))}
                </div>
              </div>
            </form>
          </section>

          <section className={styles.managementSurface} aria-labelledby="monitoring-targets-title">
            <div className={`${styles.managementSurfaceHeader} ${styles.monitoringSurfaceHeader}`}>
              <div>
                <h2 id="monitoring-targets-title" className="type-title">Target</h2>
              </div>
              <Button variant="secondary" type="button" onClick={() => setTargetDialog({ target: null })}>Target 추가</Button>
            </div>
            <div className={styles.monitoringTargetList}>
              {data.targets.map((target) => {
                const busy = targetBusyId === target.id;
                return (
                  <article key={target.id} className={styles.monitoringTargetRow}>
                    <div className={styles.monitoringTargetIdentity}>
                      <strong className="type-body">{target.displayName}</strong>
                      <code>{target.serviceKey}</code>
                    </div>
                    <p className={`${styles.monitoringTargetUrl} type-small`}>{target.healthUrl ?? "URL 미설정"}</p>
                    <span className={`${styles.monitoringTargetOrder} type-small`}>순서 {target.displayOrder}</span>
                    <StateSwitch
                      enabled={target.enabled}
                      disabled={busy}
                      label={`${target.displayName} ${target.enabled ? "비활성화" : "활성화"}`}
                      onClick={() => void toggleTarget(target)}
                    />
                    <Button variant="secondary" size="small" type="button" disabled={busy} onClick={() => setTargetDialog({ target })}>수정</Button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
      {targetDialog && (
        <MonitoringTargetDialog
          key={`${targetDialog.target?.id ?? "create"}-${targetDialog.initialEnabled ?? false}`}
          target={targetDialog.target}
          targetCount={data?.targets.length ?? 0}
          initialEnabled={targetDialog.initialEnabled}
          onClose={() => setTargetDialog(null)}
          onSaved={loadMonitoring}
        />
      )}
    </>
  );
}
