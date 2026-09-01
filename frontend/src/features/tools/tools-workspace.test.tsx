import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSessionState } from "@/lib/auth/use-auth-session";
import type { CurrentUser, ToolItem, ToolLink } from "@/types/api";
import LinksScreen, { DEFAULT_LINK_IMAGE_URL, getLinkMeta, groupActiveLinks, LinkCard } from "./links-screen";
import ToolsLauncher from "./tools-launcher";
import ToolsShell from "./tools-shell";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(), clear: vi.fn(), getToolLinks: vi.fn(), getTools: vi.fn(),
  issuePasswordChallenge: vi.fn(), logout: vi.fn(), refresh: vi.fn(), useAuthSession: vi.fn(),
}));

const navigation = vi.hoisted(() => {
  const replace = vi.fn();
  return { pathname: "/tools", replace, router: { replace } };
});

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
}));
vi.mock("@/lib/auth/use-auth-session", () => ({ useAuthSession: mocks.useAuthSession }));
vi.mock("@/lib/auth/auth-api", () => ({
  changePassword: mocks.changePassword,
  issuePasswordChallenge: mocks.issuePasswordChallenge,
  logout: mocks.logout,
}));
vi.mock("./tools-api", () => ({ getToolLinks: mocks.getToolLinks, getTools: mocks.getTools }));

const user: CurrentUser = { id: 7, email: "user@example.test", name: "도구 사용자", role: "USER" };
const admin: CurrentUser = { id: 1, email: "admin@example.test", name: "운영 관리자", role: "ADMIN" };
const tools: ToolItem[] = [
  { toolKey: "QUIZ", name: "Quiz" },
  { toolKey: "LINKS", name: "Links" },
];
const links: ToolLink[] = [
  { id: 1, name: "Reference One", description: "첫 번째 자료", url: "https://reference.example/a", imageUrl: "/reference.webp", category: "REFERENCE" },
  { id: 2, name: "My Service", description: null, url: "https://service.example/", imageUrl: null, category: "MY_SERVICES" },
  { id: 3, name: "Reference Two", description: "두 번째 자료", url: "https://reference.example/b", imageUrl: "/second.webp", category: "REFERENCE" },
];

function authenticated(account: CurrentUser = user): AuthSessionState & { clear: typeof mocks.clear; refresh: typeof mocks.refresh } {
  return { status: "authenticated", user: account, error: null, clear: mocks.clear, refresh: mocks.refresh };
}

function openPasswordDialog() {
  fireEvent.click(screen.getByRole("button", { name: user.name }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Profile" })).getByRole("button", { name: "비밀번호 변경" }));
  return screen.getByRole("dialog", { name: "비밀번호 변경" });
}

function fillPassword(dialog: HTMLElement, code: string, password: string, confirmation = password) {
  fireEvent.paste(within(dialog).getByLabelText("인증번호 1번째 숫자"), {
    clipboardData: { getData: () => code },
  });
  fireEvent.change(within(dialog).getByLabelText("새 비밀번호"), { target: { value: password } });
  fireEvent.change(within(dialog).getByLabelText("새 비밀번호 확인"), { target: { value: confirmation } });
}

describe("Tools 실제 연동 Workspace", () => {
  beforeEach(() => {
    navigation.pathname = "/tools";
    navigation.replace.mockReset();
    mocks.clear.mockReset();
    mocks.refresh.mockReset();
    mocks.logout.mockReset().mockResolvedValue(undefined);
    mocks.changePassword.mockReset().mockResolvedValue(undefined);
    mocks.issuePasswordChallenge.mockReset().mockResolvedValue({
      challengeId: "password-challenge-1",
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    });
    mocks.getTools.mockReset().mockResolvedValue({ items: tools });
    mocks.getToolLinks.mockReset().mockResolvedValue({ items: links });
    mocks.useAuthSession.mockReset().mockReturnValue(authenticated());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("/auth/me 사용자와 활성 Tool Registry로 Header·Launcher를 구성", async () => {
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    const launcher = await screen.findByLabelText("Tools Launcher");
    expect(mocks.getTools).toHaveBeenCalledOnce();
    expect(within(launcher).getByRole("link", { name: /Quiz/ })).toHaveAttribute("href", "/tools/quiz");
    expect(within(launcher).getByRole("link", { name: /Links/ })).toHaveAttribute("href", "/tools/links");
    expect(within(launcher).getAllByLabelText("제작 중")).toHaveLength(2);
    expect(screen.getByRole("button", { name: user.name })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Tools 주요 메뉴" })).toHaveTextContent("QuizLinks");
  });

  it.each([user, admin])("$role Session의 실제 Profile을 읽기 전용으로 표시", async (account) => {
    mocks.useAuthSession.mockReturnValue(authenticated(account));
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    fireEvent.click(await screen.findByRole("button", { name: account.name }));
    const profile = screen.getByRole("dialog", { name: "Profile" });
    expect(within(profile).getByText(account.name)).toBeInTheDocument();
    expect(within(profile).getByRole("link", { name: account.email })).toHaveAttribute("href", `mailto:${account.email}`);
    expect(within(profile).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("비인증 Session을 /login으로 보내고 Tool API를 호출하지 않음", async () => {
    mocks.useAuthSession.mockReturnValue({
      status: "unauthenticated", user: null, error: null, clear: mocks.clear, refresh: mocks.refresh,
    });
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.getTools).not.toHaveBeenCalled();
  });

  it("활성 Registry에 없는 Tool을 직접 Route에서도 숨김", async () => {
    mocks.getTools.mockResolvedValue({ items: [tools[0]] });
    navigation.pathname = "/tools/links";
    render(<ToolsShell><LinksScreen /></ToolsShell>);
    expect(await screen.findByRole("heading", { name: "요청한 Tool을 찾을 수 없습니다" })).toBeInTheDocument();
    expect(mocks.getToolLinks).not.toHaveBeenCalled();
  });

  it("실제 Logout 성공 시 공통 Session을 비우고 /login으로 이동", async () => {
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    fireEvent.click(await screen.findByRole("button", { name: user.name }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Profile" })).getByRole("button", { name: "로그아웃" }));
    await waitFor(() => expect(mocks.logout).toHaveBeenCalledOnce());
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(navigation.replace).toHaveBeenCalledWith("/login");
  });

  it("Password Challenge를 발급하고 60초 뒤 같은 API로 재발급", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T00:00:00Z"));
    mocks.issuePasswordChallenge.mockReset()
      .mockResolvedValueOnce({ challengeId: "challenge-1", expiresAt: "2026-08-28T00:05:00Z" })
      .mockResolvedValueOnce({ challengeId: "challenge-2", expiresAt: "2026-08-28T00:06:00Z" });
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    await act(async () => { await Promise.resolve(); });
    const dialog = openPasswordDialog();
    await act(async () => { await Promise.resolve(); });
    expect(within(dialog).getByRole("button", { name: /재전송까지/ })).toBeDisabled();
    expect(mocks.issuePasswordChallenge).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(60_000); });
    fireEvent.click(within(dialog).getByRole("button", { name: "인증번호 재전송" }));
    await act(async () => { await Promise.resolve(); });
    expect(mocks.issuePasswordChallenge).toHaveBeenCalledTimes(2);
    fillPassword(dialog, "123456", "new-password-2");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    await act(async () => { await Promise.resolve(); });
    expect(mocks.changePassword).toHaveBeenCalledWith("challenge-2", "123456", "new-password-2");
  });

  it("비밀번호 변경 성공 시 Challenge ID와 답을 전달하고 Session을 비움", async () => {
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    await screen.findByRole("button", { name: user.name });
    const dialog = openPasswordDialog();
    await waitFor(() => expect(mocks.issuePasswordChallenge).toHaveBeenCalledOnce());
    fillPassword(dialog, "654321", "new-password-1");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith(
      "password-challenge-1", "654321", "new-password-1",
    ));
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(navigation.replace).toHaveBeenCalledWith("/login");
  });

  it("비밀번호 변경 실패 시 Backend Error를 표시하고 Session을 유지", async () => {
    mocks.changePassword.mockRejectedValue(new Error("failure"));
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    await screen.findByRole("button", { name: user.name });
    const dialog = openPasswordDialog();
    await waitFor(() => expect(mocks.issuePasswordChallenge).toHaveBeenCalledOnce());
    fillPassword(dialog, "654321", "new-password-1");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent("요청 처리 중 오류가 발생했습니다."));
    expect(mocks.clear).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("실제 Links 응답을 계약 Category 순서로 표시하고 null·실패 이미지를 Default로 전환", async () => {
    navigation.pathname = "/tools/links";
    render(<ToolsShell><LinksScreen /></ToolsShell>);
    expect(await screen.findByText("3 links")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Reference", "My Services"]);
    expect(screen.getAllByRole("img").map((image) => image.getAttribute("alt"))).toEqual(["Reference One", "Reference Two", "My Service"]);
    const defaultImage = screen.getByRole("img", { name: "My Service" });
    expect(defaultImage.getAttribute("src")?.endsWith(DEFAULT_LINK_IMAGE_URL)).toBe(true);
    const failedImage = screen.getByRole("img", { name: "Reference One" });
    fireEvent.error(failedImage);
    await waitFor(() => expect(failedImage.getAttribute("src")?.endsWith(DEFAULT_LINK_IMAGE_URL)).toBe(true));
  });

  it("잘못된 URL을 제외하고 HTTP(S) Domain만 안전하게 정규화", () => {
    expect(groupActiveLinks([
      ...links,
      { ...links[0], id: 9, url: "mailto:test@example.test" },
      { ...links[0], id: 10, url: "invalid-url" },
    ]).flatMap((group) => group.items.map(({ link }) => link.id))).toEqual([1, 3, 2]);
    expect(getLinkMeta("https://intro.example.test/about")).toEqual({
      href: "https://intro.example.test/about", domain: "intro.example.test",
    });
    expect(getLinkMeta("mailto:test@example.test")).toBeNull();
  });

  it("LinkCard의 null Description을 빈 Editorial Row로 유지", () => {
    const link = links[1];
    render(<LinkCard link={link} metadata={getLinkMeta(link.url)!} />);
    const description = document.querySelector("[data-link-description]");
    expect(description).toHaveAttribute("aria-hidden", "true");
    expect(description?.textContent).toBe("\u00a0");
  });
});
