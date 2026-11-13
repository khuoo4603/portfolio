import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { NotificationProvider } from "@/components/ui/notification/notification-provider";
import {
  createToolLink,
  deleteToolLink,
  getAdminTools,
  reorderToolLinks,
  updateToolLink,
  updateToolLinkEnabled,
  updateToolStatus,
} from "./admin-tool-api";
import ToolsScreen from "./tools-screen";

function selectOption(label: string, option: string) {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

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
    reorderToolLinks: vi.fn(),
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

const groupedToolsData = {
  ...toolsData,
  links: [
    { ...toolsData.links[0], id: 17, name: "React Bits", displayOrder: 1 },
    { ...toolsData.links[1], id: 18, name: "KVyC", displayOrder: 2 },
    { ...toolsData.links[0], id: 19, name: "Aceternity UI", displayOrder: 3 },
    { ...toolsData.links[1], id: 20, name: "SKHUTrack", displayOrder: 4 },
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
    vi.mocked(reorderToolLinks).mockReset().mockResolvedValue({ items: [] });
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
    const toolStatus = await screen.findByRole("region", { name: "Tool 상태 관리" });
    expect(within(toolStatus).getByRole("switch", { name: "Quiz Tool 비활성화" })).toHaveAttribute("aria-checked", "true");
    expect(within(toolStatus).queryByText("활성")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Links 데이터 관리" })).toBeInTheDocument();
    expect(await screen.findByText("QUIZ")).toBeInTheDocument();
    expect(screen.getByText("LINKS")).toBeInTheDocument();
    expect(screen.getByText("/api/v1/tools/media/links/17")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spring Docs Link 수정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spring Docs Link 삭제" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Link 추가" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("combobox", { name: "링크 분류" }));
    expect(screen.getByRole("option", { name: "REFERENCE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "MY_SERVICES" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "DEVELOPMENT" })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("combobox", { name: "링크 분류" }));
    expect(within(dialog).queryByRole("option", { name: "PERSONAL" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /기본 Preview/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).getByLabelText("이미지 첨부")).toHaveAttribute("type", "file");
    expect(within(dialog).queryByLabelText(/^대표 이미지 URL/)).not.toBeInTheDocument();
  });

  it("Links 표를 유지하고 순서 관리 모달에서 이름만 표시", async () => {
    render(<ToolsScreen />);
    const table = await screen.findByRole("table");

    fireEvent.click(screen.getByRole("button", { name: "순서 관리" }));
    const dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    expect(within(dialog).getByText("Spring Docs")).toBeInTheDocument();
    expect(within(dialog).queryByText("REFERENCE")).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "순서 저장" })).toHaveLength(1);
    expect(within(table).queryByRole("columnheader", { name: "순서" })).not.toBeInTheDocument();
    expect(within(table).getByText("Spring Docs")).toBeInTheDocument();
  });

  it("정렬 모달에서 Reference와 My Services를 독립 그룹으로 표시", async () => {
    vi.mocked(getAdminTools).mockResolvedValueOnce(groupedToolsData);
    render(<ToolsScreen />);

    await screen.findByText("React Bits");
    fireEvent.click(screen.getByRole("button", { name: "순서 관리" }));
    const dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    const reference = within(dialog).getByRole("region", { name: "Reference" });
    const myServices = within(dialog).getByRole("region", { name: "My Services" });

    expect(within(reference).getAllByRole("listitem")).toHaveLength(2);
    expect(within(myServices).getAllByRole("listitem")).toHaveLength(2);
    expect(within(reference).getByText("React Bits")).toBeInTheDocument();
    expect(within(reference).getByText("Aceternity UI")).toBeInTheDocument();
    expect(within(myServices).getByText("KVyC")).toBeInTheDocument();
    expect(within(myServices).getByText("SKHUTrack")).toBeInTheDocument();
    expect(within(reference).getByLabelText("1번째")).toBeInTheDocument();
    expect(within(reference).getByLabelText("2번째")).toBeInTheDocument();
    expect(within(myServices).getByLabelText("1번째")).toBeInTheDocument();
    expect(within(myServices).getByLabelText("2번째")).toBeInTheDocument();
    expect(within(dialog).queryByText("REFERENCE")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("MY_SERVICES")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("https://spring.io")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("switch")).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "순서 저장" })).toHaveLength(1);
    expect(within(dialog).getByRole("button", { name: "순서 저장" })).toBeDisabled();
  });

  it("그룹별 Draft를 독립 변경하고 저장 시 기존 전역 카테고리 위치를 보존", async () => {
    vi.mocked(getAdminTools).mockResolvedValueOnce(groupedToolsData);
    render(<ToolsScreen />);

    await screen.findByText("React Bits");
    fireEvent.click(screen.getByRole("button", { name: "순서 관리" }));
    const dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    const reference = within(dialog).getByRole("region", { name: "Reference" });
    const myServices = within(dialog).getByRole("region", { name: "My Services" });
    fireEvent.click(within(reference).getByRole("button", { name: "Aceternity UI 위로" }));
    fireEvent.click(within(myServices).getByRole("button", { name: "SKHUTrack 위로" }));

    expect(within(reference).getAllByRole("listitem")[0]).toHaveTextContent("Aceternity UI");
    expect(within(myServices).getAllByRole("listitem")[0]).toHaveTextContent("SKHUTrack");
    fireEvent.click(within(dialog).getByRole("button", { name: "순서 저장" }));
    await waitFor(() => expect(reorderToolLinks).toHaveBeenCalledWith({
      orderedIds: [19, 20, 17, 18],
      expectedIds: [17, 18, 19, 20],
    }));
    expect(reorderToolLinks).toHaveBeenCalledTimes(1);
  });

  it("초기화 시 두 그룹 Draft를 서버 순서로 복원하고 저장을 비활성화", async () => {
    vi.mocked(getAdminTools).mockResolvedValueOnce(groupedToolsData);
    render(<ToolsScreen />);

    await screen.findByText("React Bits");
    fireEvent.click(screen.getByRole("button", { name: "순서 관리" }));
    const dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    const reference = within(dialog).getByRole("region", { name: "Reference" });
    const myServices = within(dialog).getByRole("region", { name: "My Services" });
    fireEvent.click(within(reference).getByRole("button", { name: "Aceternity UI 위로" }));
    fireEvent.click(within(myServices).getByRole("button", { name: "SKHUTrack 위로" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "초기화" }));

    expect(within(reference).getAllByRole("listitem")[0]).toHaveTextContent("React Bits");
    expect(within(myServices).getAllByRole("listitem")[0]).toHaveTextContent("KVyC");
    expect(within(dialog).getByRole("button", { name: "초기화" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "순서 저장" })).toBeDisabled();
    expect(reorderToolLinks).not.toHaveBeenCalled();
  });

  it("Links 표를 서버 표시 순서로 정렬하고 초기화 후 재오픈하면 stale Draft를 사용하지 않음", async () => {
    vi.mocked(getAdminTools).mockResolvedValueOnce(groupedToolsData);
    render(<ToolsScreen />);

    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("React Bits");
    fireEvent.click(screen.getByRole("button", { name: "순서 관리" }));
    let dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    let reference = within(dialog).getByRole("region", { name: "Reference" });
    fireEvent.click(within(reference).getByRole("button", { name: "React Bits 아래로" }));
    expect(within(reference).getAllByRole("listitem")[0]).toHaveTextContent("Aceternity UI");

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "대화상자 닫기" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "표시 순서 관리" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "순서 관리" }));
    dialog = screen.getByRole("dialog", { name: "표시 순서 관리" });
    reference = within(dialog).getByRole("region", { name: "Reference" });
    expect(within(reference).getAllByRole("listitem")[0]).toHaveTextContent("React Bits");
    fireEvent.click(within(reference).getByRole("button", { name: "React Bits 아래로" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "초기화" }));
    expect(within(reference).getAllByRole("listitem")[0]).toHaveTextContent("React Bits");
    expect(getAdminTools).toHaveBeenCalledOnce();
    confirmSpy.mockRestore();
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
    selectOption("링크 분류", "MY_SERVICES");
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
    fireEvent.click(screen.getByRole("button", { name: "Spring Docs Link 수정" }));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("기존 이미지 유지")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(updateToolLink).toHaveBeenLastCalledWith(17, {
      metadata: expect.objectContaining({ imageMode: "KEEP" }),
      image: null,
    }));

    fireEvent.click(screen.getByRole("button", { name: "Spring Docs Link 수정" }));
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
    const linksRegion = screen.getByRole("region", { name: "Links 데이터 관리" });
    const linksTable = within(linksRegion).getByRole("table");
    expect(within(linksTable).getByText("Spring Docs")).toBeInTheDocument();
    expect(within(linksTable).getByText("My Service")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reference" }));
    expect(within(linksTable).getByText("Spring Docs")).toBeInTheDocument();
    expect(within(linksTable).queryByText("My Service")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "My Services" }));
    expect(within(linksTable).queryByText("Spring Docs")).not.toBeInTheDocument();
    expect(within(linksTable).getByText("My Service")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "전체" }));
    expect(within(linksTable).getByText("Spring Docs")).toBeInTheDocument();
    expect(within(linksTable).getByText("My Service")).toBeInTheDocument();
    expect(getAdminTools).toHaveBeenCalledOnce();
  });

  it("초기 조회 실패는 PageError로 표시", async () => {
    vi.mocked(getAdminTools).mockRejectedValue(new ApiError(500, {
      code: "COMMON_INTERNAL_ERROR",
      message: "Tools 정보를 불러오지 못했습니다.",
      traceId: "trace-tools-load",
      fieldErrors: [],
    }));
    render(<ToolsScreen />);

    expect(await screen.findByText("Tools 정보를 불러오지 못했습니다. (추적 ID: trace-tools-load)")).toBeInTheDocument();
  });

  it("Mutation 뒤 재조회 실패는 Tools 화면을 유지하고 Notification으로 표시", async () => {
    vi.mocked(getAdminTools)
      .mockResolvedValueOnce(toolsData)
      .mockRejectedValueOnce(new ApiError(500, {
        code: "COMMON_INTERNAL_ERROR",
        message: "Tools 정보를 불러오지 못했습니다.",
        traceId: "trace-tools-refresh",
        fieldErrors: [],
      }));
    render(<NotificationProvider><ToolsScreen /></NotificationProvider>);

    await screen.findByText("QUIZ");
    fireEvent.click(screen.getByRole("switch", { name: "Quiz Tool 비활성화" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Tools 변경 완료");
    expect(await screen.findByRole("alert")).toHaveTextContent("변경은 완료되었지만 최신 Tools 데이터를 불러오지 못했습니다.");
    expect(screen.getByText("QUIZ")).toBeInTheDocument();
  });
});
