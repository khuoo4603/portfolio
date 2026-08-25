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
import { MOCK_CURRENT_ADMIN, type MockAuthAccount } from "@/features/auth/mock-auth";
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
  account: MockAuthAccount;
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
};

// Desktop Rail과 Mobile Drawer가 공유하는 관리자 Navigation 내용
function Navigation({
  account,
  pathname,
  onNavigate,
  onLogout,
}: NavigationProps) {
  return (
    <div className={styles.navigationInner}>
      <div className={styles.adminIdentity}>
        <span className={styles.identityMark}>KH</span>
        <span className={styles.identityCopy}>
          <strong>KIM HYUNWOO</strong>
          <small>ADMIN</small>
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
          aria-label="로그아웃"
        >
          <LogOut aria-hidden="true" />
          <span>Logout</span>
        </button>
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

// 명시적 Mock 관리자 정보와 Responsive Admin Layout 조합
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

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

  // Mock 관리자 화면 종료와 로그인 화면 복귀
  const handleLogout = () => {
    router.replace("/login");
  };

  const navigationProps = {
    account: MOCK_CURRENT_ADMIN,
    pathname,
    onLogout: handleLogout,
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
        <span>KH / ADMIN</span>
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
