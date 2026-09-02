import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { logout } from "@/lib/auth/auth-api";
import { useAuthSession } from "@/lib/auth/use-auth-session";
import AdminShell from "./admin-shell";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ replace: navigation.replace }),
}));
vi.mock("@/lib/auth/auth-api", () => ({ logout: vi.fn() }));
vi.mock("@/lib/auth/use-auth-session", () => ({ useAuthSession: vi.fn() }));

const admin = { id: 7, email: "real-admin@example.com", name: "실제 관리자", role: "ADMIN" as const };
const user = { id: 8, email: "real-user@example.com", name: "일반 사용자", role: "USER" as const };

function authState(state: ReturnType<typeof useAuthSession>) {
  vi.mocked(useAuthSession).mockReturnValue(state);
}

describe("Admin Session Gate와 Sidebar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("Session loading 중 관리자 본문을 노출하지 않음", () => {
    authState({ status: "loading", user: null, error: null, refresh: vi.fn(), clear: vi.fn() });

    render(<AdminShell><div>관리 본문</div></AdminShell>);

    expect(screen.getByRole("status", { name: "관리자 Session 확인 중" })).toBeInTheDocument();
    expect(screen.getByText("관리 본문")).not.toBeVisible();
    expect(screen.queryByLabelText("관리자 Sidebar 공간")).not.toBeInTheDocument();
  });

  it("Session loading부터 ADMIN 전환까지 동일 본문을 한 번만 Mount", () => {
    let mountCount = 0;
    const StableChild = () => {
      useEffect(() => {
        mountCount += 1;
      }, []);
      return <div>안정 본문</div>;
    };
    authState({ status: "loading", user: null, error: null, refresh: vi.fn(), clear: vi.fn() });
    const view = render(<AdminShell><StableChild /></AdminShell>);
    const child = screen.getByText("안정 본문");

    expect(child).not.toBeVisible();
    expect(mountCount).toBe(1);

    authState({ status: "authenticated", user: admin, error: null, refresh: vi.fn(), clear: vi.fn() });
    view.rerender(<AdminShell><StableChild /></AdminShell>);

    expect(screen.getByText("안정 본문")).toBe(child);
    expect(child).toBeVisible();
    expect(mountCount).toBe(1);
  });

  it("비로그인 Session은 본문을 숨기고 /login으로 이동", async () => {
    authState({ status: "unauthenticated", user: null, error: null, refresh: vi.fn(), clear: vi.fn() });

    render(<AdminShell><div>관리 본문</div></AdminShell>);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/login"));
    expect(screen.getByText("관리 본문")).not.toBeVisible();
  });

  it("USER Session은 본문을 숨기고 /tools로 이동", async () => {
    authState({ status: "authenticated", user, error: null, refresh: vi.fn(), clear: vi.fn() });

    render(<AdminShell><div>관리 본문</div></AdminShell>);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/tools"));
    expect(screen.getByText("관리 본문")).not.toBeVisible();
  });

  it("ADMIN Session만 본문과 실제 계정 정보를 렌더링", () => {
    authState({ status: "authenticated", user: admin, error: null, refresh: vi.fn(), clear: vi.fn() });

    render(<AdminShell><div>관리 본문</div></AdminShell>);

    const sidebar = screen.getByLabelText("관리자 Sidebar 공간");
    const navigationMenu = within(sidebar).getByRole("navigation", { name: "관리자 메뉴" });
    for (const label of ["Dashboard", "Site", "Projects", "Accounts", "Tools", "Logs"]) {
      expect(within(navigationMenu).getByText(label)).toBeInTheDocument();
    }
    expect(within(sidebar).getAllByText(admin.name).length).toBeGreaterThan(0);
    expect(within(sidebar).getByText(admin.email)).toBeInTheDocument();
    expect(within(sidebar).getByText(admin.role)).toBeInTheDocument();
    expect(screen.getByText("관리 본문")).toBeInTheDocument();
    expect(screen.queryByText("admin@portfolio.local")).not.toBeInTheDocument();
  });

  it("Mobile Drawer에도 동일한 6개 관리자 메뉴를 제공", () => {
    authState({ status: "authenticated", user: admin, error: null, refresh: vi.fn(), clear: vi.fn() });
    render(<AdminShell><div>관리 본문</div></AdminShell>);

    fireEvent.click(screen.getByRole("button", { name: "관리자 메뉴 열기" }));
    const drawer = screen.getByRole("dialog", { name: "모바일 관리자 메뉴" });
    const navigationMenu = within(drawer).getByRole("navigation", { name: "관리자 메뉴" });
    for (const label of ["Dashboard", "Site", "Projects", "Accounts", "Tools", "Logs"]) {
      expect(within(navigationMenu).getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("Logout 성공 시 실제 요청·Session 초기화 후 /login으로 이동하고 중복 요청을 차단", async () => {
    let resolveLogout!: () => void;
    vi.mocked(logout).mockImplementation(() => new Promise<void>((resolve) => { resolveLogout = resolve; }));
    const clear = vi.fn();
    authState({ status: "authenticated", user: admin, error: null, refresh: vi.fn(), clear });
    render(<AdminShell><div>관리 본문</div></AdminShell>);

    const button = within(screen.getByLabelText("관리자 Sidebar 공간")).getByRole("button", { name: "로그아웃" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(logout).toHaveBeenCalledTimes(1);
    resolveLogout();
    await waitFor(() => expect(clear).toHaveBeenCalledTimes(1));
    expect(navigation.replace).toHaveBeenCalledWith("/login");
  });

  it("Logout 실패 시 기존 ErrorResponse와 traceId를 표시", async () => {
    vi.mocked(logout).mockRejectedValue(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE",
      message: "로그아웃을 완료하지 못했습니다.",
      traceId: "trace-logout",
      fieldErrors: [],
    }));
    authState({ status: "authenticated", user: admin, error: null, refresh: vi.fn(), clear: vi.fn() });
    render(<AdminShell><div>관리 본문</div></AdminShell>);

    fireEvent.click(within(screen.getByLabelText("관리자 Sidebar 공간")).getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByText(/로그아웃을 완료하지 못했습니다.*trace-logout/)).toBeInTheDocument();
  });

  it("Logout 401은 만료 Session을 초기화하고 /login으로 이동", async () => {
    vi.mocked(logout).mockRejectedValue(new ApiError(401, {
      code: "AUTH_UNAUTHORIZED",
      message: "로그인이 필요합니다.",
      traceId: "trace-session-expired",
      fieldErrors: [],
    }));
    const clear = vi.fn();
    authState({ status: "authenticated", user: admin, error: null, refresh: vi.fn(), clear });
    render(<AdminShell><div>관리 본문</div></AdminShell>);

    fireEvent.click(within(screen.getByLabelText("관리자 Sidebar 공간")).getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(clear).toHaveBeenCalledTimes(1));
    expect(navigation.replace).toHaveBeenCalledWith("/login");
  });
});
