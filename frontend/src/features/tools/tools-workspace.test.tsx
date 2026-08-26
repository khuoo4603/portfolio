import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MOCK_CURRENT_TOOLS_USER,
  MOCK_PASSWORD_OTP,
} from "@/features/auth/mock-auth";
import LinksScreen from "./links-screen";
import ToolsLauncher from "./tools-launcher";
import ToolsShell from "./tools-shell";

const navigation = vi.hoisted(() => {
  const replace = vi.fn();
  return { pathname: "/tools", replace, router: { replace } };
});

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
}));

function openPasswordDialog() {
  fireEvent.click(screen.getByRole("button", { name: MOCK_CURRENT_TOOLS_USER.name }));
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

describe("Tools Mock Workspace", () => {
  beforeEach(() => {
    navigation.pathname = "/tools";
    navigation.replace.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("공유 Header와 활성 Tool 2개·제작 중 Cell 2개를 즉시 표시", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);

    const launcher = screen.getByLabelText("Tools Launcher");
    const quizCard = within(launcher).getByRole("link", { name: /Quiz/ });
    const linksCard = within(launcher).getByRole("link", { name: /Links/ });
    const comingCards = within(launcher).getAllByLabelText("제작 중");
    const primaryNavigation = screen.getByRole("navigation", { name: "Tools 주요 메뉴" });
    const headerUtilities = screen.getByRole("group", { name: "Header 유틸리티" });
    const themeToggle = within(headerUtilities).getByRole("button", { name: "색상 테마 전환" });
    const profileBadge = within(headerUtilities).getByRole("button", { name: MOCK_CURRENT_TOOLS_USER.name });
    expect(screen.getByRole("link", { name: "Tools 홈" })).toHaveTextContent("Tools");
    expect(screen.getByRole("heading", { level: 1, name: "Quick Menu" })).toBeInTheDocument();
    expect(primaryNavigation).toBeInTheDocument();
    expect(within(primaryNavigation).queryByRole("button", { name: "프로필" })).not.toBeInTheDocument();
    expect(within(primaryNavigation).queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
    expect(themeToggle.nextElementSibling).toBe(profileBadge);
    expect(within(headerUtilities).queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
    expect(quizCard).toHaveAttribute("href", "/tools/quiz");
    expect(linksCard).toHaveAttribute("href", "/tools/links");
    expect(comingCards).toHaveLength(2);
    expect(quizCard.querySelector('[data-card-preview="quiz"][aria-hidden="true"]')).not.toBeNull();
    expect(linksCard.querySelector('[data-card-preview="links"][aria-hidden="true"]')).not.toBeNull();
    expect(linksCard.querySelectorAll("[data-beam-node]")).toHaveLength(7);
    expect(linksCard.querySelectorAll("[data-beam-path]")).toHaveLength(6);
    expect(linksCard.querySelectorAll("[data-beam-source]")).toHaveLength(1);
    expect(linksCard.querySelectorAll("[data-beam-hub]")).toHaveLength(1);
    expect(linksCard.querySelectorAll("[data-beam-output]")).toHaveLength(5);
    expect(within(linksCard).queryByText(/Reference|My Services|Personal|Development/)).not.toBeInTheDocument();
    expect(comingCards[0].querySelector('[data-card-preview="ripple"][data-ripple-variant="wide"]')).not.toBeNull();
    expect(comingCards[1].querySelector('[data-card-preview="ripple"][data-ripple-variant="compact"]')).not.toBeNull();
    expect(comingCards[0].querySelectorAll("[data-ripple-circle]")).toHaveLength(8);
    expect(comingCards[1].querySelectorAll("[data-ripple-circle]")).toHaveLength(8);
    expect(launcher.querySelector('[data-card-preview="orbit"]')).not.toBeInTheDocument();
    expect(within(launcher).queryByText(/Notes|Calendar|Files|Terminal|Monitoring|Tasks|Bookmarks|Snippets/)).not.toBeInTheDocument();
    expect(Array.from(launcher.querySelectorAll("h2"), (heading) => heading.textContent)).toEqual([
      "Quiz",
      "Links",
      "제작 중",
      "제작 중",
    ]);
    expect(within(quizCard).getByText(/자세히 보기/)).toBeInTheDocument();
    expect(within(linksCard).getByText(/자세히 보기/)).toBeInTheDocument();
    expect(quizCard.querySelector("svg")).not.toBeNull();
    expect(linksCard.querySelector("svg")).not.toBeNull();
    expect(comingCards.every((card) => card.querySelector("svg"))).toBe(true);
    expect(launcher.querySelector(".lucide-arrow-up-right")).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Profile에 기존 Mock 사용자 이름·읽기 전용 이메일만 표시", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);

    fireEvent.click(screen.getByRole("button", { name: MOCK_CURRENT_TOOLS_USER.name }));
    const profile = screen.getByRole("dialog", { name: "Profile" });

    expect(within(profile).getByText(MOCK_CURRENT_TOOLS_USER.name)).toBeInTheDocument();
    expect(within(profile).getByRole("link", { name: MOCK_CURRENT_TOOLS_USER.email })).toHaveAttribute(
      "href",
      `mailto:${MOCK_CURRENT_TOOLS_USER.email}`,
    );
    expect(within(profile).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(profile).queryByText("Role")).not.toBeInTheDocument();

    fireEvent.mouseDown(profile.parentElement as HTMLElement);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Profile" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: MOCK_CURRENT_TOOLS_USER.name }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Profile" })).getByRole("button", { name: "대화상자 닫기" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Profile" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: MOCK_CURRENT_TOOLS_USER.name }));
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Profile" })).not.toBeInTheDocument());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("로그아웃을 Network 요청 없이 로그인 화면으로 연결", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);

    fireEvent.click(screen.getByRole("button", { name: MOCK_CURRENT_TOOLS_USER.name }));
    const profile = screen.getByRole("dialog", { name: "Profile" });
    fireEvent.click(within(profile).getByRole("button", { name: "로그아웃" }));

    expect(navigation.replace).toHaveBeenCalledWith("/login");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Password Change Dialog에서 잘못된 Mock OTP와 비밀번호 정책을 검증", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    const dialog = openPasswordDialog();

    expect(within(dialog).getByText(MOCK_CURRENT_TOOLS_USER.email)).toBeInTheDocument();
    fillPassword(dialog, "654321", "simplepass");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    expect(within(dialog).getByText("인증번호를 확인해 주세요.")).toBeInTheDocument();

    fillPassword(dialog, MOCK_PASSWORD_OTP, "short");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    expect(within(dialog).getByText("새 비밀번호는 8자 이상 64자 이하로 입력해 주세요.")).toBeInTheDocument();

    fillPassword(dialog, MOCK_PASSWORD_OTP, " simplepass");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    expect(within(dialog).getByText("새 비밀번호의 앞뒤에는 공백을 사용할 수 없습니다.")).toBeInTheDocument();

    fillPassword(dialog, MOCK_PASSWORD_OTP, MOCK_CURRENT_TOOLS_USER.email);
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    expect(within(dialog).getByText("이메일과 동일한 비밀번호는 사용할 수 없습니다.")).toBeInTheDocument();

    fillPassword(dialog, MOCK_PASSWORD_OTP, "simplepass", "differentpass");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));
    expect(within(dialog).getByText("새 비밀번호 확인이 일치하지 않습니다.")).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Mock OTP 성공을 저장 없이 로그인 화면으로 연결", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ToolsShell><ToolsLauncher /></ToolsShell>);
    const dialog = openPasswordDialog();

    fillPassword(dialog, MOCK_PASSWORD_OTP, "simplepass");
    fireEvent.click(within(dialog).getByRole("button", { name: "비밀번호 변경" }));

    expect(navigation.replace).toHaveBeenCalledWith("/login");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("활성 Mock Link를 Category 행으로 표시하고 빈 Category를 만들지 않음", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    navigation.pathname = "/tools/links";
    render(<ToolsShell><LinksScreen /></ToolsShell>);

    expect(screen.getByRole("heading", { name: "Reference" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Development" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personal" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "My Services" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Spring Guides/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("spring.io")).toBeInTheDocument();
    expect(screen.getByText("developer.mozilla.org")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
