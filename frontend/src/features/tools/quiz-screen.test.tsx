import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuizScreen from "./quiz-screen";
import ToolsShell from "./tools-shell";

const navigation = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace, router: { replace } };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/tools/quiz",
  useRouter: () => navigation.router,
}));

const examJson = JSON.stringify({
  title: "자바 기초",
  description: "네 유형 확인",
  questions: [
    { id: 1, type: "single", question: "기본 타입은?", choices: ["String", "int"] },
    { id: 2, type: "multiple", question: "기본 타입을 모두 고르시오.", choices: ["int", "String", "boolean"] },
    { id: 3, type: "short", question: "출력값은?", codeBlocks: [{ label: "Main.java", code: "System.out.println(5);" }] },
    { id: 4, type: "essay", question: "차이를 설명하시오." },
  ],
});

describe("Quiz Workspace", () => {
  beforeEach(() => {
    navigation.replace.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("원본 네 유형·Code Block·실시간 답안 미리보기·복사·초기화를 유지", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });

    render(<ToolsShell><QuizScreen /></ToolsShell>);
    const jsonInput = await screen.findByLabelText("문제 JSON");

    fireEvent.change(jsonInput, { target: { value: examJson } });
    fireEvent.click(screen.getByRole("button", { name: "문제 불러오기" }));

    expect(screen.getByRole("heading", { name: "Question List" })).toBeInTheDocument();
    expect(screen.getByText("Main.java")).toBeInTheDocument();
    expect(screen.getByText("System.out.println(5);")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "2. int" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "1. int" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "3. boolean" }));
    fireEvent.change(screen.getByLabelText("단답형 답안"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("서술형 답안"), { target: { value: "반복 조건의 차이" } });

    const preview = screen.getByLabelText("현재 답안 미리보기") as HTMLTextAreaElement;
    expect(preview.value).toContain("1) [객관식 단일답안] 기본 타입은?");
    expect(preview.value).toContain("답: 2");
    expect(preview.value).toContain("답: 1, 3");
    expect(preview.value).toContain("코드: Main.java\nSystem.out.println(5);");
    expect(preview.value).toContain("답: 반복 조건의 차이");

    fireEvent.click(screen.getByRole("button", { name: "문항 포함 답안 복사" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(preview.value));

    fireEvent.click(screen.getByRole("button", { name: "GPT 문제 생성 지시문 복사" }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining("출력은 반드시 JSON만 하고")));

    fireEvent.click(screen.getByRole("button", { name: "전체 초기화" }));
    expect(jsonInput).toHaveValue("");
    expect(screen.queryByRole("heading", { name: "Question List" })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("잘못된 JSON에서 구체적 기존 오류를 표시하고 Workspace를 숨김", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<ToolsShell><QuizScreen /></ToolsShell>);
    const jsonInput = await screen.findByLabelText("문제 JSON");
    fireEvent.change(jsonInput, { target: { value: '{"questions":[]}' } });
    fireEvent.click(screen.getByRole("button", { name: "문제 불러오기" }));

    expect(screen.getByText("불러오기 실패: questions 배열이 필요합니다.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Question List" })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
