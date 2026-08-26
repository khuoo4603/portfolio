"use client";

import { Copy, Eraser, FileJson } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildAnswerText,
  getTypeLabel,
  normalizeCodeBlocks,
  parseExamJson,
  parseFencedCode,
  type QuizAnswers,
  type QuizExam,
  type QuizQuestion,
} from "./quiz-model";
import { QUIZ_PROMPT } from "./quiz-prompt";
import { useToolsSession } from "./tools-shell";
import styles from "./tools.module.css";

type Status = {
  message: string;
  success?: boolean;
};

// Clipboard API와 기존 비보안 Context Fallback 복사
async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const fallback = document.createElement("textarea");
  fallback.value = text;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.left = "-9999px";
  fallback.style.top = "0";
  document.body.appendChild(fallback);
  fallback.focus();
  fallback.select();

  try {
    const successful = document.execCommand("copy");

    if (!successful) {
      throw new Error("execCommand copy failed");
    }
  } finally {
    document.body.removeChild(fallback);
  }
}

// 문제 문자열과 명시적 codeBlocks의 독립 Scroll 렌더링
function QuestionContent({ question }: { question: QuizQuestion }) {
  return (
    <div className={styles.questionParts}>
      {parseFencedCode(question.question).map((part, index) => (
        part.type === "code" ? (
          <div className={styles.codeWrap} key={`inline-${index}`}>
            {part.language && <div className={`${styles.codeLabel} type-small`}>{part.language}</div>}
            <pre className={`${styles.codeBlock} type-small`}>{part.content}</pre>
          </div>
        ) : part.content.trim() ? (
          <p className={`${styles.questionText} type-body`} key={`text-${index}`}>{part.content}</p>
        ) : null
      ))}

      {normalizeCodeBlocks(question).map((block, index) => (
        <div className={styles.codeWrap} key={`${block.key}-${index}`}>
          {block.label && <div className={`${styles.codeLabel} type-small`}>{block.label}</div>}
          <pre className={`${styles.codeBlock} type-small`}>{block.code}</pre>
        </div>
      ))}
    </div>
  );
}

// 네 문제 유형별 답안 입력과 상태 반영
function QuestionCard({
  question,
  index,
  answer,
  onChange,
}: {
  question: QuizQuestion;
  index: number;
  answer: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  const selected = Array.isArray(answer) ? answer : [];

  return (
    <section className={styles.questionCard} aria-labelledby={`quiz-question-${index}`}>
      <header className={styles.questionHeader}>
        <strong className="type-body" id={`quiz-question-${index}`}>{index + 1}번</strong>
        <span className={`${styles.questionType} type-small`}>{getTypeLabel(question.type)}</span>
      </header>

      <QuestionContent question={question} />

      {(question.type === "single" || question.type === "multiple") && (
        <div className={styles.choiceList}>
          {question.choices?.map((choice, choiceIndex) => {
            const value = String(choiceIndex + 1);
            const checked = selected.includes(value);

            return (
              <label className={styles.choiceItem} key={`${index}-${choiceIndex}`}>
                <input
                  type={question.type === "multiple" ? "checkbox" : "radio"}
                  name={`question_${index}`}
                  value={value}
                  checked={checked}
                  onChange={(event) => {
                    if (question.type === "single") {
                      onChange([value]);
                      return;
                    }

                    onChange(event.currentTarget.checked
                      ? [...selected, value]
                      : selected.filter((item) => item !== value));
                  }}
                />
                <span className="type-body">{choiceIndex + 1}. {choice}</span>
              </label>
            );
          })}
        </div>
      )}

      {(question.type === "short" || question.type === "essay") && (
        <label className={styles.answerField}>
          <span className="type-small">{question.type === "essay" ? "서술형 답안" : "단답형 답안"}</span>
          {question.type === "essay" ? (
            <textarea
              className={`${styles.answerTextArea} type-body`}
              rows={Number(question.rows || 8)}
              placeholder={question.placeholder || "자유롭게 서술하세요"}
              value={typeof answer === "string" ? answer : ""}
              onChange={(event) => onChange(event.currentTarget.value)}
            />
          ) : (
            <input
              className={`${styles.answerInput} type-body`}
              type="text"
              placeholder={question.placeholder || "답을 입력하세요"}
              value={typeof answer === "string" ? answer : ""}
              onChange={(event) => onChange(event.currentTarget.value)}
            />
          )}
        </label>
      )}
    </section>
  );
}

// 기존 QuizPage 기능을 Portfolio Tools Theme으로 이식한 화면
export default function QuizScreen() {
  const { hasTool } = useToolsSession();
  const [jsonInput, setJsonInput] = useState("");
  const [exam, setExam] = useState<QuizExam | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [loadStatus, setLoadStatus] = useState<Status>({ message: "" });
  const [copyStatus, setCopyStatus] = useState<Status>({ message: "" });
  const preview = useMemo(() => exam ? buildAnswerText(exam, answers) : "", [answers, exam]);

  if (!hasTool("QUIZ")) {
    return (
      <main className={styles.toolsPage}>
        <div className="content-container">
          <header className={styles.pageHeader}><h1 className="type-heading">Quiz</h1></header>
          <div className={styles.emptyState}>
            <h2 className="type-title">요청한 Tool을 찾을 수 없습니다</h2>
            <p className="type-body">현재 사용할 수 있는 Tool 목록을 확인해 주세요.</p>
          </div>
        </div>
      </main>
    );
  }

  // 입력 JSON 검증과 문제 Workspace 교체
  const handleLoad = () => {
    try {
      const parsedExam = parseExamJson(jsonInput);
      setExam(parsedExam);
      setAnswers({});
      setCopyStatus({ message: "" });
      setLoadStatus({ message: "문제를 정상적으로 불러왔습니다.", success: true });
    } catch (error) {
      setExam(null);
      setAnswers({});
      setLoadStatus({
        message: `불러오기 실패: ${error instanceof Error ? error.message : "JSON 내용을 확인하세요."}`,
      });
    }
  };

  // 입력·문제·답안·상태 전체 초기화
  const handleReset = () => {
    setJsonInput("");
    setExam(null);
    setAnswers({});
    setLoadStatus({ message: "" });
    setCopyStatus({ message: "" });
  };

  const handlePromptCopy = async () => {
    try {
      await copyText(QUIZ_PROMPT);
      setLoadStatus({ message: "GPT 문제 생성 지시문을 복사했습니다.", success: true });
    } catch {
      setLoadStatus({ message: "복사 실패: 브라우저 권한을 확인하세요." });
    }
  };

  const handleAnswerCopy = async () => {
    if (!exam) {
      setCopyStatus({ message: "먼저 문제를 불러오세요." });
      return;
    }

    try {
      await copyText(buildAnswerText(exam, answers));
      setCopyStatus({ message: "문항 포함 답안을 복사했습니다.", success: true });
    } catch {
      setCopyStatus({ message: "복사 실패: 브라우저 권한을 확인하세요." });
    }
  };

  return (
    <main className={styles.toolsPage}>
      <div className="content-container">
        <header className={styles.pageHeader}>
          <h1 className="type-heading">Quiz</h1>
        </header>

        <section className={styles.quizInputSection} aria-labelledby="quiz-json-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 className="type-title" id="quiz-json-title">JSON Input</h2>
              <p className="type-body">문제 JSON을 브라우저에서 직접 불러옵니다.</p>
            </div>
          </div>
          <textarea
            className={`${styles.textArea} type-body`}
            aria-label="문제 JSON"
            spellCheck={false}
            value={jsonInput}
            onChange={(event) => setJsonInput(event.currentTarget.value)}
          />
          <div className={styles.actionBar} aria-label="Quiz 작업">
            <button className={`${styles.primaryButton} type-body`} type="button" onClick={handleLoad}>
              <FileJson aria-hidden="true" />
              문제 불러오기
            </button>
            <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => void handlePromptCopy()}>
              <Copy aria-hidden="true" />
              GPT 문제 생성 지시문 복사
            </button>
            <button className={`${styles.secondaryButton} type-body`} type="button" onClick={handleReset}>
              <Eraser aria-hidden="true" />
              전체 초기화
            </button>
          </div>
          <p className={`${styles.formatHelp} type-small`}>
            single · multiple · short · essay · 문제 본문 codeBlocks 지원
          </p>
          <p
            className={`${styles.statusMessage} ${loadStatus.success ? styles.statusSuccess : ""} type-small`}
            role="status"
            aria-live="polite"
          >
            {loadStatus.message}
          </p>
        </section>

        {exam && (
          <div className={styles.quizWorkspace}>
            <div className={styles.questionColumn}>
              <section className={styles.quizSummary} aria-labelledby="quiz-exam-title">
                <div className={styles.examHeading}>
                  <div>
                    <h2 className="type-title" id="quiz-exam-title">{exam.title || "문제 세트"}</h2>
                    <p className="type-body">
                      {[exam.description || "", `총 ${exam.questions.length}문항`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => void handleAnswerCopy()}>
                    <Copy aria-hidden="true" />
                    문항 포함 답안 복사
                  </button>
                </div>
                <p
                  className={`${styles.statusMessage} ${copyStatus.success ? styles.statusSuccess : ""} type-small`}
                  role="status"
                  aria-live="polite"
                >
                  {copyStatus.message}
                </p>
              </section>

              <div className={styles.listHeading}>
                <h2 className="type-title">Question List</h2>
              </div>
              <div className={styles.questionList}>
                {exam.questions.map((question, index) => (
                  <QuestionCard
                    key={`${String(question.id || index + 1)}-${index}`}
                    question={question}
                    index={index}
                    answer={answers[index]}
                    onChange={(value) => setAnswers((current) => ({ ...current, [index]: value }))}
                  />
                ))}
              </div>
            </div>

            <aside className={styles.answerPanel} aria-labelledby="answer-preview-title">
              <h2 className="type-title" id="answer-preview-title">Answer Preview</h2>
              <textarea
                className={`${styles.answerPreview} type-body`}
                aria-label="현재 답안 미리보기"
                value={preview}
                readOnly
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
