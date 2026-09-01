"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  PanelTop,
  ScrollText,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/app/theme-toggle";
import { ApiError, formatApiError } from "@/lib/api/client";
import { logout as logoutRequest } from "@/lib/auth/auth-api";
import { useAuthSession } from "@/lib/auth/use-auth-session";
import type { CurrentUser } from "@/types/api";
import styles from "./admin.module.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/site", label: "Site", icon: PanelTop },
  { href: "/admin/accounts", label: "Accounts", icon: Users },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

type NavigationProps = {
  account: CurrentUser;
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
  logoutPending: boolean;
  logoutError: string;
};

// Desktop Rail과 Mobile Drawer가 공유하는 관리자 Navigation 내용
function Navigation({
  account,
  pathname,
  onNavigate,
  onLogout,
  logoutPending,
  logoutError,
}: NavigationProps) {
  return (
    <div className={styles.navigationInner}>
      <div className={styles.adminIdentity}>
        <span className={styles.identityMark}>{account.name.trim().charAt(0).toUpperCase() || "A"}</span>
        <span className={styles.identityCopy}>
          <strong>{account.name}</strong>
          <small>{account.role}</small>
        </span>
      </div>

      <nav className={styles.adminNav} aria-label="관리자 메뉴">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.navigationBottom}>
        <div className={styles.themeControl}>
          <ThemeToggle />
          <span>Theme</span>
        </div>
        <div className={styles.accountSummary}>
          <span className={styles.accountAvatar} aria-hidden="true">
            {account.name.trim().charAt(0) || <UserRound />}
          </span>
          <span className={styles.accountCopy}>
            <strong>{account.name}</strong>
            <small>{account.email}</small>
          </span>
        </div>
        <button
          className={styles.logoutButton}
          type="button"
          onClick={onLogout}
          disabled={logoutPending}
          aria-label="로그아웃"
        >
          <LogOut aria-hidden="true" />
          <span>{logoutPending ? "Logging out" : "Logout"}</span>
        </button>
        <p className={`${styles.inlineError} type-small`} role="alert" aria-live="polite">{logoutError}</p>
      </div>
    </div>
  );
}

// Desktop에 항상 펼쳐진 고정 Sidebar
function DesktopSidebar(props: NavigationProps) {
  return (
    <aside className={styles.desktopRail} aria-label="관리자 Sidebar 공간">
      <div className={styles.desktopSidebar}>
        <Navigation {...props} />
      </div>
    </aside>
  );
}

// 실제 관리자 Session Gate와 Responsive Admin Layout 조합
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const logoutInFlight = useRef(false);

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      router.replace("/login");
    } else if (auth.status === "authenticated" && auth.user.role !== "ADMIN") {
      router.replace("/tools");
    }
  }, [auth.status, auth.user, router]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const fallbackFocus = menuButtonRef.current;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>("nav a[href]")?.focus();
    }, 0);

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      (previousFocus || fallbackFocus)?.focus();
    };
  }, [drawerOpen]);

  // 실제 Logout 요청과 Local Auth Session 초기화
  const handleLogout = async () => {
    if (logoutInFlight.current) {
      return;
    }

    logoutInFlight.current = true;
    setLogoutPending(true);
    setLogoutError("");
    try {
      await logoutRequest();
      auth.clear();
      router.replace("/login");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        auth.clear();
        router.replace("/login");
      } else {
        setLogoutError(formatApiError(error));
      }
    } finally {
      logoutInFlight.current = false;
      setLogoutPending(false);
    }
  };

  if (auth.status === "loading"
      || auth.status === "unauthenticated"
      || (auth.status === "authenticated" && auth.user.role !== "ADMIN")) {
    return (
      <main className={styles.shellGate} aria-busy="true">
        <span className={styles.gateMark}>KH / ADMIN</span>
        <div className={styles.gateLoading} role="status" aria-label="관리자 Session 확인 중">
          <span aria-hidden="true" />
          <p className="type-body">Session 확인 중</p>
        </div>
      </main>
    );
  }

  if (auth.status === "error") {
    return (
      <main className={styles.shellGate}>
        <span className={styles.gateMark}>KH / ADMIN</span>
        <div className={styles.gateError} role="alert">
          <h1 className="type-title">Session을 확인하지 못했습니다</h1>
          <p className="type-body">{formatApiError(auth.error)}</p>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => void auth.refresh()}>
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  const navigationProps = {
    account: auth.user,
    pathname,
    onLogout: () => void handleLogout(),
    logoutPending,
    logoutError,
  };

  return (
    <div className={styles.adminLayout}>
      <DesktopSidebar {...navigationProps} />

      <header className={styles.mobileHeader}>
        <button
          className={styles.mobileMenuButton}
          ref={menuButtonRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="관리자 메뉴 열기"
          aria-expanded={drawerOpen}
          aria-controls="admin-mobile-drawer"
        >
          <Menu aria-hidden="true" />
        </button>
        <span>{auth.user.name} / {auth.user.role}</span>
        <ThemeToggle />
      </header>

      {drawerOpen && (
        <div className={styles.drawerBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setDrawerOpen(false);
          }
        }}>
          <aside ref={drawerRef} id="admin-mobile-drawer" className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="모바일 관리자 메뉴">
            <button className={styles.drawerClose} type="button" onClick={() => setDrawerOpen(false)} aria-label="관리자 메뉴 닫기">
              <X aria-hidden="true" />
            </button>
            <Navigation {...navigationProps} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className={styles.adminMain}>
        <div className={styles.adminContent}>{children}</div>
      </main>
    </div>
  );
}
