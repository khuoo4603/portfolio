import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccountsScreen from "./accounts-screen";
import { PageHeader } from "./admin-ui";
import LogsScreen from "./logs-screen";
import ToolsScreen from "./tools-screen";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("./admin-read-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-read-api")>();
  return {
    ...actual,
    getLoginLogs: vi
      .fn()
      .mockResolvedValue({ items: [], page: 0, size: 50, totalElements: 0 }),
    getErrorLogs: vi
      .fn()
      .mockResolvedValue({ items: [], page: 0, size: 50, totalElements: 0 }),
  };
});

vi.mock("./admin-account-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-account-api")>();
  return {
    ...actual,
    getAdminAccounts: vi.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          email: "admin@example.com",
          name: "관리자",
          role: "ADMIN",
          enabled: true,
          recentLoginAt: null,
        },
      ],
    }),
  };
});

vi.mock("./admin-tool-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-tool-api")>();
  return {
    ...actual,
    getAdminTools: vi.fn().mockResolvedValue({
      tools: [{ toolKey: "QUIZ", name: "Quiz", enabled: true }],
      links: [],
    }),
  };
});

describe("Admin Page Header와 주요 화면", () => {
  afterEach(() => cleanup());

  it("Eyebrow 없는 제목·설명·Action 계약을 사용", () => {
    type HasEyebrow = "eyebrow" extends keyof React.ComponentProps<
      typeof PageHeader
    >
      ? true
      : false;
    const hasEyebrow: HasEyebrow = false;

    render(
      <PageHeader
        title="관리 제목"
        description="관리 설명"
        action={<button type="button">관리 작업</button>}
      />,
    );

    expect(hasEyebrow).toBe(false);
    expect(
      screen.getByRole("heading", { level: 1, name: "관리 제목" }),
    ).toBeInTheDocument();
    expect(screen.getByText("관리 설명")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "관리 작업" }),
    ).toBeInTheDocument();
  });

  it("Accounts 제목·설명과 관리 목록을 유지", async () => {
    render(<AccountsScreen />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Accounts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "관리자와 Tools 사용 계정의 권한, 활성 상태와 최근 로그인을 관리합니다.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "계정 생성" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "계정 목록" })).not.toBeInTheDocument();
    expect(screen.queryByText("권한과 활성 상태, 최근 로그인을 확인합니다.")).not.toBeInTheDocument();
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("Tools 제목·설명과 두 운영 영역을 유지", async () => {
    render(<ToolsScreen />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tools" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "코드에 등록된 Tool의 공개 상태와 Links 공통 데이터를 관리합니다.",
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Tool 상태" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Links 데이터" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("등록된 Tool의 공개 상태를 빠르게 확인하고 전환합니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("Links Tool에 노출할 공통 링크 데이터를 관리합니다.")).not.toBeInTheDocument();
  });

  it("Logs 제목·설명과 통합 관리 Surface의 로그인·오류 탭을 유지", () => {
    render(<LogsScreen />);

    expect(screen.getByRole("region", { name: "로그 관리" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Logs" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "운영 로그" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "로그인 결과와 5xx 오류를 Trace ID 중심으로 조회합니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Login Logs" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Error Logs" })).toBeInTheDocument();
  });
});
