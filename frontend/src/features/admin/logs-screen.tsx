"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type { ErrorLog, ErrorLogPage, LoginLog, LoginLogPage } from "./admin-types";
import {
  getErrorLogs,
  getLoginLogs,
  kstEndOfDay,
  kstStartOfDay,
  type ErrorService,
  type LoginResult,
} from "./admin-read-api";
import { EmptyState, PageError, PageHeader, PageLoading, StatusLabel, formatDateTime } from "./admin-ui";
import styles from "./admin.module.css";

type LogTab = "login" | "error";

type LoginFilters = {
  from: string;
  to: string;
  email: string;
  result: "" | LoginResult;
};

type ErrorFilters = {
  from: string;
  to: string;
  service: "" | ErrorService;
  statusCode: string;
};

const PAGE_SIZE = 50;
const EMPTY_LOGIN_FILTERS: LoginFilters = { from: "", to: "", email: "", result: "" };
const EMPTY_ERROR_FILTERS: ErrorFilters = { from: "", to: "", service: "", statusCode: "" };

// Backend Filtering과 Pagination을 사용하는 로그인·5xx 운영 기록 조회 화면
export default function LogsScreen() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LogTab>(() => searchParams.get("tab") === "errors" ? "error" : "login");
  const [loginDraft, setLoginDraft] = useState<LoginFilters>(EMPTY_LOGIN_FILTERS);
  const [errorDraft, setErrorDraft] = useState<ErrorFilters>(EMPTY_ERROR_FILTERS);
  const [loginFilters, setLoginFilters] = useState<LoginFilters>(EMPTY_LOGIN_FILTERS);
  const [errorFilters, setErrorFilters] = useState<ErrorFilters>(EMPTY_ERROR_FILTERS);
  const [loginPage, setLoginPage] = useState(0);
  const [errorPage, setErrorPage] = useState(0);
  const [loginData, setLoginData] = useState<LoginLogPage | null>(null);
  const [errorData, setErrorData] = useState<ErrorLogPage | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [errorLoading, setErrorLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [errorError, setErrorError] = useState("");
  const [filterError, setFilterError] = useState("");
  const loginRequestSequence = useRef(0);
  const errorRequestSequence = useRef(0);

  // 로그인 기록 조회와 오래된 응답 무시
  const loadLoginLogs = useCallback(async () => {
    const requestId = ++loginRequestSequence.current;
    setLoginLoading(true);
    setLoginError("");
    setLoginData(null);
    try {
      const response = await getLoginLogs({
        from: kstStartOfDay(loginFilters.from),
        to: kstEndOfDay(loginFilters.to),
        email: loginFilters.email.trim() || undefined,
        result: loginFilters.result || undefined,
        page: loginPage,
        size: PAGE_SIZE,
      });
      if (loginRequestSequence.current === requestId) {
        setLoginData(response);
      }
    } catch (caught) {
      if (loginRequestSequence.current === requestId) {
        setLoginError(formatApiError(caught));
      }
    } finally {
      if (loginRequestSequence.current === requestId) {
        setLoginLoading(false);
      }
    }
  }, [loginFilters, loginPage]);

  // 5xx 오류 기록 조회와 오래된 응답 무시
  const loadErrorLogs = useCallback(async () => {
    const requestId = ++errorRequestSequence.current;
    setErrorLoading(true);
    setErrorError("");
    setErrorData(null);
    try {
      const response = await getErrorLogs({
        from: kstStartOfDay(errorFilters.from),
        to: kstEndOfDay(errorFilters.to),
        service: errorFilters.service || undefined,
        statusCode: errorFilters.statusCode ? Number(errorFilters.statusCode) : undefined,
        page: errorPage,
        size: PAGE_SIZE,
      });
      if (errorRequestSequence.current === requestId) {
        setErrorData(response);
      }
    } catch (caught) {
      if (errorRequestSequence.current === requestId) {
        setErrorError(formatApiError(caught));
      }
    } finally {
      if (errorRequestSequence.current === requestId) {
        setErrorLoading(false);
      }
    }
  }, [errorFilters, errorPage]);

  useEffect(() => {
    if (tab !== "login") {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadLoginLogs();
      }
    });

    return () => {
      active = false;
      loginRequestSequence.current += 1;
    };
  }, [loadLoginLogs, tab]);

  useEffect(() => {
    if (tab !== "error") {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadErrorLogs();
      }
    });

    return () => {
      active = false;
      errorRequestSequence.current += 1;
    };
  }, [loadErrorLogs, tab]);

  // 로그 Domain 전환과 Backend Page 상태 분리
  const changeTab = (nextTab: LogTab) => {
    if (nextTab === tab) {
      return;
    }
    window.history.replaceState(null, "", nextTab === "error" ? "/admin/logs?tab=errors" : "/admin/logs");
    setFilterError("");
    setTab(nextTab);
  };

  // 현재 입력 Filter 검증과 첫 Backend Page 조회
  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = tab === "login" ? loginDraft : errorDraft;
    if (draft.from && draft.to && draft.from > draft.to) {
      setFilterError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }
    if (tab === "error" && errorDraft.statusCode) {
      const statusCode = Number(errorDraft.statusCode);
      if (!Number.isInteger(statusCode) || statusCode < 500 || statusCode > 599) {
        setFilterError("HTTP 상태 코드는 500~599 범위로 입력해 주세요.");
        return;
      }
    }

    setFilterError("");
    if (tab === "login") {
      setLoginPage(0);
      setLoginFilters({ ...loginDraft });
    } else {
      setErrorPage(0);
      setErrorFilters({ ...errorDraft });
    }
  };

  const activeData = tab === "login" ? loginData : errorData;
  const activeLoading = tab === "login" ? loginLoading : errorLoading;
  const activeError = tab === "login" ? loginError : errorError;
  const totalPages = activeData ? Math.max(1, Math.ceil(activeData.totalElements / activeData.size)) : 1;

  return (
    <>
      <PageHeader
        title="Logs"
        description="로그인 결과와 5xx 오류를 Trace ID 중심으로 조회합니다."
      />

      <div className={styles.lineTabs} role="tablist" aria-label="로그 유형">
        <button className={tab === "login" ? styles.lineTabActive : undefined} type="button" role="tab" aria-selected={tab === "login"} onClick={() => changeTab("login")}>Login Logs</button>
        <button className={tab === "error" ? styles.lineTabActive : undefined} type="button" role="tab" aria-selected={tab === "error"} onClick={() => changeTab("error")}>Error Logs</button>
      </div>

      <form className={styles.logFilters} onSubmit={applyFilters} noValidate>
        <label className={styles.compactField}>
          <span className="type-small">시작일</span>
          <input className="type-body" type="date" max={tab === "login" ? loginDraft.to || undefined : errorDraft.to || undefined} value={tab === "login" ? loginDraft.from : errorDraft.from} onChange={(event) => tab === "login" ? setLoginDraft({ ...loginDraft, from: event.currentTarget.value }) : setErrorDraft({ ...errorDraft, from: event.currentTarget.value })} />
        </label>
        <label className={styles.compactField}>
          <span className="type-small">종료일</span>
          <input className="type-body" type="date" min={tab === "login" ? loginDraft.from || undefined : errorDraft.from || undefined} value={tab === "login" ? loginDraft.to : errorDraft.to} onChange={(event) => tab === "login" ? setLoginDraft({ ...loginDraft, to: event.currentTarget.value }) : setErrorDraft({ ...errorDraft, to: event.currentTarget.value })} />
        </label>
        {tab === "login" ? (
          <>
            <label className={`${styles.compactField} ${styles.logSearchField}`}>
              <span className="type-small">계정 이메일</span>
              <input className="type-body" type="email" value={loginDraft.email} onChange={(event) => setLoginDraft({ ...loginDraft, email: event.currentTarget.value })} placeholder="email@example.com" />
            </label>
            <label className={styles.compactField}>
              <span className="type-small">결과</span>
              <select className="type-body" value={loginDraft.result} onChange={(event) => setLoginDraft({ ...loginDraft, result: event.currentTarget.value as LoginFilters["result"] })}>
                <option value="">전체</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label className={styles.compactField}>
              <span className="type-small">서비스</span>
              <select className="type-body" value={errorDraft.service} onChange={(event) => setErrorDraft({ ...errorDraft, service: event.currentTarget.value as ErrorFilters["service"] })}>
                <option value="">전체</option>
                <option value="FRONTEND">FRONTEND</option>
                <option value="BACKEND">BACKEND</option>
              </select>
            </label>
            <label className={styles.compactField}>
              <span className="type-small">5xx 상태</span>
              <input className="type-body" type="number" min="500" max="599" value={errorDraft.statusCode} onChange={(event) => setErrorDraft({ ...errorDraft, statusCode: event.currentTarget.value })} placeholder="전체 5xx" />
            </label>
          </>
        )}
        <button className={`${styles.secondaryButton} ${styles.filterSubmit} type-body`} type="submit">
          <Search aria-hidden="true" />
          조회
        </button>
      </form>

      <p className={`${styles.inlineError} type-small`} role="alert" aria-live="polite">{filterError}</p>

      {activeLoading || (!activeData && !activeError) ? (
        <PageLoading rows={5} />
      ) : activeError ? (
        <PageError
          message={activeError}
          onRetry={() => tab === "login"
            ? void loadLoginLogs()
            : void loadErrorLogs()}
        />
      ) : tab === "login" && loginData ? (
        loginData.items.length === 0 ? (
          <EmptyState title="로그인 기록 없음" description="현재 조건에 해당하는 로그인 기록이 없습니다." />
        ) : (
          <LoginLogTable items={loginData.items} />
        )
      ) : errorData ? (
        errorData.items.length === 0 ? (
          <EmptyState title="오류 기록 없음" description="현재 조건에 해당하는 5xx 오류 기록이 없습니다." />
        ) : (
          <ErrorLogTable items={errorData.items} />
        )
      ) : null}

      {activeData && activeData.totalElements > 0 && !activeLoading && !activeError && (
        <nav className={styles.pagination} aria-label="로그 페이지">
          <span className="type-small">전체 {activeData.totalElements.toLocaleString("ko-KR")}건</span>
          <div>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => tab === "login" ? setLoginPage(activeData.page - 1) : setErrorPage(activeData.page - 1)}
              disabled={activeData.page === 0}
              aria-label="이전 페이지"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <strong className="type-small">{activeData.page + 1} / {totalPages}</strong>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => tab === "login" ? setLoginPage(activeData.page + 1) : setErrorPage(activeData.page + 1)}
              disabled={activeData.page + 1 >= totalPages}
              aria-label="다음 페이지"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </>
  );
}

// 로그인 결과별 운영 메타데이터 Row
function LoginLogTable({ items }: { items: LoginLog[] }) {
  return (
    <div className={`${styles.dataTableWrap} ${styles.logTableWrap}`}>
      <table className={`${styles.dataTable} ${styles.logTable}`}>
        <thead>
          <tr><th>시각 / 계정</th><th>결과</th><th>접속 정보</th><th>실패 사유</th><th>Trace ID</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td data-label="시각 / 계정"><time className={styles.techMeta}>{formatDateTime(item.occurredAt)}</time><strong>{item.email}</strong></td>
              <td data-label="결과"><StatusLabel tone={item.result === "SUCCESS" ? "success" : "error"}>{item.result}</StatusLabel></td>
              <td data-label="접속 정보"><span>{item.browser || "-"} · {item.os || "-"}</span><small className={styles.techMeta}>{item.device || "-"} / {item.ip}</small></td>
              <td data-label="실패 사유">{item.failureReason || "-"}</td>
              <td data-label="Trace ID"><code className={styles.traceId}>{item.traceId}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 5xx 오류 요약과 Trace ID 중심 Row
function ErrorLogTable({ items }: { items: ErrorLog[] }) {
  return (
    <div className={`${styles.dataTableWrap} ${styles.logTableWrap}`}>
      <table className={`${styles.dataTable} ${styles.logTable}`}>
        <thead>
          <tr><th>시각 / 서비스</th><th>요청</th><th>상태</th><th>오류 요약</th><th>Trace ID</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td data-label="시각 / 서비스"><time className={styles.techMeta}>{formatDateTime(item.occurredAt)}</time><strong>{item.service}</strong></td>
              <td data-label="요청"><code className={styles.requestMethod}>{item.method || "-"}</code><span className={styles.requestPath}>{item.path || "-"}</span></td>
              <td data-label="상태"><StatusLabel tone="error">{item.statusCode}</StatusLabel>{item.errorCode && <code className={styles.techMeta}>{item.errorCode}</code>}</td>
              <td data-label="오류 요약"><span className={styles.errorSummary}>{item.message}</span></td>
              <td data-label="Trace ID"><code className={styles.traceId}>{item.traceId}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
