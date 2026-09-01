import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createToolLink,
  deleteToolLink,
  getAdminTools,
  updateToolLink,
  updateToolLinkEnabled,
  updateToolStatus,
} from "./admin-tool-api";
import ToolsScreen from "./tools-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("./admin-tool-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-tool-api")>();
  return {
    ...actual,
    getAdminTools: vi.fn(),
    updateToolStatus: vi.fn(),
    createToolLink: vi.fn(),
    updateToolLink: vi.fn(),
    updateToolLinkEnabled: vi.fn(),
    deleteToolLink: vi.fn(),
  };
});

const toolsData = {
  tools: [
    { toolKey: "QUIZ", name: "Quiz", enabled: true },
    { toolKey: "LINKS", name: "Links", enabled: false },
  ],
  links: [
    {
      id: 17,
      name: "Spring Docs",
      description: "Reference",
      url: "https://spring.io",
      imageUrl: "/api/v1/tools/media/links/17",
      category: "REFERENCE" as const,
      displayOrder: 1,
      enabled: true,
    },
    {
      id: 18,
      name: "My Service",
      description: null,
      url: "https://service.example.com",
      imageUrl: null,
      category: "MY_SERVICES" as const,
      displayOrder: 2,
      enabled: false,
    },
  ],
};

const createObjectURL = vi.fn<(file: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

function fillRequiredFields(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText("이름"), { target: { value: "New Service" } });
  fireEvent.change(within(dialog).getByLabelText("URL"), { target: { value: "https://new.example.com" } });
}

describe("Admin Tools 실제 API 관리", () => {
  beforeEach(() => {
    vi.mocked(getAdminTools).mockReset().mockResolvedValue(toolsData);
    vi.mocked(updateToolStatus).mockReset().mockResolvedValue(toolsData.tools[0]);
    vi.mocked(createToolLink).mockReset().mockResolvedValue(toolsData.links[0]);
    vi.mocked(updateToolLink).mockReset().mockResolvedValue(toolsData.links[0]);
    vi.mocked(updateToolLinkEnabled).mockReset().mockResolvedValue(toolsData.links[0]);
    vi.mocked(deleteToolLink).mockReset().mockResolvedValue(undefined);
    createObjectURL.mockReset()
      .mockReturnValueOnce("blob:preview-1")
      .mockReturnValueOnce("blob:preview-2")
      .mockReturnValueOnce("blob:preview-3");
    revokeObjectURL.mockReset();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
  });

  afterEach(cleanup);

  it("실제 Registry와 Preview 선택 UI·허용 Category만 표시", async () => {
    render(<ToolsScreen />);
    expect(await screen.findByText("QUIZ")).toBeInTheDocument();
    expect(screen.getByText("LINKS")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/tools/media/links/17")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Link 추가" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("option", { name: "REFERENCE" })).toBeInTheDocument();
    expect(within(dialog).getByRole("option", { name: "MY_SERVICES" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("option", { name: "DEVELOPMENT" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("option", { name: "PERSONAL" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /기본 Preview/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).getByLabelText("이미지 첨부")).toHaveAttribute("type", "file");
    expect(within(dialog).queryByLabelText(/^대표 이미지 URL/)).not.toBeInTheDocument();
  });

  it("Tool 상태를 OTP 없이 enabled JSON 전용 API로 변경", async () => {
    render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("switch", { name: "Quiz Tool 비활성화" }));
    await waitFor(() => expect(updateToolStatus).toHaveBeenCalledWith("QUIZ", { enabled: false }));
    expect(screen.queryByLabelText("관리자 인증번호")).not.toBeInTheDocument();
    await waitFor(() => expect(getAdminTools).toHaveBeenCalledTimes(2));
  });

  it("Link 생성의 DEFAULT Metadata를 OTP 없이 전달", async () => {
    render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("button", { name: "Link 추가" }));
    const dialog = screen.getByRole("dialog");
    fillRequiredFields(dialog);
    fireEvent.change(within(dialog).getByLabelText("분류"), { target: { value: "MY_SERVICES" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(createToolLink).toHaveBeenCalledWith({
      metadata: expect.objectContaining({
        name: "New Service", category: "MY_SERVICES", imageMode: "DEFAULT",
      }),
      image: null,
    }));
    expect(screen.queryByLabelText("관리자 인증번호")).not.toBeInTheDocument();
  });

  it("파일 교체·기본 선택·Dialog 종료·Unmount에서 Object URL을 정리", async () => {
    const view = render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("button", { name: "Link 추가" }));
    let dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText("이미지 첨부");
    const first = new File(["first"], "first.png", { type: "image/png" });
    const second = new File(["second"], "second.webp", { type: "image/webp" });

    fireEvent.change(input, { target: { files: [first] } });
    expect(createObjectURL).toHaveBeenCalledWith(first);
    expect(within(dialog).getByRole("img", { name: "대표 이미지 Preview" })).toHaveAttribute("src", "blob:preview-1");
    fireEvent.change(input, { target: { files: [second] } });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    fireEvent.click(within(dialog).getByRole("button", { name: /기본 Preview/ }));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-2");

    fireEvent.change(input, { target: { files: [first] } });
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-3");

    fireEvent.click(screen.getByRole("button", { name: "Link 추가" }));
    dialog = screen.getByRole("dialog");
    createObjectURL.mockReturnValueOnce("blob:preview-unmount");
    fireEvent.change(within(dialog).getByLabelText("이미지 첨부"), { target: { files: [second] } });
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-unmount");
  });

  it("수정은 KEEP으로 시작하고 기본 선택은 DEFAULT로 전달", async () => {
    render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("button", { name: "Spring Docs Link 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("기존 이미지 유지")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(updateToolLink).toHaveBeenLastCalledWith(17, {
      metadata: expect.objectContaining({ imageMode: "KEEP" }),
      image: null,
    }));

    fireEvent.click(screen.getByRole("button", { name: "Spring Docs Link 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /기본 Preview/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(updateToolLink).toHaveBeenLastCalledWith(17, {
      metadata: expect.objectContaining({ imageMode: "DEFAULT" }),
      image: null,
    }));
  });

  it("Link enabled는 image 없는 KEEP 전용 API로 변경", async () => {
    render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("switch", { name: "Spring Docs Link 비노출 전환" }));
    await waitFor(() => expect(updateToolLinkEnabled).toHaveBeenCalledWith(17, false));
    expect(updateToolLink).not.toHaveBeenCalled();
  });

  it("전체·Reference·My Services를 한 번 조회한 배열에서 필터링", async () => {
    render(<ToolsScreen />);
    await screen.findByText("QUIZ");
    expect(getAdminTools).toHaveBeenCalledOnce();
    expect(screen.getByText("Spring Docs")).toBeInTheDocument();
    expect(screen.getByText("My Service")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reference" }));
    expect(screen.getByText("Spring Docs")).toBeInTheDocument();
    expect(screen.queryByText("My Service")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "My Services" }));
    expect(screen.queryByText("Spring Docs")).not.toBeInTheDocument();
    expect(screen.getByText("My Service")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "전체" }));
    expect(screen.getByText("Spring Docs")).toBeInTheDocument();
    expect(screen.getByText("My Service")).toBeInTheDocument();
    expect(getAdminTools).toHaveBeenCalledOnce();
  });
});
