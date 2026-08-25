"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ErrorLog, LoginLog } from "./admin-types";
import { EmptyState, PageHeader, StatusLabel, formatDateTime } from "./admin-ui";
import { MOCK_ERROR_LOGS, MOCK_LOGIN_LOGS } from "./mock-data";
import styles from "./admin.module.css";

type LogTab = "login" | "error";

type LoginFilters = {
  from: string;
  to: string;
  email: string;
  result: "" | "SUCCESS" | "FAILURE";
};

type ErrorFilters = {
  from: string;
  to: string;
  service: "" | "FRONTEND" | "BACKEND";
  statusCode: string;
};

const PAGE_SIZE = 50;
const EMPTY_LOGIN_FILTERS: LoginFilters = { from: "", to: "", email: "", result: "" };
const EMPTY_ERROR_FILTERS: ErrorFilters = { from: "", to: "", service: "", statusCode: "" };

function matchesDate(occurredAt: string, from: string, to: string) {
  const occurredDate = occurredAt.slice(0, 10);
  return (!from || occurredDate >= from) && (!to || occurredDate <= to);
}

// Mock 로그인 및 5xx 오류 기록의 로컬 필터·페이지 조회 화면
export default function LogsScreen() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LogTab>(() => searchParams.get("tab") === "errors" ? "error" : "login");
  const [loginDraft, setLoginDraft] = useState<LoginFilters>(EMPTY_LOGIN_FILTERS);
  const [errorDraft, setErrorDraft] = useState<ErrorFilters>(EMPTY_ERROR_FILTERS);
  const [loginFilters, setLoginFilters] = useState<LoginFilters>(EMPTY_LOGIN_FILTERS);
  const [errorFilters, setErrorFilters] = useState<ErrorFilters>(EMPTY_ERROR_FILTERS);
  const [page, setPage] = useState(0);

  const filteredLoginLogs = useMemo(() => {
    const email = loginFilters.email.trim().toLowerCase();
    return MOCK_LOGIN_LOGS.filter((item) => (
      matchesDate(item.occurredAt, loginFilters.from, loginFilters.to)
      && (!email || item.email.toLowerCase().includes(email))
      && (!loginFilters.result || item.result === loginFilters.result)
    ));
  }, [loginFilters]);

  const filteredErrorLogs = useMemo(() => MOCK_ERROR_LOGS.filter((item) => (
    matchesDate(item.occurredAt, errorFilters.from, errorFilters.to)
    && (!errorFilters.service || item.service === errorFilters.service)
    && (!errorFilters.statusCode || item.statusCode === Number(errorFilters.statusCode))
  )), [errorFilters]);

  const loginItems = filteredLoginLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const errorItems = filteredErrorLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalElements = tab === "login" ? filteredLoginLogs.length : filteredErrorLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  // 로그 Domain 전환과 첫 로컬 페이지 선택
  const changeTab = (nextTab: LogTab) => {
    if (nextTab === tab) {
      return;
    }
    window.history.replaceState(null, "", nextTab === "error" ? "/admin/logs?tab=errors" : "/admin/logs");
    setTab(nextTab);
    setPage(0);
  };

  // 현재 입력 Filter의 로컬 조회 조건 반영
  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    if (tab === "login") {
      setLoginFilters({ ...loginDraft });
    } else {
      setErrorFilters({ ...errorDraft });
    }
  };

  // 현재 Filter를 유지한 Pagination 이동
  const movePage = (nextPage: number) => {
    setPage(nextPage);
  };

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

      <form className={styles.logFilters} onSubmit={applyFilters}>
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

      {tab === "login" ? (
        loginItems.length === 0 ? (
          <EmptyState title="로그인 기록 없음" description="현재 조건에 해당하는 로그인 기록이 없습니다." />
        ) : (
          <LoginLogTable items={loginItems} />
        )
      ) : errorItems.length === 0 ? (
        <EmptyState title="오류 기록 없음" description="현재 조건에 해당하는 5xx 오류 기록이 없습니다." />
      ) : (
        <ErrorLogTable items={errorItems} />
      )}

      {totalElements > 0 && (
        <nav className={styles.pagination} aria-label="로그 페이지">
          <span className="type-small">전체 {totalElements.toLocaleString("ko-KR")}건</span>
          <div>
            <button className={styles.iconButton} type="button" onClick={() => movePage(page - 1)} disabled={page === 0} aria-label="이전 페이지"><ChevronLeft aria-hidden="true" /></button>
            <strong className="type-small">{page + 1} / {totalPages}</strong>
            <button className={styles.iconButton} type="button" onClick={() => movePage(page + 1)} disabled={page + 1 >= totalPages} aria-label="다음 페이지"><ChevronRight aria-hidden="true" /></button>
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
              <td data-label="접속 정보"><span>{item.browser} · {item.os}</span><small className={styles.techMeta}>{item.device} / {item.ip}</small></td>
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
              <td data-label="요청"><code className={styles.requestMethod}>{item.method}</code><span className={styles.requestPath}>{item.path}</span></td>
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
