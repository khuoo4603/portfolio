export type QuizQuestionType = "single" | "multiple" | "short" | "essay";

export type QuizCodeBlock = string | {
  id?: string | number;
  label?: string;
  code: string;
};

export type QuizQuestion = {
  id?: string | number;
  type: QuizQuestionType;
  question: string;
  choices?: string[];
  codeBlocks?: QuizCodeBlock[];
  rows?: number;
  placeholder?: string;
};

export type QuizExam = {
  title?: string;
  description?: string;
  questions: QuizQuestion[];
};

export type QuizAnswers = Record<number, string | string[]>;

export type NormalizedCodeBlock = {
  label: string;
  code: string;
  key: string;
};

export type QuestionPart = {
  type: "text" | "code";
  content: string;
  language?: string;
};

// 기존 QuizPage codeBlocks 문자열·객체 형식 정규화
export function normalizeCodeBlocks(question: QuizQuestion): NormalizedCodeBlock[] {
  const codeBlocks: NormalizedCodeBlock[] = [];

  if (Array.isArray(question.codeBlocks)) {
    question.codeBlocks.forEach((block, index) => {
      if (typeof block === "string") {
        codeBlocks.push({ label: "", code: block, key: `field_${index}` });
        return;
      }

      codeBlocks.push({
        label: block && block.label ? String(block.label) : "",
        code: block && block.code ? String(block.code) : "",
        key: block && block.id ? String(block.id) : `field_${index}`,
      });
    });
  }

  return codeBlocks;
}

// 문제 문자열 내부 기존 Fenced Code 분리
export function parseFencedCode(text: unknown): QuestionPart[] {
  const source = String(text || "");
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: QuestionPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: source.slice(lastIndex, match.index) });
    }

    parts.push({
      type: "code",
      language: match[1] || "",
      content: match[2] || "",
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < source.length) {
    parts.push({ type: "text", content: source.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", content: source }];
}

// 기존 QuizPage JSON 구조와 오류 문구 검증
export function parseExamJson(rawValue: string): QuizExam {
  const raw = rawValue.trim();

  if (!raw) {
    throw new Error("JSON 내용을 먼저 입력하세요.");
  }

  const data: unknown = JSON.parse(raw);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("JSON 최상위 구조가 올바르지 않습니다.");
  }

  const exam = data as Record<string, unknown>;

  if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
    throw new Error("questions 배열이 필요합니다.");
  }

  exam.questions.forEach((question, index) => {
    const number = index + 1;

    if (!question || typeof question !== "object" || Array.isArray(question)) {
      throw new Error(`${number}번 문항 구조가 올바르지 않습니다.`);
    }

    const item = question as Record<string, unknown>;

    if (!item.type || !item.question) {
      throw new Error(`${number}번 문항에 type 또는 question이 없습니다.`);
    }

    if (!["single", "multiple", "short", "essay"].includes(String(item.type))) {
      throw new Error(`${number}번 문항 type은 single, multiple, short, essay만 지원합니다.`);
    }

    if (
      (item.type === "single" || item.type === "multiple")
      && (!Array.isArray(item.choices) || item.choices.length === 0)
    ) {
      throw new Error(`${number}번 객관식 문항에 choices가 없습니다.`);
    }

    if (item.type === "single" || item.type === "multiple") {
      const choices = item.choices as unknown[];
      const invalidChoice = choices.some((choice) => typeof choice !== "string");

      if (invalidChoice) {
        throw new Error(`${number}번 객관식 선지는 문자열 배열만 지원합니다.`);
      }
    }

    if ((item.type === "short" || item.type === "essay") && "choices" in item) {
      throw new Error(`${number}번 문항은 choices를 가질 수 없습니다.`);
    }

    if (Array.isArray(item.codeBlocks)) {
      const invalidCodeBlock = item.codeBlocks.some((block) => {
        if (typeof block === "string") {
          return false;
        }

        return !block
          || typeof block !== "object"
          || Array.isArray(block)
          || typeof (block as Record<string, unknown>).code !== "string";
      });

      if (invalidCodeBlock) {
        throw new Error(`${number}번 문항의 codeBlocks 형식이 올바르지 않습니다.`);
      }
    }
  });

  return exam as QuizExam;
}

// 기존 QuizPage 문항 유형 한글 Label
export function getTypeLabel(type: QuizQuestionType) {
  if (type === "single") return "객관식 단일답안";
  if (type === "multiple") return "객관식 중복답안";
  if (type === "short") return "단답형";
  return "서술형";
}

function answerValue(question: QuizQuestion, value: string | string[] | undefined) {
  if (question.type === "single" || question.type === "multiple") {
    return Array.isArray(value)
      ? [...value].sort((left, right) => Number(left) - Number(right)).join(", ")
      : "";
  }

  return typeof value === "string" ? value.trim() : "";
}

// 기존 buildAnswerText 출력 형식 보존
export function buildAnswerText(exam: QuizExam, answers: QuizAnswers) {
  const lines: string[] = [];
  lines.push(`시험명: ${exam.title || ""}`);
  lines.push(`문항수: ${exam.questions.length}`);
  lines.push("");

  exam.questions.forEach((question, index) => {
    const answer = answerValue(question, answers[index]);
    lines.push(`${index + 1}) [${getTypeLabel(question.type)}] ${question.question || ""}`);

    normalizeCodeBlocks(question).forEach((block) => {
      if (block.label) {
        lines.push(`코드: ${block.label}`);
      }
      lines.push(block.code || "");
    });

    if (
      (question.type === "single" || question.type === "multiple")
      && Array.isArray(question.choices)
    ) {
      const choiceText = question.choices
        .map((choice, choiceIndex) => `${choiceIndex + 1}.${choice}`)
        .join(" / ");
      lines.push(`선지: ${choiceText}`);
      lines.push(`답: ${answer || "-"}`);
    }

    if (question.type === "short" || question.type === "essay") {
      lines.push(`답: ${answer || "-"}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}

// 저장 responseJson의 네 문항 유형별 유효 답안만 안전 복원
export function restoreQuizAnswers(exam: QuizExam, value: unknown): QuizAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  return exam.questions.reduce<QuizAnswers>((answers, question, index) => {
    const answer = source[String(index)];

    if (question.type === "single" || question.type === "multiple") {
      if (!Array.isArray(answer)) {
        return answers;
      }
      const maxChoice = question.choices?.length ?? 0;
      const selected = answer
        .filter((item): item is string => typeof item === "string")
        .filter((item) => /^\d+$/.test(item) && Number(item) >= 1 && Number(item) <= maxChoice);
      if (selected.length > 0) {
        answers[index] = question.type === "single" ? [selected[0]] : [...new Set(selected)];
      }
      return answers;
    }

    if (typeof answer === "string") {
      answers[index] = answer;
    }
    return answers;
  }, {});
}
