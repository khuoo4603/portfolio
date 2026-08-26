import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MOCK_CURRENT_TOOLS_USER,
  MOCK_PASSWORD_OTP,
} from "@/features/auth/mock-auth";
import LinksScreen, { getLinkMeta, groupActiveLinks, LinkCard } from "./links-screen";
import {
  DEFAULT_LINK_IMAGE_URL,
  MOCK_TOOL_LINKS,
  MOCK_TOOLS,
  type ToolItem,
} from "./mock-tools";
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

  it("사용자가 지정한 최종 Link 11개만 두 Category의 이미지 Card Grid로 표시", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    navigation.pathname = "/tools/links";
    render(<ToolsShell><LinksScreen /></ToolsShell>);

    const reference = screen.getByRole("heading", { name: "Reference" }).closest("section");
    const services = screen.getByRole("heading", { name: "My Services" }).closest("section");
    const cards = document.querySelectorAll("[data-link-card]");
    const expectedLinks = [
      ["React Bits", "https://reactbits.dev/", "/images/tools/links/react-bits.webp"],
      ["Aceternity UI", "https://ui.aceternity.com/", "/images/tools/links/aceternity-ui.webp"],
      ["Magic UI", "https://magicui.design/", "/images/tools/links/magic-ui.webp"],
      ["Color Hunt", "https://colorhunt.co/", "/images/tools/links/color-hunt.webp"],
      ["Adobe Color", "https://color.adobe.com/", "/images/tools/links/adobe-color.webp"],
      ["Happy Hues", "https://www.happyhues.co/", "/images/tools/links/happy-hues.webp"],
      ["Realtime Colors", "https://www.realtimecolors.com/", "/images/tools/links/realtime-colors.webp"],
      ["KYvC", "https://kyvc.kr/", "/images/profile/project-intro-kyvc.webp"],
      ["KYvC Intro", "https://intro.kyvc.kr/", DEFAULT_LINK_IMAGE_URL],
      ["SKHUTrack", "https://skhutrack.com/", "/images/profile/project-intro-skhutrack.webp"],
      ["khuoo.synology.me", "https://khuoo.synology.me/", DEFAULT_LINK_IMAGE_URL],
    ] as const;

    expect(reference).not.toBeNull();
    expect(services).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "Development" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Personal" })).not.toBeInTheDocument();
    expect(screen.getByText("11 links")).toBeInTheDocument();
    expect(within(reference as HTMLElement).getByLabelText("7 links")).toHaveTextContent("07");
    expect(within(services as HTMLElement).getByLabelText("4 links")).toHaveTextContent("04");
    expect(document.querySelectorAll("[data-link-grid]")).toHaveLength(2);
    expect(cards).toHaveLength(11);
    expect(document.querySelector("[data-glowing-effect]")).not.toBeInTheDocument();
    expect(within(reference as HTMLElement).getAllByRole("img").map((image) => image.getAttribute("alt"))).toEqual([
      "React Bits",
      "Aceternity UI",
      "Magic UI",
      "Color Hunt",
      "Adobe Color",
      "Happy Hues",
      "Realtime Colors",
    ]);
    expect(within(services as HTMLElement).getAllByRole("img").map((image) => image.getAttribute("alt"))).toEqual([
      "KYvC",
      "KYvC Intro",
      "SKHUTrack",
      "khuoo.synology.me",
    ]);

    expectedLinks.forEach(([name, href, imageUrl]) => {
      const image = screen.getByRole("img", { name });
      const link = image.closest("a");

      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(imageUrl);
    });

    expect(screen.queryByText("Spring Guides")).not.toBeInTheDocument();
    expect(screen.queryByText("MDN Web Docs")).not.toBeInTheDocument();
    expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("대표 이미지 실패와 null Description을 공통 Default Image로 안전하게 처리", async () => {
    const link = { ...MOCK_TOOL_LINKS[0], description: null };
    const metadata = getLinkMeta(link.url);

    expect(metadata).not.toBeNull();
    render(<LinkCard link={link} metadata={metadata!} />);

    const image = screen.getByRole("img", { name: "React Bits" });
    const description = document.querySelector("[data-link-description]");

    expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(link.imageUrl);
    expect(description).toHaveAttribute("aria-hidden", "true");
    expect(description?.textContent).toBe("\u00a0");

    fireEvent.error(image);

    await waitFor(() => {
      expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain(DEFAULT_LINK_IMAGE_URL);
    });
  });

  it("Links Tool 비활성 상태에서 기존 안내 화면을 유지", () => {
    const tools = MOCK_TOOLS as ToolItem[];
    const linksIndex = tools.findIndex((tool) => tool.toolKey === "LINKS");
    const [linksTool] = tools.splice(linksIndex, 1);

    try {
      navigation.pathname = "/tools/links";
      render(<ToolsShell><LinksScreen /></ToolsShell>);

      expect(screen.getByRole("heading", { name: "요청한 Tool을 찾을 수 없습니다" })).toBeInTheDocument();
      expect(document.querySelector("[data-link-card]")).not.toBeInTheDocument();
    } finally {
      tools.splice(linksIndex, 0, linksTool);
    }
  });

  it("비활성·잘못된 URL Link 제외와 안전한 Domain 파싱", () => {
    const reactBits = MOCK_TOOL_LINKS.find((link) => link.name === "React Bits")!;
    const magicUi = MOCK_TOOL_LINKS.find((link) => link.name === "Magic UI")!;
    const kyvc = MOCK_TOOL_LINKS.find((link) => link.name === "KYvC")!;
    const disabled = { ...reactBits, enabled: false };
    const invalid = { ...reactBits, id: 99, url: "invalid-url" };
    const groups = groupActiveLinks([disabled, magicUi, invalid, kyvc]);

    expect(groups.flatMap((group) => group.items.map(({ link }) => link.name))).toEqual([
      "Magic UI",
      "KYvC",
    ]);
    expect(getLinkMeta("https://intro.kyvc.kr/about")).toEqual({
      href: "https://intro.kyvc.kr/about",
      domain: "intro.kyvc.kr",
    });
    expect(getLinkMeta("mailto:hello@example.com")).toBeNull();
    expect(getLinkMeta("invalid-url")).toBeNull();
  });
});
