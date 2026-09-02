"use client";

import { Copy, Eraser, FileJson, FolderOpen, Save, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/features/admin/confirm-dialog";
import DialogFrame from "@/features/admin/dialog-frame";
import { formatApiError } from "@/lib/api/client";
import type { QuizSummary } from "@/types/api";
import {
  buildAnswerText,
  getTypeLabel,
  normalizeCodeBlocks,
  parseExamJson,
  parseFencedCode,
  restoreQuizAnswers,
  type QuizAnswers,
  type QuizExam,
  type QuizQuestion,
} from "./quiz-model";
import { QUIZ_PROMPT } from "./quiz-prompt";
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  getQuizzes,
  updateQuiz,
} from "./tools-api";
import { useToolsSession } from "./tools-shell";
import styles from "./tools.module.css";

type Status = {
  message: string;
  success?: boolean;
};

type QuizConfirmation =
  | { kind: "replace-json" }
  | { kind: "restore"; quizId: number; title: string }
  | { kind: "delete"; quizId: number; title: string };

type SaveStatus = "unsaved" | "saved" | "changes" | "saving" | "error";

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  unsaved: "저장되지 않음",
  saved: "저장됨",
  changes: "변경사항 있음",
  saving: "저장 중",
  error: "저장 실패",
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
    if (!document.execCommand("copy")) {
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
            {part.language ? <div className={`${styles.codeLabel} type-small`}>{part.language}</div> : null}
            <pre className={`${styles.codeBlock} type-small`}>{part.content}</pre>
          </div>
        ) : part.content.trim() ? (
          <p className={`${styles.questionText} type-body`} key={`text-${index}`}>{part.content}</p>
        ) : null
      ))}

      {normalizeCodeBlocks(question).map((block, index) => (
        <div className={styles.codeWrap} key={`${block.key}-${index}`}>
          {block.label ? <div className={`${styles.codeLabel} type-small`}>{block.label}</div> : null}
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

      {(question.type === "single" || question.type === "multiple") ? (
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
      ) : null}

      {(question.type === "short" || question.type === "essay") ? (
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
      ) : null}
    </section>
  );
}

// 최근 수정순 저장 Quiz 목록과 상세·삭제 동작 Dialog
function SavedQuizDialog({
  open,
  quizzes,
  loading,
  actionQuizId,
  error,
  onClose,
  onLoad,
  onDelete,
}: {
  open: boolean;
  quizzes: QuizSummary[];
  loading: boolean;
  actionQuizId: number | null;
  error: string;
  onClose: () => void;
  onLoad: (quizId: number) => void;
  onDelete: (quizId: number) => void;
}) {
  return (
    <DialogFrame open={open} title="저장된 문제" description="최근 수정한 순서" onClose={onClose}>
      {loading ? <p className="type-body" aria-busy="true">목록을 불러오는 중입니다.</p> : null}
      {!loading && quizzes.length === 0 && !error ? (
        <div className={styles.savedQuizEmpty}>
          <p className="type-body">저장된 문제가 없습니다.</p>
        </div>
      ) : null}
      {quizzes.length > 0 ? (
        <ol className={styles.savedQuizList} aria-busy={actionQuizId !== null}>
          {quizzes.map((quiz) => (
            <li className={styles.savedQuizItem} key={quiz.id}>
              <button
                className={styles.savedQuizLoad}
                type="button"
                onClick={() => onLoad(quiz.id)}
                disabled={actionQuizId !== null}
              >
                <strong className="type-body">{quiz.title}</strong>
                <span className="type-small">{new Date(quiz.updatedAt).toLocaleString("ko-KR")}</span>
              </button>
              <button
                className={styles.savedQuizDelete}
                type="button"
                aria-label={`${quiz.title} 삭제`}
                onClick={() => onDelete(quiz.id)}
                disabled={actionQuizId !== null}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <p className={`${styles.inlineError} type-small`} role="alert" aria-live="polite">{error}</p>
    </DialogFrame>
  );
}

// 기존 Quiz Engine과 개인 저장 Workspace를 결합한 화면
export default function QuizScreen() {
  const { hasTool } = useToolsSession();
  const [jsonInput, setJsonInput] = useState("");
  const [quizJson, setQuizJson] = useState<unknown | null>(null);
  const [exam, setExam] = useState<QuizExam | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [savedQuizId, setSavedQuizId] = useState<number | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("unsaved");
  const [saveError, setSaveError] = useState("");
  const [loadStatus, setLoadStatus] = useState<Status>({ message: "" });
  const [copyStatus, setCopyStatus] = useState<Status>({ message: "" });
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState<QuizSummary[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [actionQuizId, setActionQuizId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<QuizConfirmation | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmInFlight = useRef(false);
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

  const markChanged = () => {
    setDirty(true);
    setSaveStatus(savedQuizId === null ? "unsaved" : "changes");
    setSaveError("");
  };

  // 기존 Parser 검증 후 신규 미저장 Workspace 교체
  const loadJson = () => {
    try {
      const parsedExam = parseExamJson(jsonInput);
      const parsedJson: unknown = JSON.parse(jsonInput);
      setQuizJson(parsedJson);
      setExam(parsedExam);
      setAnswers({});
      setSavedQuizId(null);
      setSavedTitle(parsedExam.title?.trim() ?? "");
      setDirty(true);
      setSaveStatus("unsaved");
      setSaveError("");
      setCopyStatus({ message: "" });
      setLoadStatus({ message: "문제를 정상적으로 불러왔습니다.", success: true });
    } catch (caught) {
      setLoadStatus({
        message: `불러오기 실패: ${caught instanceof Error ? caught.message : "JSON 내용을 확인하세요."}`,
      });
    }
  };

  // 미저장 Workspace가 있을 때 사이트 확인 Dialog 우선 표시
  const handleLoad = () => {
    if (exam && dirty) {
      setConfirmation({ kind: "replace-json" });
      return;
    }
    loadJson();
  };

  // 입력·문제·답안·저장 상태 전체 초기화
  const handleReset = () => {
    setJsonInput("");
    setQuizJson(null);
    setExam(null);
    setAnswers({});
    setSavedQuizId(null);
    setSavedTitle("");
    setDirty(false);
    setSaveStatus("unsaved");
    setSaveError("");
    setLoadStatus({ message: "" });
    setCopyStatus({ message: "" });
  };

  // 신규 POST 또는 기존 ID PATCH 기반 Workspace 저장
  const handleSave = async () => {
    if (!exam || quizJson === null) {
      setSaveError("먼저 문제를 불러오세요.");
      setSaveStatus("error");
      return;
    }
    const title = savedTitle.trim();
    if (!title) {
      setSaveError("저장 제목을 입력해 주세요.");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    setSaveError("");
    try {
      const payload = { title, quizJson, responseJson: answers };
      const saved = savedQuizId === null
        ? await createQuiz(payload)
        : await updateQuiz(savedQuizId, payload);
      setSavedQuizId(saved.id);
      setSavedTitle(saved.title);
      setDirty(false);
      setSaveStatus("saved");
    } catch (caught) {
      setDirty(true);
      setSaveStatus("error");
      setSaveError(formatApiError(caught));
    }
  };

  // 저장 Quiz 목록 Dialog 진입과 최근 수정순 조회
  const handleOpenSaved = async () => {
    setSavedOpen(true);
    setSavedLoading(true);
    setSavedError("");
    try {
      const response = await getQuizzes();
      setSavedQuizzes(response.items);
    } catch (caught) {
      setSavedError(formatApiError(caught));
    } finally {
      setSavedLoading(false);
    }
  };

  // 저장 Quiz 상세의 기존 Parser·답안 구조 기반 안전 복원
  const restoreQuiz = async (quizId: number) => {
    setActionQuizId(quizId);
    setSavedError("");
    try {
      const saved = await getQuiz(quizId);
      const raw = JSON.stringify(saved.quizJson, null, 2);
      if (!raw) {
        throw new Error("저장된 문제 JSON이 올바르지 않습니다.");
      }
      const parsedExam = parseExamJson(raw);
      const restoredAnswers = restoreQuizAnswers(parsedExam, saved.responseJson);

      setJsonInput(raw);
      setQuizJson(saved.quizJson);
      setExam(parsedExam);
      setAnswers(restoredAnswers);
      setSavedQuizId(saved.id);
      setSavedTitle(saved.title);
      setDirty(false);
      setSaveStatus("saved");
      setSaveError("");
      setLoadStatus({ message: "저장된 문제를 불러왔습니다.", success: true });
      setCopyStatus({ message: "" });
      setSavedOpen(false);
      return true;
    } catch (caught) {
      setSavedError(caught instanceof SyntaxError || caught instanceof Error && !("status" in caught)
        ? caught.message
        : formatApiError(caught));
      return false;
    } finally {
      setActionQuizId(null);
    }
  };

  // 저장 Quiz 삭제와 열린 Workspace의 미저장 전환
  const removeQuiz = async (quizId: number) => {
    setActionQuizId(quizId);
    setSavedError("");
    try {
      await deleteQuiz(quizId);
      setSavedQuizzes((current) => current.filter((quiz) => quiz.id !== quizId));
      if (savedQuizId === quizId) {
        setSavedQuizId(null);
        setDirty(true);
        setSaveStatus("unsaved");
        setSaveError("");
      }
      return true;
    } catch (caught) {
      setSavedError(formatApiError(caught));
      return false;
    } finally {
      setActionQuizId(null);
    }
  };

  const requestRestore = (quizId: number) => {
    if (!dirty) {
      void restoreQuiz(quizId);
      return;
    }
    const quiz = savedQuizzes.find((item) => item.id === quizId);
    setSavedOpen(false);
    setConfirmation({ kind: "restore", quizId, title: quiz?.title ?? "저장된 문제" });
  };

  const requestDelete = (quizId: number) => {
    const quiz = savedQuizzes.find((item) => item.id === quizId);
    setSavedOpen(false);
    setConfirmation({ kind: "delete", quizId, title: quiz?.title ?? "저장된 문제" });
  };

  // 확인 종류별 기존 교체·복원·삭제 흐름 실행
  const confirmAction = async () => {
    if (!confirmation || confirmInFlight.current) {
      return;
    }
    if (confirmation.kind === "replace-json") {
      setConfirmation(null);
      loadJson();
      return;
    }

    confirmInFlight.current = true;
    setConfirmBusy(true);
    const current = confirmation;
    const succeeded = current.kind === "restore"
      ? await restoreQuiz(current.quizId)
      : await removeQuiz(current.quizId);
    confirmInFlight.current = false;
    setConfirmBusy(false);
    setConfirmation(null);
    if (current.kind === "delete" || !succeeded) {
      setSavedOpen(true);
    }
  };

  const cancelConfirmation = () => {
    if (confirmBusy || !confirmation) return;
    const returnToSaved = confirmation.kind !== "replace-json";
    setConfirmation(null);
    if (returnToSaved) setSavedOpen(true);
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

        <div className={styles.quizPersistenceBar} aria-label="Quiz 저장 Toolbar">
          {exam ? (
            <>
              <label className={styles.quizTitleField}>
                <span className="type-small">저장 제목</span>
                <input
                  className="type-body"
                  value={savedTitle}
                  onChange={(event) => {
                    setSavedTitle(event.currentTarget.value);
                    markChanged();
                  }}
                />
              </label>
              <span className={`${styles.saveStatus} type-small`} data-save-status={saveStatus}>
                {SAVE_STATUS_LABELS[saveStatus]}
              </span>
              <button
                className={`${styles.primaryButton} type-body`}
                type="button"
                onClick={() => void handleSave()}
                disabled={saveStatus === "saving"}
              >
                <Save aria-hidden="true" /> 저장
              </button>
            </>
          ) : null}
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => void handleOpenSaved()}>
            <FolderOpen aria-hidden="true" /> 저장된 문제
          </button>
          {saveError ? <span className={`${styles.inlineError} type-small`} role="alert">{saveError}</span> : null}
        </div>

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
              <FileJson aria-hidden="true" /> 문제 불러오기
            </button>
            <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => void handlePromptCopy()}>
              <Copy aria-hidden="true" /> GPT 문제 생성 지시문 복사
            </button>
            <button className={`${styles.secondaryButton} type-body`} type="button" onClick={handleReset}>
              <Eraser aria-hidden="true" /> 전체 초기화
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

        {exam ? (
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
                    <Copy aria-hidden="true" /> 문항 포함 답안 복사
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

              <div className={styles.listHeading}><h2 className="type-title">Question List</h2></div>
              <div className={styles.questionList}>
                {exam.questions.map((question, index) => (
                  <QuestionCard
                    key={`${String(question.id || index + 1)}-${index}`}
                    question={question}
                    index={index}
                    answer={answers[index]}
                    onChange={(value) => {
                      setAnswers((current) => ({ ...current, [index]: value }));
                      markChanged();
                    }}
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
        ) : null}
      </div>

      <SavedQuizDialog
        open={savedOpen}
        quizzes={savedQuizzes}
        loading={savedLoading}
        actionQuizId={actionQuizId}
        error={savedError}
        onClose={() => setSavedOpen(false)}
        onLoad={requestRestore}
        onDelete={requestDelete}
      />
      <ConfirmDialog
        open={confirmation !== null}
        title={confirmation?.kind === "delete" ? "저장된 문제 삭제" : "문제 교체"}
        description={confirmation?.kind === "replace-json"
          ? "저장하지 않은 변경사항을 새 JSON으로 교체할까요?"
          : confirmation?.kind === "restore"
            ? "저장하지 않은 변경사항을 선택한 문제로 교체할까요?"
            : "저장된 문제를 삭제할까요?"}
        detail={confirmation && confirmation.kind !== "replace-json" ? confirmation.title : undefined}
        confirmLabel={confirmation?.kind === "delete" ? "삭제" : "교체"}
        danger={confirmation?.kind === "delete"}
        busy={confirmBusy}
        onCancel={cancelConfirmation}
        onConfirm={confirmAction}
      />
    </main>
  );
}
