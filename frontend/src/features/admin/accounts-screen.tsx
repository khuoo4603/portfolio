"use client";

import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type { AccountInput, AccountItem, AccountRole } from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import {
  accountActionBindings,
  createAccount,
  getAdminAccounts,
  resetAccountPassword,
  updateAccountRole,
  updateAccountStatus,
  type AccountQuery,
} from "./admin-account-api";
import DialogFrame from "./dialog-frame";
import {
  EmptyState,
  PageError,
  PageHeader,
  PageLoading,
  StatusLabel,
  SubmitButton,
  formatDateTime,
} from "./admin-ui";
import { useAdminAction } from "./use-admin-action";
import styles from "./admin.module.css";

type AccountFilters = {
  keyword: string;
  role: "" | AccountRole;
  enabled: "" | "true" | "false";
};

const EMPTY_FILTERS: AccountFilters = { keyword: "", role: "", enabled: "" };

function AccountCreateDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: AccountInput) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("USER");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("이메일 형식을 확인해 주세요.");
      return;
    }
    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (password.length < 8 || password.length > 64 || password.trim() !== password) {
      setError("비밀번호는 앞뒤 공백 없이 8~64자로 입력해 주세요.");
      return;
    }
    if (password.toLowerCase() === normalizedEmail) {
      setError("비밀번호는 이메일과 같을 수 없습니다.");
      return;
    }

    onSubmit({ email: normalizedEmail, name: name.trim(), password, role, enabled });
  };

  return (
    <DialogFrame
      open
      title="계정 생성"
      description="회원가입 없이 관리자만 새 계정을 등록할 수 있습니다."
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("account-create-form") as HTMLFormElement | null)?.requestSubmit()}>
            계정 생성
          </SubmitButton>
        </>
      )}
    >
      <form id="account-create-form" className={styles.editorForm} onSubmit={handleSubmit} noValidate>
        <label className={styles.formField}>
          <span className="type-small">이메일</span>
          <input className="type-body" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} autoComplete="off" />
        </label>
        <label className={styles.formField}>
          <span className="type-small">이름</span>
          <input className="type-body" type="text" value={name} onChange={(event) => setName(event.currentTarget.value)} autoComplete="off" />
        </label>
        <label className={styles.formField}>
          <span className="type-small">초기 비밀번호</span>
          <input className="type-body" type="password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} autoComplete="new-password" />
        </label>
        <div className={styles.formColumns}>
          <label className={styles.formField}>
            <span className="type-small">권한</span>
            <select className="type-body" value={role} onChange={(event) => setRole(event.currentTarget.value as AccountRole)}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <label className={styles.checkboxField}>
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} />
            <span className="type-body">활성 계정</span>
          </label>
        </div>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

function PasswordDialog({
  account,
  onClose,
  onSubmit,
}: {
  account: AccountItem;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8 || password.length > 64 || password.trim() !== password) {
      setError("비밀번호는 앞뒤 공백 없이 8~64자로 입력해 주세요.");
      return;
    }
    if (password.toLowerCase() === account.email.toLowerCase()) {
      setError("비밀번호는 이메일과 같을 수 없습니다.");
      return;
    }
    onSubmit(password);
  };

  return (
    <DialogFrame
      open
      title="비밀번호 초기화"
      description={`${account.email} 계정의 새 비밀번호를 설정합니다.`}
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("password-reset-form") as HTMLFormElement | null)?.requestSubmit()}>
            비밀번호 초기화
          </SubmitButton>
        </>
      )}
    >
      <form id="password-reset-form" className={styles.editorForm} onSubmit={handleSubmit} noValidate>
        <label className={styles.formField}>
          <span className="type-small">새 비밀번호</span>
          <input className="type-body" type="password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} autoComplete="new-password" />
        </label>
        <p className={`${styles.fieldHint} type-small`}>앞뒤 공백 없는 8~64자이며 이메일과 다르게 입력합니다.</p>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

// Backend Filter와 작업별 ADMIN_ACTION을 사용하는 계정 관리 화면
export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountItem[] | null>(null);
  const [filters, setFilters] = useState<AccountFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AccountFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordAccount, setPasswordAccount] = useState<AccountItem | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const requestSequence = useRef(0);
  const adminAction = useAdminAction();

  const loadAccounts = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    const query: AccountQuery = {
      keyword: appliedFilters.keyword.trim() || undefined,
      role: appliedFilters.role || undefined,
      enabled: appliedFilters.enabled === "" ? undefined : appliedFilters.enabled === "true",
    };
    try {
      const response = await getAdminAccounts(query);
      if (requestSequence.current === requestId) {
        setAccounts(response.items);
      }
    } catch (caught) {
      if (requestSequence.current === requestId) {
        setAccounts(null);
        setError(formatApiError(caught));
      }
    } finally {
      if (requestSequence.current === requestId) {
        setLoading(false);
      }
    }
  }, [appliedFilters]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadAccounts();
      }
    });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [loadAccounts]);

  const handleFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const completeMutation = (message: string) => {
    setFeedback(message);
    setMenuId(null);
    void loadAccounts();
  };

  const queueCreate = (input: AccountInput) => {
    setCreateOpen(false);
    void adminAction.start({
      ...accountActionBindings.create(),
      actionLabel: `${input.email} 계정 생성`,
      mutation: (verification) => createAccount(input, verification),
      onSuccess: () => completeMutation("계정을 생성했습니다."),
    });
  };

  const queueStatus = (account: AccountItem) => {
    setMenuId(null);
    void adminAction.start({
      ...accountActionBindings.status(account.id),
      actionLabel: `${account.email} 계정 ${account.enabled ? "비활성화" : "활성화"}`,
      mutation: (verification) => updateAccountStatus(account.id, !account.enabled, verification),
      onSuccess: () => completeMutation("계정 활성 상태를 변경했습니다."),
    });
  };

  const queueRole = (account: AccountItem) => {
    const nextRole: AccountRole = account.role === "ADMIN" ? "USER" : "ADMIN";
    setMenuId(null);
    void adminAction.start({
      ...accountActionBindings.role(account.id),
      actionLabel: `${account.email} 권한을 ${nextRole}로 변경`,
      mutation: (verification) => updateAccountRole(account.id, nextRole, verification),
      onSuccess: () => completeMutation("계정 권한을 변경했습니다."),
    });
  };

  const queuePassword = (newPassword: string) => {
    if (!passwordAccount) {
      return;
    }
    const account = passwordAccount;
    setPasswordAccount(null);
    void adminAction.start({
      ...accountActionBindings.password(account.id),
      actionLabel: `${account.email} 비밀번호 초기화`,
      mutation: (verification) => resetAccountPassword(account.id, newPassword, verification),
      onSuccess: () => completeMutation("계정 비밀번호를 초기화했습니다."),
    });
  };

  return (
    <>
      <PageHeader
        title="Accounts"
        description="관리자와 Tools 사용 계정의 권한, 활성 상태와 최근 로그인을 관리합니다."
        action={(
          <button className={`${styles.primaryButton} type-body`} type="button" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            계정 생성
          </button>
        )}
      />

      <form className={styles.filterBar} onSubmit={handleFilter}>
        <label>
          <span className="type-small">계정 검색</span>
          <div className={styles.searchField}>
            <Search aria-hidden="true" />
            <input className="type-body" type="search" value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.currentTarget.value })} placeholder="이메일 또는 이름" />
          </div>
        </label>
        <label>
          <span className="type-small">권한</span>
          <select className="type-body" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.currentTarget.value as AccountFilters["role"] })}>
            <option value="">전체</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
        </label>
        <label>
          <span className="type-small">활성 상태</span>
          <select className="type-body" value={filters.enabled} onChange={(event) => setFilters({ ...filters, enabled: event.currentTarget.value as AccountFilters["enabled"] })}>
            <option value="">전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </label>
        <button className={`${styles.secondaryButton} type-body`} type="submit">조회</button>
      </form>

      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}
      {adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}

      {loading ? (
        <PageLoading rows={5} />
      ) : error ? (
        <PageError message={error} onRetry={() => void loadAccounts()} />
      ) : accounts?.length === 0 ? (
        <EmptyState title="계정 없음" description="현재 조건에 해당하는 계정이 없습니다." />
      ) : accounts ? (
        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead><tr><th>계정</th><th>이름</th><th>권한</th><th>상태</th><th>최근 로그인</th><th><span className={styles.srOnly}>작업</span></th></tr></thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td data-label="계정"><strong>{account.email}</strong></td>
                  <td data-label="이름">{account.name}</td>
                  <td data-label="권한"><span className={styles.roleBadge}>{account.role}</span></td>
                  <td data-label="상태"><StatusLabel tone={account.enabled ? "success" : "neutral"}>{account.enabled ? "활성" : "비활성"}</StatusLabel></td>
                  <td data-label="최근 로그인"><time>{formatDateTime(account.recentLoginAt)}</time></td>
                  <td className={styles.actionCell}>
                    <button className={styles.iconButton} type="button" onClick={() => setMenuId((current) => current === account.id ? null : account.id)} aria-label={`${account.email} 계정 작업`} aria-expanded={menuId === account.id}><MoreHorizontal aria-hidden="true" /></button>
                    {menuId === account.id && <div className={styles.rowMenu}><button type="button" onClick={() => queueStatus(account)}>{account.enabled ? "비활성화" : "활성화"}</button><button type="button" onClick={() => queueRole(account)}>{account.role === "ADMIN" ? "USER로 변경" : "ADMIN으로 변경"}</button><button type="button" onClick={() => { setMenuId(null); setPasswordAccount(account); }}>비밀번호 초기화</button></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {createOpen && <AccountCreateDialog onClose={() => setCreateOpen(false)} onSubmit={queueCreate} />}
      {passwordAccount && <PasswordDialog account={passwordAccount} onClose={() => setPasswordAccount(null)} onSubmit={queuePassword} />}
      {adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}
    </>
  );
}
