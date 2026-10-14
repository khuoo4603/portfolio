import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { SavedQuiz } from "@/types/api";
import QuizScreen from "./quiz-screen";

const mocks = vi.hoisted(() => ({
  createQuiz: vi.fn(),
  deleteQuiz: vi.fn(),
  getQuiz: vi.fn(),
  getQuizzes: vi.fn(),
  updateQuiz: vi.fn(),
  createQuizSubject: vi.fn(),
  deleteQuizSubject: vi.fn(),
  getQuizSubjects: vi.fn(),
  updateQuizSubject: vi.fn(),
}));

vi.mock("./tools-shell", () => ({
  useToolsSession: () => ({
    user: { id: 7, email: "user@example.test", name: "도구 사용자", role: "USER" },
    hasTool: (toolKey: string) => toolKey === "QUIZ",
  }),
}));
vi.mock("./tools-api", () => ({
  createQuiz: mocks.createQuiz,
  deleteQuiz: mocks.deleteQuiz,
  getQuiz: mocks.getQuiz,
  getQuizzes: mocks.getQuizzes,
  updateQuiz: mocks.updateQuiz,
  createQuizSubject: mocks.createQuizSubject,
  deleteQuizSubject: mocks.deleteQuizSubject,
  getQuizSubjects: mocks.getQuizSubjects,
  updateQuizSubject: mocks.updateQuizSubject,
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
const summary = { id: 11, title: "저장된 자바", subjectId: null, createdAt: "2026-08-27T00:00:00Z", updatedAt: "2026-08-28T00:00:00Z" };
const olderSummary = { id: 12, title: "이전 문제", subjectId: null, createdAt: "2026-08-25T00:00:00Z", updatedAt: "2026-08-26T00:00:00Z" };
const subject = { id: 3, name: "자료구조", createdAt: "2026-10-09T15:00:00+09:00", updatedAt: "2026-10-09T15:00:00+09:00" };
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

function saveQuiz() {
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  const dialog = screen.getByRole("dialog", { name: "퀴즈 저장" });
  fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
}

function selectOption(label: string, option: string) {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

function setQuizViewport(viewport: "desktop" | "tablet" | "mobile") {
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    matches: query === "(min-width: 1024px)"
      ? viewport === "desktop"
      : query === "(max-width: 767px)" && viewport === "mobile",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

describe("Quiz 저장 Workspace", () => {
  beforeEach(() => {
    mocks.createQuiz.mockReset().mockResolvedValue({ ...savedQuiz, title: "자바 기초" });
    mocks.updateQuiz.mockReset().mockResolvedValue({ ...savedQuiz, title: "수정 제목" });
    mocks.deleteQuiz.mockReset().mockResolvedValue(undefined);
    mocks.getQuiz.mockReset().mockResolvedValue(savedQuiz);
    mocks.getQuizzes.mockReset().mockResolvedValue({ items: [summary] });
    mocks.getQuizSubjects.mockReset().mockResolvedValue({ items: [] });
    mocks.createQuizSubject.mockReset().mockResolvedValue(subject);
    mocks.updateQuizSubject.mockReset().mockResolvedValue(subject);
    mocks.deleteQuizSubject.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("과목과 과목 없는 Quiz를 분리하고 과목을 펼쳐 소속 Quiz를 표시한다", async () => {
    mocks.getQuizSubjects.mockResolvedValueOnce({ items: [subject] });
    mocks.getQuizzes.mockResolvedValueOnce({ items: [
      { ...summary, subjectId: subject.id },
      { ...olderSummary, subjectId: null },
    ] });
    render(<QuizScreen />);

    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    expect(within(history).getByRole("heading", { name: "과목" })).toBeInTheDocument();
    expect(within(history).getByRole("button", { name: "과목 추가" })).toBeInTheDocument();
    expect(within(history).queryByRole("heading", { name: "저장된 문제" })).not.toBeInTheDocument();
    expect(within(history).getByRole("heading", { name: "저장된 퀴즈" })).toBeInTheDocument();
    expect(within(history).getByRole("button", { name: "자료구조 과목 펼치기" })).toBeInTheDocument();
    expect(within(history).getByText("이전 문제")).toBeInTheDocument();
    expect(within(history).queryByText("과목 없음")).not.toBeInTheDocument();

    fireEvent.click(within(history).getByRole("button", { name: "자료구조 과목 펼치기" }));
    expect(within(history).getByText("저장된 자바")).toBeInTheDocument();
    expect(within(history).getByRole("button", { name: "저장된 자바 과목 이동 메뉴" })).toBeInTheDocument();
  });

  it("Quiz 행에 제목 Viewport와 통합 Action 영역을 제공한다", async () => {
    render(<QuizScreen />);
    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    const title = within(history).getByText("저장된 자바");
    const actions = within(history).getByRole("group", { name: "저장된 자바 작업" });

    expect(title).toHaveAttribute("title", "저장된 자바");
    expect(title.parentElement?.className).toContain("savedQuizTitleViewport");
    expect(within(actions).getByRole("button", { name: "저장된 자바 과목 이동 메뉴" })).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: "저장된 자바 삭제" })).toBeInTheDocument();
  });

  it("과목 생성 Dialog에서 공백 입력을 막고 유효한 이름만 API로 전달한다", async () => {
    render(<QuizScreen />);
    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(history).getByRole("button", { name: "과목 추가" }));
    const dialog = screen.getByRole("dialog", { name: "과목 추가" });

    fireEvent.change(within(dialog).getByLabelText("과목 이름"), { target: { value: "   " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "추가" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("1~100자");
    expect(mocks.createQuizSubject).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText("과목 이름"), { target: { value: "  알고리즘  " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "추가" }));
    await waitFor(() => expect(mocks.createQuizSubject).toHaveBeenCalledWith("알고리즘"));
  });

  it("과목 메뉴에서 삭제 확인을 거쳐 삭제 API를 호출한다", async () => {
    mocks.getQuizSubjects.mockResolvedValueOnce({ items: [subject] });
    render(<QuizScreen />);
    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(history).getByRole("button", { name: "자료구조 과목 메뉴" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "과목 삭제" }));
    const dialog = screen.getByRole("dialog", { name: "과목 삭제" });
    expect(within(dialog).getByText("과목에 포함된 퀴즈는 삭제되지 않으며, 저장된 퀴즈 목록으로 이동합니다.")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "과목 삭제" }));
    await waitFor(() => expect(mocks.deleteQuizSubject).toHaveBeenCalledWith(subject.id));
  });

  it("Quiz 이동은 subjectId만 포함한 PATCH로 처리한다", async () => {
    mocks.getQuizSubjects.mockResolvedValueOnce({ items: [subject] });
    render(<QuizScreen />);
    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(history).getByRole("button", { name: "저장된 자바 과목 이동 메뉴" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "과목 이동" }));
    const dialog = screen.getByRole("dialog", { name: "과목 이동" });
    expect(within(dialog).getByRole("combobox", { name: "이동할 과목" })).toHaveTextContent("과목 없음");
    selectOption("이동할 과목", "자료구조");
    fireEvent.click(within(dialog).getByRole("button", { name: "이동" }));
    await waitFor(() => expect(mocks.updateQuiz).toHaveBeenCalledWith(summary.id, { subjectId: subject.id }));
  });

  it("신규 Quiz 저장 Dialog에서 선택한 과목 ID를 함께 저장한다", async () => {
    mocks.getQuizSubjects.mockResolvedValueOnce({ items: [subject] });
    render(<QuizScreen />);
    await screen.findByRole("button", { name: "자료구조 과목 펼치기" });
    loadJson();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    const dialog = screen.getByRole("dialog", { name: "퀴즈 저장" });
    selectOption("저장 과목", "자료구조");
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));
    await waitFor(() => expect(mocks.createQuiz).toHaveBeenCalledWith(expect.objectContaining({ subjectId: subject.id })));
  });

  it("Desktop Sidebar를 Header 우측 Toggle로 접고 다시 열어도 저장 목록을 유지한다", async () => {
    setQuizViewport("desktop");
    render(<QuizScreen />);

    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    const closeToggle = screen.getByRole("button", { name: "저장된 문제 사이드바 닫기" });
    expect(mocks.getQuizzes).toHaveBeenCalledOnce();
    expect(closeToggle).toHaveAttribute("aria-controls", "quiz-history");
    expect(closeToggle).toHaveAttribute("aria-expanded", "true");
    expect(within(history).queryByRole("heading", { name: "저장된 문제" })).not.toBeInTheDocument();
    expect(within(history).queryByText("최근 수정한 순서")).not.toBeInTheDocument();
    expect(within(history).getByRole("button", { name: "저장된 자바" })).toBeInTheDocument();

    fireEvent.click(closeToggle);
    expect(history).toHaveAttribute("aria-hidden", "true");
    expect(history).toHaveAttribute("inert");
    expect(history.className).toContain("quizHistoryCollapsed");
    expect(document.querySelector('[class*="quizLayout"]')?.className).toContain("quizLayoutCollapsed");
    expect(screen.queryByRole("complementary", { name: "저장된 문제" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장된 문제 사이드바 열기" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "저장된 문제 사이드바 열기" }));
    expect(screen.getByRole("complementary", { name: "저장된 문제" })).toHaveTextContent("저장된 자바");
    expect(mocks.getQuizzes).toHaveBeenCalledOnce();
  });

  it("Tablet은 Header Toggle 없이 좌하단 Compact Toggle로 Drawer를 열고 닫는다", async () => {
    setQuizViewport("tablet");
    render(<QuizScreen />);

    const toggle = screen.getByRole("button", { name: "저장된 문제 사이드바 열기" });
    expect(toggle.className).toContain("compactHistoryToggle");
    expect(toggle).toHaveAttribute("aria-controls", "quiz-history");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector('[class*="historyHeaderToggle"]')).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "저장된 문제" })).not.toBeInTheDocument();
    expect(document.getElementById("quiz-history")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(toggle);
    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    expect(screen.queryByRole("button", { name: "저장된 문제 사이드바 열기" })).not.toBeInTheDocument();
    expect(document.querySelector('[class*="quizHistoryBackdropOpen"]')).toBeInTheDocument();
    fireEvent.click(within(history).getByRole("button", { name: "저장된 문제 닫기" }));
    expect(screen.queryByRole("complementary", { name: "저장된 문제" })).not.toBeInTheDocument();
    expect(document.getElementById("quiz-history")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "저장된 문제 사이드바 열기" })).toBeInTheDocument();
  });

  it("Mobile은 Header Toggle 대신 좌측 하단 버튼으로 Drawer를 연다", async () => {
    setQuizViewport("mobile");
    render(<QuizScreen />);

    const toggle = screen.getByRole("button", { name: "저장된 문제 사이드바 열기" });
    expect(toggle.className).toContain("compactHistoryToggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    expect(screen.queryByRole("button", { name: "저장된 문제 사이드바 열기" })).not.toBeInTheDocument();
    fireEvent.click(within(history).getByRole("button", { name: "저장된 문제 닫기" }));
    expect(screen.getByRole("button", { name: "저장된 문제 사이드바 열기" })).toBeInTheDocument();
  });

  it("Mobile Drawer를 닫으면 고정 열기 버튼으로 포커스를 복원한다", async () => {
    setQuizViewport("mobile");
    render(<QuizScreen />);

    const toggle = screen.getByRole("button", { name: "저장된 문제 사이드바 열기" });
    toggle.focus();
    fireEvent.click(toggle);
    const history = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(history).getByRole("button", { name: "저장된 문제 닫기" }));
    expect(screen.getByRole("button", { name: "저장된 문제 사이드바 열기" })).toHaveFocus();
  });

  it("문제를 불러온 뒤에도 JSON 입력을 유지하고 JSON 토글을 노출하지 않는다", () => {
    render(<QuizScreen />);
    loadJson();

    expect(screen.getByLabelText("문제 JSON")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /문제 JSON (열기|접기)/ })).not.toBeInTheDocument();
  });

  it("질문 헤더에 번호·질문·유형을 한 번만 표시하고 fenced code를 본문에 유지한다", () => {
    render(<QuizScreen />);
    loadJson(JSON.stringify({
      title: "C 언어",
      questions: [{
        id: 1,
        type: "single",
        question: "다음 코드를 실행한 결과는?\n```c\nprintf(\"%d\", 1);\n```\n결과를 고르세요.",
        choices: ["1", "2"],
      }],
    }));

    const question = screen.getByRole("region", { name: "다음 코드를 실행한 결과는?" });
    expect(within(question).getByText("01.")).toBeInTheDocument();
    expect(within(question).getByText("객관식 단일답안")).toBeInTheDocument();
    expect(within(question).getAllByText("다음 코드를 실행한 결과는?")).toHaveLength(1);
    expect(within(question).getByText('printf("%d", 1);')).toBeInTheDocument();
    expect(within(question).getByText("결과를 고르세요.")).toBeInTheDocument();
  });

  it("성공 알림은 10초 후 퇴장한다", () => {
    vi.useFakeTimers();
    render(<QuizScreen />);
    loadJson();

    expect(screen.getByRole("status")).toHaveTextContent("문제 불러오기 완료");
    act(() => vi.advanceTimersByTime(9_999));
    expect(screen.getByRole("status")).toHaveTextContent("문제를 정상적으로 불러왔습니다.");
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(181));
    expect(screen.queryByText("문제 불러오기 완료")).not.toBeInTheDocument();
  });

  it("알림 닫기 버튼은 대기 Timer 없이 해당 알림을 제거한다", () => {
    vi.useFakeTimers();
    render(<QuizScreen />);
    loadJson();

    fireEvent.click(screen.getByRole("button", { name: "문제 불러오기 완료 알림 닫기" }));
    act(() => vi.advanceTimersByTime(181));
    expect(screen.queryByText("문제 불러오기 완료")).not.toBeInTheDocument();
  });

  it("오류 알림은 30초 동안 유지한다", () => {
    vi.useFakeTimers();
    render(<QuizScreen />);
    fireEvent.change(screen.getByLabelText("문제 JSON"), { target: { value: "{" } });
    fireEvent.click(screen.getByRole("button", { name: "문제 불러오기" }));

    expect(screen.getByRole("alert")).toHaveTextContent("문제 불러오기 실패");
    act(() => vi.advanceTimersByTime(29_999));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(181));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("저장 제목을 JSON 입력 아래에 직접 표시하고 별도 저장 정보 영역을 만들지 않는다", () => {
    render(<QuizScreen />);
    loadJson();

    const inputSection = screen.getByRole("region", { name: "JSON Input" });
    const actionBar = screen.getByRole("group", { name: "Quiz 작업" });
    expect(screen.queryByLabelText("Quiz 저장 Toolbar")).not.toBeInTheDocument();
    expect(within(inputSection).getByLabelText("저장 제목")).toBeInTheDocument();
    expect(within(inputSection).queryByRole("region", { name: "저장 정보" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "저장 정보" })).not.toBeInTheDocument();
    expect(within(actionBar).getByRole("button", { name: "저장" })).toBeInTheDocument();
    expect(within(actionBar).queryByRole("button", { name: /문제 JSON (열기|접기)/ })).not.toBeInTheDocument();
    expect(within(actionBar).queryByRole("button", { name: "저장된 문제" })).not.toBeInTheDocument();
  });

  it("알림은 상태 아이콘·내용·닫기 버튼을 함께 제공한다", () => {
    render(<QuizScreen />);
    loadJson();

    const notification = screen.getByRole("status");
    expect(notification).toHaveTextContent("문제 불러오기 완료");
    expect(notification).toHaveTextContent("문제를 정상적으로 불러왔습니다.");
    expect(notification.querySelector('div[aria-hidden="true"]')).not.toBeNull();
    expect(within(notification).getByRole("button", { name: "문제 불러오기 완료 알림 닫기" })).toBeInTheDocument();
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
    expect(preview.closest("details")).toHaveAttribute("open");
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
    fillAllAnswers();
    saveQuiz();

    await waitFor(() => expect(mocks.createQuiz).toHaveBeenCalledWith({
      title: "자바 기초",
      quizJson: examData,
      responseJson: { 0: ["2"], 1: ["1", "3"], 2: "5", 3: "서술 답안" },
      subjectId: null,
    }));
    expect(screen.getByText("저장 완료")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("저장 제목"), { target: { value: "수정 제목" } });
    saveQuiz();
    await waitFor(() => expect(mocks.updateQuiz).toHaveBeenCalledWith(11, expect.objectContaining({ title: "수정 제목" })));
    expect(screen.getAllByText("저장 완료")).not.toHaveLength(0);
  });

  it("제목 없는 JSON에 가짜 제목을 만들지 않고 사용자 입력을 요구", () => {
    render(<QuizScreen />);
    loadJson(JSON.stringify({ questions: [{ type: "short", question: "답은?" }] }));
    expect(screen.getByLabelText("저장 제목")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("alert")).toHaveTextContent("저장할 수 없음");
    expect(mocks.createQuiz).not.toHaveBeenCalled();
  });

  it("최근 수정순 목록에서 상세과 네 유형 답안을 안전하게 복원", async () => {
    mocks.getQuizzes.mockResolvedValue({ items: [summary, olderSummary] });
    render(<QuizScreen />);
    const dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    expect(mocks.getQuizzes).toHaveBeenCalledOnce();
    expect(within(dialog).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("저장된 자바"),
      expect.stringContaining("이전 문제"),
    ]);
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);

    await waitFor(() => expect(mocks.getQuiz).toHaveBeenCalledWith(11));
    expect(screen.getByRole("radio", { name: "2. int" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "1. int" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "3. boolean" })).toBeChecked();
    expect(screen.getByLabelText("단답형 답안")).toHaveValue("5");
    expect(screen.getByLabelText("서술형 답안")).toHaveValue("서술 복원");
    expect(screen.getByLabelText("저장 제목")).toHaveValue("저장된 자바");
    expect(screen.getByText("불러오기 완료")).toBeInTheDocument();
  });

  it("잘못된 저장 JSON과 Dirty 교체 취소가 현재 화면을 덮어쓰지 않음", async () => {
    render(<QuizScreen />);
    loadJson();
    let dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    let confirm = screen.getByRole("dialog", { name: "문제 교체" });
    fireEvent.click(within(confirm).getByRole("button", { name: "취소" }));
    expect(mocks.getQuiz).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();

    mocks.getQuiz.mockResolvedValueOnce({ ...savedQuiz, quizJson: { questions: [] } });
    dialog = screen.getByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    confirm = screen.getByRole("dialog", { name: "문제 교체" });
    fireEvent.click(within(confirm).getByRole("button", { name: "교체" }));
    dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("questions 배열이 필요합니다."));
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();

    mocks.getQuiz.mockRejectedValueOnce(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE", message: "상세 조회 실패", traceId: "detail-trace", fieldErrors: [],
    }));
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    confirm = screen.getByRole("dialog", { name: "문제 교체" });
    fireEvent.click(within(confirm).getByRole("button", { name: "교체" }));
    dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    await waitFor(() => expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent("상세 조회 실패 (추적 ID: detail-trace)"));
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

  it("과목만 있어도 과목과 저장된 퀴즈 섹션 순서로 Empty를 표시", async () => {
    mocks.getQuizSubjects.mockResolvedValueOnce({ items: [subject] });
    mocks.getQuizzes.mockResolvedValueOnce({ items: [] });
    render(<QuizScreen />);
    const dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    expect(await within(dialog).findByText("저장된 문제가 없습니다.")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("heading").map((heading) => heading.textContent)).toEqual(["과목", "저장된 퀴즈"]);
  });

  it("저장 목록 오류에도 Desktop Sidebar Toggle은 동작", async () => {
    mocks.getQuizzes.mockRejectedValueOnce(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE", message: "목록 조회 실패", traceId: "list-trace", fieldErrors: [],
    }));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("저장 목록 불러오기 실패"));
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제 사이드바 닫기" }));
    expect(screen.queryByRole("complementary", { name: "저장된 문제" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "저장된 문제 사이드바 열기" }));
    expect(screen.getByRole("complementary", { name: "저장된 문제" })).toBeInTheDocument();
  });

  it("열린 저장본 삭제 후 문제·답안은 유지하고 미저장 상태로 전환", async () => {
    render(<QuizScreen />);
    let dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    await waitFor(() => expect(screen.getByText("불러오기 완료")).toBeInTheDocument());

    dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장된 자바 삭제" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "저장된 문제 삭제" })).getByRole("button", { name: "삭제" }));
    await waitFor(() => expect(mocks.deleteQuiz).toHaveBeenCalledWith(11));
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();
    expect(screen.getByLabelText("단답형 답안")).toHaveValue("5");
    expect(screen.getByText("삭제 완료")).toBeInTheDocument();
  });

  it("열리지 않은 저장본 삭제 취소·성공이 현재 저장 ID와 답안을 변경하지 않음", async () => {
    mocks.getQuizzes.mockResolvedValue({ items: [summary, olderSummary] });
    render(<QuizScreen />);
    let dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    await waitFor(() => expect(screen.getByText("불러오기 완료")).toBeInTheDocument());

    dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByRole("button", { name: "이전 문제 삭제" }));
    let confirm = screen.getByRole("dialog", { name: "저장된 문제 삭제" });
    expect(within(confirm).getByText("이전 문제")).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole("button", { name: "취소" }));
    expect(mocks.deleteQuiz).not.toHaveBeenCalled();

    dialog = screen.getByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByRole("button", { name: "이전 문제 삭제" }));
    confirm = screen.getByRole("dialog", { name: "저장된 문제 삭제" });
    fireEvent.click(within(confirm).getByRole("button", { name: "삭제" }));
    dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    await waitFor(() => expect(mocks.deleteQuiz).toHaveBeenCalledWith(12));
    expect(within(dialog).queryByText("이전 문제")).not.toBeInTheDocument();
    expect(screen.getByLabelText("단답형 답안")).toHaveValue("5");
  });

  it("기존 저장본 PATCH 실패 시 ID·답안·Dirty 상태를 유지", async () => {
    mocks.updateQuiz.mockRejectedValueOnce(new ApiError(503, {
      code: "COMMON_SERVICE_UNAVAILABLE", message: "수정 저장 실패", traceId: "update-trace", fieldErrors: [],
    }));
    render(<QuizScreen />);
    const dialog = await screen.findByRole("complementary", { name: "저장된 문제" });
    fireEvent.click(within(dialog).getByText("저장된 자바").closest("button")!);
    await waitFor(() => expect(screen.getByText("불러오기 완료")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("단답형 답안"), { target: { value: "수정 답" } });
    saveQuiz();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("저장 실패"));
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
    saveQuiz();
    await waitFor(() => expect(screen.getByText("저장 실패")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("저장 서비스를 사용할 수 없습니다. (추적 ID: quiz-trace)");
    expect(screen.getByRole("heading", { name: "자바 기초" })).toBeInTheDocument();
  });
});
