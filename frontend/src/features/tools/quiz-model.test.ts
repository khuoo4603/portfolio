import { describe, expect, it } from "vitest";
import {
  buildAnswerText,
  normalizeCodeBlocks,
  parseExamJson,
  parseFencedCode,
  type QuizExam,
} from "./quiz-model";
import { QUIZ_PROMPT } from "./quiz-prompt";

describe("기존 QuizPage 데이터 계약", () => {
  it("single·multiple·short·essay와 codeBlocks를 기존 규칙으로 검증", () => {
    const exam = parseExamJson(JSON.stringify({
      title: "자료구조",
      questions: [
        { type: "single", question: "단일", choices: ["A", "B"] },
        { type: "multiple", question: "복수", choices: ["A", "B"] },
        { type: "short", question: "단답", codeBlocks: ["const a = 1;"] },
        { type: "essay", question: "서술", codeBlocks: [{ id: "main", label: "Main.java", code: "class Main {}" }] },
      ],
    }));

    expect(exam.questions.map((question) => question.type)).toEqual(["single", "multiple", "short", "essay"]);
    expect(normalizeCodeBlocks(exam.questions[2])).toEqual([
      { label: "", code: "const a = 1;", key: "field_0" },
    ]);
    expect(normalizeCodeBlocks(exam.questions[3])).toEqual([
      { label: "Main.java", code: "class Main {}", key: "main" },
    ]);
  });

  it("기존 Validation 오류 문구와 허용 유형을 유지", () => {
    expect(() => parseExamJson("")).toThrow("JSON 내용을 먼저 입력하세요.");
    expect(() => parseExamJson("[]")).toThrow("JSON 최상위 구조가 올바르지 않습니다.");
    expect(() => parseExamJson('{"questions":[]}')).toThrow("questions 배열이 필요합니다.");
    expect(() => parseExamJson('{"questions":[{"type":"single","question":"문제"}]}'))
      .toThrow("1번 객관식 문항에 choices가 없습니다.");
    expect(() => parseExamJson('{"questions":[{"type":"short","question":"문제","choices":[]}]}'))
      .toThrow("1번 문항은 choices를 가질 수 없습니다.");
    expect(() => parseExamJson('{"questions":[{"type":"unknown","question":"문제"}]}'))
      .toThrow("1번 문항 type은 single, multiple, short, essay만 지원합니다.");
  });

  it("문항·코드·선지·답안을 기존 buildAnswerText 형식으로 직렬화", () => {
    const exam: QuizExam = {
      title: "자바 기초",
      questions: [
        {
          type: "single",
          question: "기본 타입은?",
          choices: ["String", "int"],
          codeBlocks: [{ label: "Main.java", code: "int value = 1;" }],
        },
        { type: "multiple", question: "모두 고르시오.", choices: ["int", "String", "boolean"] },
        { type: "short", question: "출력값은?" },
        { type: "essay", question: "차이를 설명하시오." },
      ],
    };

    expect(buildAnswerText(exam, {
      0: ["2"],
      1: ["3", "1"],
      2: "  5  ",
      3: "설명 답안",
    })).toBe([
      "시험명: 자바 기초",
      "문항수: 4",
      "",
      "1) [객관식 단일답안] 기본 타입은?",
      "코드: Main.java",
      "int value = 1;",
      "선지: 1.String / 2.int",
      "답: 2",
      "",
      "2) [객관식 중복답안] 모두 고르시오.",
      "선지: 1.int / 2.String / 3.boolean",
      "답: 1, 3",
      "",
      "3) [단답형] 출력값은?",
      "답: 5",
      "",
      "4) [서술형] 차이를 설명하시오.",
      "답: 설명 답안",
      "",
    ].join("\n"));
  });

  it("문제 문자열 내부 Fenced Code와 원본 GPT 지시문을 보존", () => {
    expect(parseFencedCode("설명\n```java\nint a = 1;\n```\n질문")).toEqual([
      { type: "text", content: "설명\n" },
      { type: "code", language: "java", content: "int a = 1;\n" },
      { type: "text", content: "\n질문" },
    ]);
    expect(QUIZ_PROMPT).toContain("출력은 반드시 JSON만 하고");
    expect(QUIZ_PROMPT).toContain("choices 안의 객체");
    expect(QUIZ_PROMPT).toContain('"code": "int a = 3;\\nSystem.out.println(a + 2);"');
  });
});
