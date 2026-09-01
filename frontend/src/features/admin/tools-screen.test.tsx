import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminChallenge } from "./admin-action-api";
import {
  createToolLink,
  getAdminTools,
  updateToolStatus,
} from "./admin-tool-api";
import ToolsScreen from "./tools-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("./admin-action-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-action-api")>();
  return { ...actual, createAdminChallenge: vi.fn() };
});
vi.mock("./admin-tool-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-tool-api")>();
  return {
    ...actual,
    getAdminTools: vi.fn(),
    updateToolStatus: vi.fn(),
    createToolLink: vi.fn(),
    updateToolLink: vi.fn(),
    deleteToolLink: vi.fn(),
  };
});

const toolsData = {
  tools: [
    { toolKey: "QUIZ", name: "Quiz", enabled: true },
    { toolKey: "LINKS", name: "Links", enabled: false },
  ],
  links: [{
    id: 17,
    name: "Spring Docs",
    description: "Reference",
    url: "https://spring.io",
    imageUrl: "/images/spring.webp",
    category: "REFERENCE" as const,
    displayOrder: 1,
    enabled: true,
  }],
};

function submitOtp() {
  fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
    clipboardData: { getData: () => "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));
}

describe("Admin Tools 실제 API 관리", () => {
  beforeEach(() => {
    vi.mocked(getAdminTools).mockReset().mockResolvedValue(toolsData);
    vi.mocked(createAdminChallenge).mockReset().mockResolvedValue({ challengeId: "challenge-tools", expiresAt: "2099-01-01T00:00:00+09:00" });
    vi.mocked(updateToolStatus).mockReset().mockResolvedValue(toolsData.tools[0]);
    vi.mocked(createToolLink).mockReset().mockResolvedValue(toolsData.links[0]);
  });

  afterEach(cleanup);

  it("실제 Registry와 imageUrl을 표시하고 구형 Category를 노출하지 않음", async () => {
    render(<ToolsScreen />);
    expect(await screen.findByText("QUIZ")).toBeInTheDocument();
    expect(screen.getByText("LINKS")).toBeInTheDocument();
    expect(screen.getByText("/images/spring.webp")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Link 추가" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("option", { name: "REFERENCE" })).toBeInTheDocument();
    expect(within(dialog).getByRole("option", { name: "MY_SERVICES" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("option", { name: "DEVELOPMENT" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("option", { name: "PERSONAL" })).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^대표 이미지 URL/)).toBeInTheDocument();
  });

  it("Tool 상태를 새 Challenge로 PATCH하고 성공 후 재조회", async () => {
    render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("switch", { name: "Quiz Tool 비활성화" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "TOOL_STATUS_UPDATE", targetType: "TOOL", targetId: "QUIZ",
    })));
    submitOtp();
    await waitFor(() => expect(updateToolStatus).toHaveBeenCalledWith("QUIZ", false, {
      challengeId: "challenge-tools", verificationCode: "123456",
    }));
    await waitFor(() => expect(getAdminTools).toHaveBeenCalledTimes(2));
  });

  it("Link 생성에서 imageUrl과 허용 Category를 실제 Mutation에 전달", async () => {
    render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("button", { name: "Link 추가" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("이름"), { target: { value: "My Service" } });
    fireEvent.change(within(dialog).getByLabelText("URL"), { target: { value: "https://service.example.com" } });
    fireEvent.change(within(dialog).getByLabelText(/^대표 이미지 URL/), { target: { value: "/images/service.webp" } });
    fireEvent.change(within(dialog).getByLabelText("분류"), { target: { value: "MY_SERVICES" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(createAdminChallenge).toHaveBeenCalledWith(expect.objectContaining({
      operation: "TOOL_LINK_CREATE", targetType: "TOOL_LINK", targetId: null,
    })));
    submitOtp();
    await waitFor(() => expect(createToolLink).toHaveBeenCalledWith(expect.objectContaining({
      name: "My Service", imageUrl: "/images/service.webp", category: "MY_SERVICES",
    }), { challengeId: "challenge-tools", verificationCode: "123456" }));
  });
});
