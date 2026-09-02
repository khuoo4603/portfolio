import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { SavedQuiz } from "@/types/api";
import QuizScreen from "./quiz-screen";

const mocks = vi.hoisted(() => ({
  createQuiz: vi.fn(), deleteQuiz: vi.fn(), getQuiz: vi.fn(), getQuizzes: vi.fn(), updateQuiz: vi.fn(),
}));

vi.mock("./tools-shell", () => ({
  useToolsSession: () => ({ hasTool: (toolKey: string) => toolKey === "QUIZ" }),
}));
vi.mock("./tools-api", () => ({
  createQuiz: mocks.createQuiz,
  deleteQuiz: mocks.deleteQuiz,
  getQuiz: mocks.getQuiz,
  getQuizzes: mocks.getQuizzes,
  updateQuiz: mocks.updateQuiz,
}));

const examData = {
  title: "자바 기초",
  description: "네 유형 확인",
  questions: [
    { id: 1, type: "single", question: "기본 타입은?", choices: ["String", "int"] },
    { id: 2, type: "multiple", question: "기본 타입을 모두 고르시오.", choices: ["int", "String", "boolean"] },
    { id: 3, type: "short", question: "출력값은?", codeBlocks: [{ label: "Main.java", code: "System.out.println(5);" }] },
    { id: 4, type: "essay", question: "차이를 설명하시오." },
  ],
};
const examJson = JSON.stringify(examData);
const summary = { id: 11, title: "저장된 자바", createdAt: "2026-08-27T00:00:00Z", updatedAt: "2026-08-28T00:00:00Z" };
const olderSummary = { id: 12, title: "이전 문제", createdAt: "2026-08-25T00:00:00Z", updatedAt: "2026-08-26T00:00:00Z" };
const savedQuiz: SavedQuiz = {
  ...summary,
  quizJson: examData,
  responseJson: { 0: ["2"], 1: ["1", "3"], 2: "5", 3: "서술 복원" },
};

function loadJson(value = examJson) {
  fireEvent.change(screen.getByLabelText("문제 JSON"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "문제 불러오기" }));
}

function fillAllAnswers() {
  fireEvent.click(screen.getByRole("radio", { name: "2. int" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "1. int" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "3. boolean" }));
  fireEvent.change(screen.getByLabelText("단답형 답안"), { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("서술형 답안"), { target: { value: "서술 답안" } });
}

describe("Quiz 저장 Workspace", () => {
  beforeEach(() => {
    mocks.createQuiz.mockReset().mockResolvedValue({ ...savedQuiz, title: "자바 기초" });
    mocks.updateQuiz.mockReset().mockResolvedValue({ ...savedQuiz, title: "수정 제목" });
    mocks.deleteQuiz.mockReset().mockResolvedValue(undefined);
    mocks.getQuiz.mockReset().mockResolvedValue(savedQuiz);
    mocks.getQuizzes.mockReset().mockResolvedValue({ items: [summary] });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("기존 네 유형·Code Block·Preview·Copy·Reset 동작을 유지", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
    render(<QuizScreen />);
    loadJson();

    expect(screen.getByText("Main.java")).toBeInTheDocument();
    expect(screen.getByText("System.out.println(5);")).toBeInTheDocument();
    fillAllAnswers();
    const preview = screen.getByLabelText("현재 답안 미리보기") as HTMLTextAreaElement;
    expect(preview.value).toContain("답: 2");
    expect(preview.value).toContain("답: 1, 3");
    expect(preview.value).toContain("코드: Main.java\nSystem.out.println(5);");
    expect(preview.value).toContain("답: 서술 답안");

    fireEvent.click(screen.getByRole("button", { name: "문항 포함 답안 복사" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(preview.value));
    fireEvent.click(screen.getByRole("button", { name: "GPT 문제 생성 지시문 복사" }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining("출력은 반드시 JSON만 하고")));

    fireEvent.click(screen.getByRole("button", { name: "전체 초기화" }));
    expect(screen.getByLabelText("문제 JSON")).toHaveValue("");
    expect(screen.queryByRole("heading", { name: "Question List" })).not.toBeInTheDocument();
  });

  it("새 JSON을 미저장 상태로 열고 POST 이후 답안 변경·PATCH 상태를 갱신", async () => {
    render(<QuizScreen />);
    loadJson();
    expect(screen.getByLabelText("저장 제목")).toHaveValue("자바 기초");
    expect(screen.getByText("저장되지 않음")).toBeInTheDocument();
    fillAllAnswers();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(mocks.createQuiz).toHaveBeenCalledWith({
      title: "자바 기초",
      quizJson: examData,
      responseJson: { 0: ["2"], 1: ["1", "3"], 2: "5", 3: "서술 답안" },
    }));
    expect(screen.getByText("저장됨")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("저장 제목"), { target: { value: "수정 제목" } });
    expect(screen.getByText("변경사항 있음")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(mocks.updateQuiz).toHaveBeenCalledWith(11, expect.objectContaining({ title: "수정 제목" })));
    expect(screen.getByText("저장됨")).toBeInTheDocument();
  });

  it("제목 없는 JSON에 가짜 제목을 만들지 않고 사용자 입력을 요구", () => {
    render(<QuizScreen />);
    loadJson(JSON.stringify({ questions: [{ type: "short", question: "답은?" }] }));
    expect(screen.getByLabelText("저장 제목")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("alert")).toHaveTextContent("저장 제목을 입력해 주세요.");
    expect(mocks.createQuiz).not.toHaveBeenCalled();
  });

  it("최근 수정순 목록에서 상세과 네 유형 답안을 안전하게 복원", async () => {
    mocks.getQuizzes.mockResolvedValue({ items: [summary, olderSummary] });
    render(<QuizScreen />);
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    const dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    expect(mocks.getQuizzes).toHaveBeenCalledOnce();
    expect(within(dialog).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("저장된 자바"),
      expect.stringContaining("이전 문제"),
    ]);
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);

    await waitFor(() => expect(mocks.getQuiz).toHaveBeenCalledWith(11));
    expect(screen.queryByRole("dialog", { name: "저장된 문제" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "2. int" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "1. int" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "3. boolean" })).toBeChecked();
    expect(screen.getByLabelText("단답형 답안")).toHaveValue("5");
    expect(screen.getByLabelText("서술형 답안")).toHaveValue("서술 복원");
    expect(screen.getByLabelText("저장 제목")).toHaveValue("저장된 자바");
    expect(screen.getByText("저장됨")).toBeInTheDocument();
  });

  it("잘못된 저장 JSON과 Dirty 교체 취소가 현재 화면을 덮어쓰지 않음", async () => {
    render(<QuizScreen />);
    loadJson();
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    let dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    let confirm = screen.getByRole("dialog", { name: "문제 교체" });
    fireEvent.click(within(confirm).getByRole("button", { name: "취소" }));
    expect(mocks.getQuiz).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();

    mocks.getQuiz.mockResolvedValueOnce({ ...savedQuiz, quizJson: { questions: [] } });
    dialog = screen.getByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    confirm = screen.getByRole("dialog", { name: "문제 교체" });
    fireEvent.click(within(confirm).getByRole("button", { name: "교체" }));
    dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent("questions 배열이 필요합니다."));
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();

    mocks.getQuiz.mockRejectedValueOnce(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE", message: "상세 조회 실패", traceId: "detail-trace", fieldErrors: [],
    }));
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    confirm = screen.getByRole("dialog", { name: "문제 교체" });
    fireEvent.click(within(confirm).getByRole("button", { name: "교체" }));
    dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent("상세 조회 실패 (추적 ID: detail-trace)"));
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();
  });

  it("미저장 문제를 새 JSON으로 교체하기 전에 사이트 확인 Dialog를 사용", () => {
    render(<QuizScreen />);
    loadJson();
    fireEvent.change(screen.getByLabelText("문제 JSON"), { target: { value: JSON.stringify({ ...examData, title: "교체 문제" }) } });
    fireEvent.click(screen.getByRole("button", { name: "문제 불러오기" }));

    const confirm = screen.getByRole("dialog", { name: "문제 교체" });
    expect(within(confirm).getByText("저장하지 않은 변경사항을 새 JSON으로 교체할까요?")).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole("button", { name: "취소" }));
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "문제 불러오기" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "문제 교체" })).getByRole("button", { name: "교체" }));
    expect(screen.getByRole("heading", { name: "교체 문제" })).toBeInTheDocument();
  });

  it("저장 목록 Empty와 조회 오류를 Dialog 안에서 분리", async () => {
    mocks.getQuizzes.mockResolvedValueOnce({ items: [] });
    render(<QuizScreen />);
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    let dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    expect(await within(dialog).findByText("저장된 문제가 없습니다.")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "대화상자 닫기" }));

    mocks.getQuizzes.mockRejectedValueOnce(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE", message: "목록 조회 실패", traceId: "list-trace", fieldErrors: [],
    }));
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent("목록 조회 실패 (추적 ID: list-trace)"));
  });

  it("열린 저장본 삭제 후 문제·답안은 유지하고 미저장 상태로 전환", async () => {
    render(<QuizScreen />);
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    let dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    await waitFor(() => expect(screen.getByText("저장됨")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장된 자바 삭제" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "저장된 문제 삭제" })).getByRole("button", { name: "삭제" }));
    await waitFor(() => expect(mocks.deleteQuiz).toHaveBeenCalledWith(11));
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();
    expect(screen.getByLabelText("단답형 답안")).toHaveValue("5");
    expect(screen.getByText("저장되지 않음")).toBeInTheDocument();
  });

  it("열리지 않은 저장본 삭제 취소·성공이 현재 저장 ID와 답안을 변경하지 않음", async () => {
    mocks.getQuizzes.mockResolvedValue({ items: [summary, olderSummary] });
    render(<QuizScreen />);
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    let dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    await waitFor(() => expect(screen.getByText("저장됨")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByRole("button", { name: "이전 문제 삭제" }));
    let confirm = screen.getByRole("dialog", { name: "저장된 문제 삭제" });
    expect(within(confirm).getByText("이전 문제")).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole("button", { name: "취소" }));
    expect(mocks.deleteQuiz).not.toHaveBeenCalled();

    dialog = screen.getByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByRole("button", { name: "이전 문제 삭제" }));
    confirm = screen.getByRole("dialog", { name: "저장된 문제 삭제" });
    fireEvent.click(within(confirm).getByRole("button", { name: "삭제" }));
    dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    await waitFor(() => expect(mocks.deleteQuiz).toHaveBeenCalledWith(12));
    expect(within(dialog).queryByText("이전 문제")).not.toBeInTheDocument();
    expect(screen.getByText("저장됨")).toBeInTheDocument();
    expect(screen.getByLabelText("단답형 답안")).toHaveValue("5");
  });

  it("기존 저장본 PATCH 실패 시 ID·답안·Dirty 상태를 유지", async () => {
    mocks.updateQuiz.mockRejectedValueOnce(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE", message: "수정 저장 실패", traceId: "update-trace", fieldErrors: [],
    }));
    render(<QuizScreen />);
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제" }));
    const dialog = await screen.findByRole("dialog", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    await waitFor(() => expect(screen.getByText("저장됨")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("단답형 답안"), { target: { value: "수정 답" } });
    expect(screen.getByText("변경사항 있음")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(screen.getByText("저장 실패")).toBeInTheDocument());
    expect(mocks.updateQuiz).toHaveBeenCalledWith(11, expect.objectContaining({
      responseJson: expect.objectContaining({ 2: "수정 답" }),
    }));
    expect(mocks.createQuiz).not.toHaveBeenCalled();
    expect(screen.getByLabelText("단답형 답안")).toHaveValue("수정 답");
  });

  it("저장 실패 시 Workspace를 유지하고 Backend Error와 실패 상태를 표시", async () => {
    mocks.createQuiz.mockRejectedValue(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE", message: "저장 서비스를 사용할 수 없습니다.", traceId: "quiz-trace", fieldErrors: [],
    }));
    render(<QuizScreen />);
    loadJson();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(screen.getByText("저장 실패")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("저장 서비스를 사용할 수 없습니다. (추적 ID: quiz-trace)");
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();
  });
});
