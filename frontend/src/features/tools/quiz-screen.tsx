"use client";

import { Copy, Eraser, FileJson, PanelLeftClose, PanelLeftOpen, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Button from "@/components/ui/button";
import { NotificationProvider, useNotification } from "@/components/ui/notification/notification-provider";
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

type QuizConfirmation =
  | { kind: "replace-json" }
  | { kind: "restore"; quizId: number; title: string }
  | { kind: "delete"; quizId: number; title: string };

type SaveStatus = "unsaved" | "saved" | "changes" | "saving" | "error";

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
function QuestionContent({
  question,
  parts,
  promptIndex,
}: {
  question: QuizQuestion;
  parts: ReturnType<typeof parseFencedCode>;
  promptIndex: number;
}) {
  return (
    <div className={styles.questionParts}>
      {parts.map((part, index) => (
        index === promptIndex ? null : (
        part.type === "code" ? (
          <div className={styles.codeWrap} key={`inline-${index}`}>
            {part.language ? <div className={`${styles.codeLabel} type-small`}>{part.language}</div> : null}
            <pre className={`${styles.codeBlock} type-small`}>{part.content}</pre>
          </div>
        ) : part.content.trim() ? (
          <p className={`${styles.questionText} type-body`} key={`text-${index}`}>{part.content}</p>
        ) : null
        )
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
  const questionParts = parseFencedCode(question.question);
  const promptIndex = questionParts.findIndex((part) => part.type === "text" && part.content.trim());
  const prompt = promptIndex >= 0 ? questionParts[promptIndex].content.trim() : question.question;

  return (
    <section className={styles.questionCard} aria-labelledby={`quiz-question-${index}-prompt`}>
      <header className={styles.questionHeader}>
        <strong className={`${styles.questionNumber} type-body`}>{String(index + 1).padStart(2, "0")}.</strong>
        <p className={`${styles.questionPrompt} type-body`} id={`quiz-question-${index}-prompt`}>{prompt}</p>
        <span className={`${styles.questionType} type-small`}>{getTypeLabel(question.type)}</span>
      </header>

      <QuestionContent question={question} parts={questionParts} promptIndex={promptIndex} />

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

// 화면 폭 기반 Sidebar 표현 방식 판별
function useViewportMatch(query: string, fallback: boolean) {
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);
    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}

// Desktop Sidebar와 Compact Drawer가 함께 사용하는 저장 문제 이력
function SavedQuizHistory({
  drawer,
  open = true,
  collapsed = false,
  currentQuizId,
  quizzes,
  loading,
  loaded,
  actionQuizId,
  onClose,
  onLoad,
  onDelete,
}: {
  drawer: boolean;
  open?: boolean;
  collapsed?: boolean;
  currentQuizId: number | null;
  quizzes: QuizSummary[];
  loading: boolean;
  loaded: boolean;
  actionQuizId: number | null;
  onClose: () => void;
  onLoad: (quizId: number) => void;
  onDelete: (quizId: number) => void;
}) {
  return (
    <aside
      aria-label="저장된 문제"
      aria-hidden={collapsed || drawer && !open ? true : undefined}
      className={`${styles.quizHistory} ${collapsed ? styles.quizHistoryCollapsed : ""} ${drawer && open ? styles.quizHistoryOpen : ""}`}
      id="quiz-history"
      inert={collapsed || drawer && !open}
      tabIndex={-1}
    >
      <header className={styles.quizHistoryHeader}>
        <h2 className={`${styles.quizHistoryTitle} type-small`}>저장된 문제</h2>
        {drawer ? (
          <button className={styles.quizHistoryClose} type="button" aria-label="저장된 문제 닫기" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        ) : null}
      </header>
      {loading ? <p className="type-body" aria-busy="true">목록을 불러오는 중입니다.</p> : null}
      {!loading && loaded && quizzes.length === 0 ? (
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
                aria-current={currentQuizId === quiz.id ? "page" : undefined}
              >
                <span className={`${styles.savedQuizTitle} type-small`}>{quiz.title}</span>
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
    </aside>
  );
}

// 기존 Quiz Engine과 개인 저장 Workspace를 결합한 화면
export default function QuizScreen() {
  const { isProviderMounted } = useNotification();

  return isProviderMounted ? <QuizScreenContent /> : <NotificationProvider><QuizScreenContent /></NotificationProvider>;
}

function QuizScreenContent() {
  const { hasTool } = useToolsSession();
  const { notify } = useNotification();
  const quizEnabled = hasTool("QUIZ");
  const [jsonInput, setJsonInput] = useState("");
  const [quizJson, setQuizJson] = useState<unknown | null>(null);
  const [exam, setExam] = useState<QuizExam | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [savedQuizId, setSavedQuizId] = useState<number | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("unsaved");
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState<QuizSummary[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedListLoaded, setSavedListLoaded] = useState(false);
  const [actionQuizId, setActionQuizId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<QuizConfirmation | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const confirmInFlight = useRef(false);
  const compactHistoryToggle = useRef<HTMLButtonElement | null>(null);
  const restoreHistoryFocus = useRef(false);
  const isDesktop = useViewportMatch("(min-width: 1024px)", true);
  const preview = useMemo(() => exam ? buildAnswerText(exam, answers) : "", [answers, exam]);

  // Quiz 진입과 저장 직후 최근 수정순 이력 갱신
  const loadSavedQuizzes = useCallback(async () => {
    setSavedLoading(true);
    try {
      const response = await getQuizzes();
      setSavedQuizzes(response.items);
      setSavedListLoaded(true);
    } catch (caught) {
      setSavedListLoaded(false);
      notify({ type: "error", title: "저장 목록 불러오기 실패", message: formatApiError(caught) });
    } finally {
      setSavedLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (quizEnabled) {
      void Promise.resolve().then(loadSavedQuizzes);
    }
  }, [quizEnabled, loadSavedQuizzes]);

  // Desktop 전환 시 Compact Drawer 종료
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeDrawerOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setHistoryOpen(false);
    };
    desktopQuery.addEventListener("change", closeDrawerOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeDrawerOnDesktop);
  }, []);

  // Tablet·Mobile 이력 Drawer의 Escape 종료와 배경 Scroll 잠금
  useEffect(() => {
    if (!historyOpen || isDesktop) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    document.getElementById("quiz-history")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      restoreHistoryFocus.current = true;
    };
  }, [historyOpen, isDesktop]);

  // Drawer 종료 후 원래 열기 Control로 포커스 복원
  useEffect(() => {
    if (historyOpen || !restoreHistoryFocus.current) return;

    compactHistoryToggle.current?.focus();
    restoreHistoryFocus.current = false;
  }, [historyOpen]);

  if (!quizEnabled) {
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
      notify({ type: "success", title: "문제 불러오기 완료", message: "문제를 정상적으로 불러왔습니다." });
    } catch (caught) {
      notify({ type: "error", title: "문제 불러오기 실패", message: caught instanceof Error ? caught.message : "JSON 내용을 확인하세요." });
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
  };

  // 신규 POST 또는 기존 ID PATCH 기반 Workspace 저장
  const handleSave = async () => {
    if (!exam || quizJson === null) {
      setSaveStatus("error");
      notify({ type: "error", title: "저장할 수 없음", message: "먼저 문제를 불러오세요." });
      return;
    }
    const title = savedTitle.trim();
    if (!title) {
      setSaveStatus("error");
      notify({ type: "error", title: "저장할 수 없음", message: "저장 제목을 입력해 주세요." });
      return;
    }

    setSaveStatus("saving");
    try {
      const payload = { title, quizJson, responseJson: answers };
      const saved = savedQuizId === null
        ? await createQuiz(payload)
        : await updateQuiz(savedQuizId, payload);
      setSavedQuizId(saved.id);
      setSavedTitle(saved.title);
      setDirty(false);
      setSaveStatus("saved");
      notify({ type: "success", title: "저장 완료", message: `“${saved.title}”을 저장했습니다.` });
      void loadSavedQuizzes();
    } catch (caught) {
      setDirty(true);
      setSaveStatus("error");
      notify({ type: "error", title: "저장 실패", message: formatApiError(caught) });
    }
  };

  // 저장 Quiz 상세의 기존 Parser·답안 구조 기반 안전 복원
  const restoreQuiz = async (quizId: number) => {
    setActionQuizId(quizId);
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
      notify({ type: "info", title: "불러오기 완료", message: `“${saved.title}”을 불러왔습니다.` });
      setHistoryOpen(false);
      return true;
    } catch (caught) {
      notify({ type: "error", title: "문제 불러오기 실패", message: caught instanceof SyntaxError || caught instanceof Error && !("status" in caught)
        ? caught.message
        : formatApiError(caught) });
      return false;
    } finally {
      setActionQuizId(null);
    }
  };

  // 저장 Quiz 삭제와 열린 Workspace의 미저장 전환
  const removeQuiz = async (quizId: number) => {
    setActionQuizId(quizId);
    const deletedTitle = savedQuizzes.find((quiz) => quiz.id === quizId)?.title ?? "저장된 문제";
    try {
      await deleteQuiz(quizId);
      setSavedQuizzes((current) => current.filter((quiz) => quiz.id !== quizId));
      if (savedQuizId === quizId) {
        setSavedQuizId(null);
        setDirty(true);
        setSaveStatus("unsaved");
      }
      notify({ type: "success", title: "삭제 완료", message: `“${deletedTitle}”을 삭제했습니다.` });
      return true;
    } catch (caught) {
      notify({ type: "error", title: "삭제 실패", message: formatApiError(caught) });
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
    setConfirmation({ kind: "restore", quizId, title: quiz?.title ?? "저장된 문제" });
  };

  const requestDelete = (quizId: number) => {
    const quiz = savedQuizzes.find((item) => item.id === quizId);
    setConfirmation({ kind: "delete", quizId, title: quiz?.title ?? "저장된 문제" });
  };

  // Tablet·Mobile Drawer 열기와 저장 목록 최신화
  const openHistoryDrawer = () => {
    setHistoryOpen(true);
    void loadSavedQuizzes();
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
    if (!isDesktop && (current.kind === "delete" || !succeeded)) setHistoryOpen(true);
  };

  const cancelConfirmation = () => {
    if (confirmBusy || !confirmation) return;
    setConfirmation(null);
    if (!isDesktop && confirmation.kind !== "replace-json") setHistoryOpen(true);
  };

  const handlePromptCopy = async () => {
    try {
      await copyText(QUIZ_PROMPT);
      notify({ type: "success", title: "복사 완료", message: "GPT 문제 생성 지시문을 복사했습니다." });
    } catch {
      notify({ type: "error", title: "복사 실패", message: "브라우저 권한을 확인하세요." });
    }
  };

  const handleAnswerCopy = async () => {
    if (!exam) {
      notify({ type: "error", title: "복사할 수 없음", message: "먼저 문제를 불러오세요." });
      return;
    }
    try {
      await copyText(buildAnswerText(exam, answers));
      notify({ type: "success", title: "복사 완료", message: "문항 포함 답안을 복사했습니다." });
    } catch {
      notify({ type: "error", title: "복사 실패", message: "브라우저 권한을 확인하세요." });
    }
  };

  return (
    <main className={`${styles.toolsPage} ${styles.quizPage}`}>
      <div className={`${styles.quizLayout} ${isDesktop && historyCollapsed ? styles.quizLayoutCollapsed : ""}`}>
          {isDesktop ? (
            <SavedQuizHistory
              drawer={false}
              collapsed={historyCollapsed}
              currentQuizId={savedQuizId}
              quizzes={savedQuizzes}
              loading={savedLoading}
              loaded={savedListLoaded}
              actionQuizId={actionQuizId}
              onClose={() => setHistoryOpen(false)}
              onLoad={requestRestore}
              onDelete={requestDelete}
            />
          ) : null}
          {!isDesktop ? (
            <>
              <button
                aria-hidden={!historyOpen}
                className={`${styles.quizHistoryBackdrop} ${historyOpen ? styles.quizHistoryBackdropOpen : ""}`}
                tabIndex={historyOpen ? undefined : -1}
                type="button"
                aria-label="저장된 문제 닫기"
                onClick={() => setHistoryOpen(false)}
              />
              <SavedQuizHistory
                drawer
                open={historyOpen}
                currentQuizId={savedQuizId}
                quizzes={savedQuizzes}
                loading={savedLoading}
                loaded={savedListLoaded}
                actionQuizId={actionQuizId}
                onClose={() => setHistoryOpen(false)}
                onLoad={requestRestore}
                onDelete={requestDelete}
              />
            </>
          ) : null}

          <div className={styles.quizMain}>
            <div className={styles.quizContent}>
              <header className={`${styles.pageHeader} ${styles.quizPageHeader}`}>
                <div className={styles.quizPageHeaderInner}>
                  <h1 className="type-heading">Quiz</h1>
                  {isDesktop ? (
                    <button
                      aria-controls="quiz-history"
                      aria-expanded={isDesktop ? !historyCollapsed : historyOpen}
                      aria-label={isDesktop && !historyCollapsed ? "저장된 문제 사이드바 닫기" : "저장된 문제 사이드바 열기"}
                      className={styles.historyHeaderToggle}
                      type="button"
                      onClick={() => {
                        if (isDesktop) {
                          setHistoryCollapsed((collapsed) => !collapsed);
                        }
                      }}
                    >
                      {isDesktop && !historyCollapsed ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
                    </button>
                  ) : null}
                </div>
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
                {exam ? (
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
                ) : null}
                <div className={styles.actionBar} role="group" aria-label="Quiz 작업">
                  <Button type="button" onClick={handleLoad}>
                    <FileJson aria-hidden="true" /> 문제 불러오기
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => void handlePromptCopy()}>
                    <Copy aria-hidden="true" /> GPT 문제 생성 지시문 복사
                  </Button>
                  <Button variant="secondary" type="button" onClick={handleReset}>
                    <Eraser aria-hidden="true" /> 전체 초기화
                  </Button>
                  {exam ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={saveStatus === "saving"}
                      >
                        <Save aria-hidden="true" /> 저장
                      </Button>
                    </>
                  ) : null}
                </div>
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
                  <Button variant="secondary" type="button" onClick={() => void handleAnswerCopy()}>
                    <Copy aria-hidden="true" /> 문항 포함 답안 복사
                  </Button>
                </div>
                    </section>

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

                  <details className={styles.answerPanel} open>
                    <summary className={styles.answerPanelHeading}>
                      <h2 className="type-title">Answer Preview</h2>
                    </summary>
                    <textarea
                      className={`${styles.answerPreview} type-body`}
                      aria-label="현재 답안 미리보기"
                      value={preview}
                      readOnly
                    />
                  </details>
                </div>
              ) : null}
            </div>
          </div>
      </div>
      {!isDesktop && !historyOpen ? (
        <button
          aria-controls="quiz-history"
          aria-expanded={historyOpen}
          aria-label="저장된 문제 사이드바 열기"
          className={styles.compactHistoryToggle}
          ref={compactHistoryToggle}
          type="button"
          onClick={openHistoryDrawer}
        >
          <PanelLeftOpen aria-hidden="true" />
        </button>
      ) : null}
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
