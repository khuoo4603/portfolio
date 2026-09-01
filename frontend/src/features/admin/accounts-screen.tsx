"use client";

import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AccountInput, AccountItem, AccountRole } from "./admin-types";
import LocalActionDialog from "./local-action-dialog";
import DialogFrame from "./dialog-frame";
import {
  EmptyState,
  PageHeader,
  StatusLabel,
  SubmitButton,
  formatDateTime,
} from "./admin-ui";
import { MOCK_ACCOUNTS } from "./mock-data";
import styles from "./admin.module.css";

type PendingAction = {
  label: string;
  run: () => void;
};

// Mock 계정 화면 Field만 사용하는 계정 생성 Form
function AccountCreateDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
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

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
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

    onSubmit({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password,
      role,
      enabled,
    });
  };

  return (
    <DialogFrame
      open={open}
      title="계정 생성"
      description="회원가입 없이 관리자만 새 계정을 등록할 수 있습니다."
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="submit" onClick={() => (document.getElementById("account-create-form") as HTMLFormElement | null)?.requestSubmit()}>
            로컬 생성
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

// 관리자 초기화 정책에 맞는 새 비밀번호 입력 Form
function PasswordDialog({
  account,
  onClose,
  onSubmit,
}: {
  account: AccountItem | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8 || password.length > 64 || password.trim() !== password) {
      setError("비밀번호는 앞뒤 공백 없이 8~64자로 입력해 주세요.");
      return;
    }

    onSubmit();
  };

  return (
    <DialogFrame
      open={account !== null}
      title="비밀번호 초기화"
      description={account ? `${account.email} 계정의 새 비밀번호를 설정합니다.` : undefined}
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="submit" onClick={() => (document.getElementById("password-reset-form") as HTMLFormElement | null)?.requestSubmit()}>
            로컬 초기화
          </SubmitButton>
        </>
      )}
    >
      <form id="password-reset-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <label className={styles.formField}>
          <span className="type-small">새 비밀번호</span>
          <input className="type-body" type="password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} autoComplete="new-password" />
        </label>
        <p className={`${styles.fieldHint} type-small`}>8~64자 형식만 확인하며 Mock 화면에 값을 저장하지 않음</p>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

// 검색·운영 Action의 로컬 미리보기를 포함한 Mock 계정 관리 화면
export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountItem[]>(MOCK_ACCOUNTS);
  const [filters, setFilters] = useState({ keyword: "", role: "", enabled: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordAccount, setPasswordAccount] = useState<AccountItem | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState("");

  const filteredAccounts = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesKeyword = !keyword
        || account.email.toLowerCase().includes(keyword)
        || account.name.toLowerCase().includes(keyword);
      const matchesRole = !appliedFilters.role || account.role === appliedFilters.role;
      const matchesStatus = appliedFilters.enabled === ""
        || account.enabled === (appliedFilters.enabled === "true");
      return matchesKeyword && matchesRole && matchesStatus;
    });
  }, [accounts, appliedFilters]);

  // 현재 입력 Filter의 로컬 목록 반영
  const handleFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  };

  // Mock 계정 로컬 생성 대기열
  const queueCreate = (input: AccountInput) => {
    const { email, name, role, enabled } = input;
    setCreateOpen(false);
    setPending({
      label: `${email} 계정 생성`,
      run: () => setAccounts((current) => [
        ...current,
        {
          id: current.reduce((largest, item) => Math.max(largest, item.id), 0) + 1,
          email,
          name,
          role,
          enabled,
          recentLoginAt: null,
        },
      ]),
    });
  };

  // Mock 계정 활성 상태의 로컬 변경 대기열
  const queueStatus = (account: AccountItem) => {
    setMenuId(null);
    setPending({
      label: `${account.email} 계정 ${account.enabled ? "비활성화" : "활성화"}`,
      run: () => setAccounts((current) => current.map((item) => (
        item.id === account.id ? { ...item, enabled: !item.enabled } : item
      ))),
    });
  };

  // Mock 계정 권한의 로컬 변경 대기열
  const queueRole = (account: AccountItem) => {
    const nextRole: AccountRole = account.role === "ADMIN" ? "USER" : "ADMIN";
    setMenuId(null);
    setPending({
      label: `${account.email} 권한을 ${nextRole}로 변경`,
      run: () => setAccounts((current) => current.map((item) => (
        item.id === account.id ? { ...item, role: nextRole } : item
      ))),
    });
  };

  // 비밀번호 미저장 Mock 초기화 성공 처리 대기열
  const queuePassword = () => {
    if (!passwordAccount) {
      return;
    }

    const account = passwordAccount;
    setPasswordAccount(null);
    setPending({
      label: `${account.email} 비밀번호 초기화`,
      run: () => undefined,
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
            <input
              className="type-body"
              type="search"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.currentTarget.value }))}
              placeholder="이메일 또는 이름"
            />
          </div>
        </label>
        <label>
          <span className="type-small">권한</span>
          <select className="type-body" value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.currentTarget.value }))}>
            <option value="">전체</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
        </label>
        <label>
          <span className="type-small">활성 상태</span>
          <select className="type-body" value={filters.enabled} onChange={(event) => setFilters((current) => ({ ...current, enabled: event.currentTarget.value }))}>
            <option value="">전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </label>
        <button className={`${styles.secondaryButton} type-body`} type="submit">조회</button>
      </form>

      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}

      {filteredAccounts.length === 0 ? (
        <EmptyState title="계정 없음" description="현재 조건에 해당하는 계정이 없습니다." />
      ) : (
        <div className={styles.dataTableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>계정</th>
                <th>이름</th>
                <th>권한</th>
                <th>상태</th>
                <th>최근 로그인</th>
                <th><span className={styles.srOnly}>작업</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td data-label="계정"><strong>{account.email}</strong></td>
                  <td data-label="이름">{account.name}</td>
                  <td data-label="권한"><span className={styles.roleBadge}>{account.role}</span></td>
                  <td data-label="상태">
                    <StatusLabel tone={account.enabled ? "success" : "neutral"}>{account.enabled ? "활성" : "비활성"}</StatusLabel>
                  </td>
                  <td data-label="최근 로그인"><time>{formatDateTime(account.recentLoginAt)}</time></td>
                  <td className={styles.actionCell}>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => setMenuId((current) => current === account.id ? null : account.id)}
                      aria-label={`${account.email} 계정 작업`}
                      aria-expanded={menuId === account.id}
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </button>
                    {menuId === account.id && (
                      <div className={styles.rowMenu}>
                        <button type="button" onClick={() => queueStatus(account)}>{account.enabled ? "비활성화" : "활성화"}</button>
                        <button type="button" onClick={() => queueRole(account)}>{account.role === "ADMIN" ? "USER로 변경" : "ADMIN으로 변경"}</button>
                        <button type="button" onClick={() => { setMenuId(null); setPasswordAccount(account); }}>비밀번호 초기화</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AccountCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={queueCreate} />
      <PasswordDialog account={passwordAccount} onClose={() => setPasswordAccount(null)} onSubmit={queuePassword} />
      {pending && (
        <LocalActionDialog
          key={pending.label}
          open
          actionLabel={pending.label}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            pending.run();
            setPending(null);
            setFeedback("계정 변경을 반영했습니다.");
          }}
        />
      )}
    </>
  );
}
