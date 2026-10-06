"use client";

import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { PillLoader } from "@/components/atoms/PillLoader";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Columns2,
  Flag,
  ListChecks,
  MonitorCheck,
  Play,
  RotateCcw,
  Save,
  StickyNote,
  Table2,
  TriangleAlert,
  X,
} from "lucide-react";

import { PracticeHeader } from "@/components/molecules";
import { completeDailyQuest } from "@/lib/client/dailyQuest";
import { cn } from "@/lib/utils";
import { useRouter } from "@/lib/navigation";
import { isTutorialCbtReview, saveCbtReview } from "@/lib/review/collections";
import type {
  CbtExamQuestion,
  CbtGradeResult,
  CbtLayoutMode,
  CbtPracticeSet,
  CbtSessionId,
  CbtSessionSummary,
} from "@/types/cbt";

import { CbtTutorialOverlay } from "./CbtTutorialOverlay";
import { CBT_TUTORIAL_STEPS } from "./tutorialSteps";

type Stage =
  | "hub"
  | "session-select"
  | "exam-info"
  | "device-check"
  | "consent"
  | "ready"
  | "player"
  | "full-waiting"
  | "result"
  | "review";
type TimeMode = "real" | "quick";
type AttemptStatus =
  | "READY"
  | "RUNNING"
  | "SUBMITTING"
  | "WAITING"
  | "RECOVERY_REQUIRED"
  | "COMPLETED";
type SaveStatus = "saved" | "saving" | "offline" | "failed";
type ListFilter = "all" | "flagged" | "unanswered";
type PendingAction = "session" | "tutorial" | "full";

type AnswerState = {
  selectedChoice: number | null;
  flagged: boolean;
  unknown: boolean;
  memo: string;
  excludedChoices: number[];
  revision: number;
  updatedAt: string;
};

type LocalAttempt = {
  version: 4;
  attemptId: string;
  mode: "session" | "tutorial" | "full";
  templateId: string;
  title: string;
  session: CbtSessionSummary;
  questions: CbtExamQuestion[];
  status: AttemptStatus;
  startedAt: number;
  deadlineAt: number;
  durationSec: number;
  currentQuestionId: string;
  answers: Record<string, AnswerState>;
  fontScale: 80 | 100 | 125;
  layoutMode: CbtLayoutMode;
  warningShownAt300: number | null;
  consentVersion: string;
  consentedAt: string;
  submissionReason?: "USER_SUBMITTED" | "TIME_EXPIRED";
  fullSessionIndex?: number;
  fullResults?: CbtGradeResult[];
  breakEndsAt?: number;
};

type QuestionTypography = {
  meta: string;
  heading: string;
  badge: string;
  stem: string;
  auxiliaryLabel: string;
  auxiliaryBody: string;
  choiceNumber: string;
  choice: string;
  action: string;
  memo: string;
  counter: string;
};

type StoredAttempt = Omit<
  LocalAttempt,
  "version" | "layoutMode" | "answers"
> & {
  version: 1 | 2 | 3 | 4;
  layoutMode?: CbtLayoutMode;
  scratchpadStrokes?: unknown;
  answers: Record<
    string,
    Omit<AnswerState, "excludedChoices"> & {
      excludedChoices?: number[];
      highlightRanges?: unknown;
      highlightStrokes?: unknown;
    }
  >;
};

const ATTEMPT_STORAGE_KEY = "pillchat:cbt:attempt:v4";
const LEGACY_ATTEMPT_STORAGE_KEYS = [
  "pillchat:cbt:attempt:v3",
  "pillchat:cbt:attempt:v2",
  "pillchat:cbt:attempt:v1",
] as const;
const RESULT_STORAGE_KEY = "pillchat:cbt:recent-result:v2";
const LEGACY_RESULT_STORAGE_KEY = "pillchat:cbt:recent-result:v1";
const CONSENT_VERSION = "2026-07-12";
const QUICK_TIME_RATIO = 0.5;

const FULL_BREAK_DURATION_SEC = [10 * 60, 60 * 60, 10 * 60] as const;

const QUESTION_TYPOGRAPHY: Record<
  LocalAttempt["fontScale"],
  QuestionTypography
> = {
  80: {
    meta: "text-xs",
    heading: "text-lg",
    badge: "text-[0.625rem]",
    stem: "text-[0.9375rem] leading-7",
    auxiliaryLabel: "text-[0.6875rem]",
    auxiliaryBody: "text-xs leading-5",
    choiceNumber: "text-xs",
    choice: "text-sm leading-6",
    action: "text-xs",
    memo: "text-xs",
    counter: "text-[0.6875rem]",
  },
  100: {
    meta: "text-sm",
    heading: "text-xl",
    badge: "text-[0.6875rem]",
    stem: "text-lg leading-8",
    auxiliaryLabel: "text-xs",
    auxiliaryBody: "text-sm leading-6",
    choiceNumber: "text-sm",
    choice: "text-base leading-7",
    action: "text-sm",
    memo: "text-sm",
    counter: "text-xs",
  },
  125: {
    meta: "text-base",
    heading: "text-2xl",
    badge: "text-xs",
    stem: "text-[1.375rem] leading-10",
    auxiliaryLabel: "text-sm",
    auxiliaryBody: "text-base leading-7",
    choiceNumber: "text-base",
    choice: "text-lg leading-8",
    action: "text-base",
    memo: "text-base",
    counter: "text-sm",
  },
};

const SESSION_OPTIONS: CbtSessionSummary[] = [
  {
    id: 1,
    title: "1교시",
    subjectsLabel: "생명약학",
    questionCount: 100,
    durationSec: 90 * 60,
    subjectBreakdown: [{ subject: "생명약학", count: 100 }],
  },
  {
    id: 2,
    title: "2교시",
    subjectsLabel: "산업약학",
    questionCount: 90,
    durationSec: 85 * 60,
    subjectBreakdown: [{ subject: "산업약학", count: 90 }],
  },
  {
    id: 3,
    title: "3교시",
    subjectsLabel: "임상·실무약학1",
    questionCount: 77,
    durationSec: 75 * 60,
    subjectBreakdown: [{ subject: "임상·실무약학1", count: 77 }],
  },
  {
    id: 4,
    title: "4교시",
    subjectsLabel: "임상·실무약학2 · 보건·의약관계법규",
    questionCount: 83,
    durationSec: 75 * 60,
    subjectBreakdown: [
      { subject: "임상·실무약학2", count: 63 },
      { subject: "보건·의약관계법규", count: 20 },
    ],
  },
];

const combineGradeResults = (
  grades: CbtGradeResult[],
  attemptId: string,
): CbtGradeResult => {
  const review = grades.flatMap((grade) => grade.review);
  const scores = new Map<string, CbtGradeResult["scoresBySubject"][number]>();
  grades.forEach((grade) => {
    grade.scoresBySubject.forEach((item) => {
      const previous = scores.get(item.subject) ?? {
        subject: item.subject,
        total: 0,
        correct: 0,
        score: 0,
      };
      const total = previous.total + item.total;
      const correct = previous.correct + item.correct;
      scores.set(item.subject, {
        ...previous,
        total,
        correct,
        score: total ? Math.round((correct / total) * 100) : 0,
      });
    });
  });
  const correct = grades.reduce((sum, grade) => sum + grade.correct, 0);
  const incorrect = grades.reduce((sum, grade) => sum + grade.incorrect, 0);
  const unanswered = grades.reduce((sum, grade) => sum + grade.unanswered, 0);
  const total = correct + incorrect + unanswered;
  return {
    attemptId,
    submittedAt: new Date().toISOString(),
    total,
    correct,
    incorrect,
    unanswered,
    score: total ? Math.round((correct / total) * 100) : 0,
    scoresBySubject: Array.from(scores.values()),
    review,
  };
};

const emptyAnswer = (): AnswerState => ({
  selectedChoice: null,
  flagged: false,
  unknown: false,
  memo: "",
  excludedChoices: [],
  revision: 0,
  updatedAt: new Date().toISOString(),
});

const createAnswers = (questions: CbtExamQuestion[]) =>
  Object.fromEntries(
    questions.map((question) => [question.id, emptyAnswer()]),
  ) as Record<string, AnswerState>;

const formatDuration = (totalSec: number) => {
  const hours = Math.floor(Math.max(0, totalSec) / 3600);
  const minutes = Math.floor((Math.max(0, totalSec) % 3600) / 60);
  const seconds = Math.max(0, totalSec) % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
};

const formatClock = (timestamp: number) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));

const readJson = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const isPersistentAttempt = (
  attempt: LocalAttempt | StoredAttempt | null,
): attempt is LocalAttempt =>
  Boolean(
    attempt &&
      (attempt.mode === "session" || attempt.mode === "full") &&
      attempt.session &&
      attempt.session.id !== "tutorial",
  );

const resumableAttempt = (...candidates: Array<LocalAttempt | null>) =>
  candidates.find(
    (candidate) =>
      isPersistentAttempt(candidate) &&
      ["RUNNING", "SUBMITTING", "WAITING", "RECOVERY_REQUIRED"].includes(
        candidate.status,
      ),
  ) ?? null;

const writeAttempt = (attempt: LocalAttempt) => {
  if (!isPersistentAttempt(attempt)) return;
  window.localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
};

const normalizeStoredAttempt = (stored: StoredAttempt): LocalAttempt => {
  const questions = stored.questions.map((question) => ({
    ...question,
    type: question.type ?? ("single" as const),
    media: Array.isArray(question.media) ? question.media : [],
    caseGroupId: question.caseGroupId ?? null,
  }));
  const { scratchpadStrokes: _scratchpadStrokes, ...currentStored } = stored;
  const answers = Object.fromEntries(
    questions.map((question) => {
      const previous = stored.answers[question.id];
      const {
        highlightRanges: _highlightRanges,
        highlightStrokes: _highlightStrokes,
        ...currentAnswer
      } = previous ?? {};
      return [
        question.id,
        {
          ...emptyAnswer(),
          ...currentAnswer,
          excludedChoices: Array.from(
            new Set(
              (Array.isArray(previous?.excludedChoices)
                ? previous.excludedChoices
                : []
              ).filter(
                (choice) =>
                  Number.isInteger(choice) &&
                  choice >= 0 &&
                  choice <= 4 &&
                  choice !== previous?.selectedChoice,
              ),
            ),
          ),
        },
      ];
    }),
  );

  return {
    ...currentStored,
    version: 4,
    layoutMode: stored.layoutMode ?? "single",
    questions,
    answers,
  };
};

const tryNormalizeStoredAttempt = (stored: StoredAttempt | null) => {
  if (
    !stored ||
    ![1, 2, 3, 4].includes(stored.version) ||
    !Array.isArray(stored.questions) ||
    stored.questions.some(
      (question) =>
        typeof question?.id !== "string" || typeof question?.stem !== "string",
    ) ||
    typeof stored.attemptId !== "string" ||
    !stored.answers ||
    typeof stored.answers !== "object"
  ) {
    return null;
  }
  try {
    return normalizeStoredAttempt(stored);
  } catch {
    return null;
  }
};

const readStoredAttempt = () => {
  const normalized = [ATTEMPT_STORAGE_KEY, ...LEGACY_ATTEMPT_STORAGE_KEYS]
    .map((key) => tryNormalizeStoredAttempt(readJson<StoredAttempt>(key)))
    .find(isPersistentAttempt);
  if (!normalized) return null;
  try {
    writeAttempt(normalized);
    LEGACY_ATTEMPT_STORAGE_KEYS.forEach((key) =>
      window.localStorage.removeItem(key),
    );
  } catch {
    // 복구는 계속 진행하고 다음 저장 시 다시 시도합니다.
  }
  return normalized;
};

export default function CbtPracticePage() {
  return (
    <Suspense fallback={<ReviewLoadingPage />}>
      <CbtPracticeContent />
    </Suspense>
  );
}

function ReviewLoadingPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white p-5">
      <LoadingIndicator
        label="CBT 기록을 불러오는 중..."
        className="text-sm text-muted-foreground"
      />
    </main>
  );
}

function CbtPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReviewEntry = searchParams.get("view") === "review";
  const [stage, setStage] = useState<Stage>(isReviewEntry ? "review" : "hub");
  const [reviewReady, setReviewReady] = useState(false);
  const [preparedSet, setPreparedSet] = useState<CbtPracticeSet | null>(null);
  const [preparedMode, setPreparedMode] = useState<
    "session" | "tutorial" | "full"
  >("session");
  const [timeMode, setTimeMode] = useState<TimeMode>("real");
  const [attempt, setAttempt] = useState<LocalAttempt | null>(null);
  const [recoverableAttempt, setRecoverableAttempt] =
    useState<LocalAttempt | null>(null);
  const [result, setResult] = useState<CbtGradeResult | null>(null);
  const [recentResult, setRecentResult] = useState<CbtGradeResult | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [reviewSaveFailed, setReviewSaveFailed] = useState(false);
  const [saveDelayMs, setSaveDelayMs] = useState(250);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deviceChecks, setDeviceChecks] = useState({
    readable: false,
    touch: false,
  });
  const [consented, setConsented] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [openNoteQuestionId, setOpenNoteQuestionId] = useState<string | null>(
    null,
  );

  const [viewportWidth, setViewportWidth] = useState(1024);
  const isCompact = viewportWidth < 1024;
  const [listOpen, setListOpen] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [undoAnswer, setUndoAnswer] = useState<{
    questionId: string;
    selectedChoice: number;
  } | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"wrong" | "unknown">(
    "wrong",
  );
  const [reviewIndex, setReviewIndex] = useState(0);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialCalculated, setTutorialCalculated] = useState(false);

  const attemptRef = useRef<LocalAttempt | null>(null);
  const submittingRef = useRef(false);
  const nextSessionStartingRef = useRef(false);
  const questActionHandledRef = useRef(false);
  const undoTimerRef = useRef<number | null>(null);
  const questionPaneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const answerRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const savedAttempt = readStoredAttempt();
    if (
      savedAttempt &&
      ["RUNNING", "SUBMITTING", "WAITING", "RECOVERY_REQUIRED"].includes(
        savedAttempt.status,
      )
    ) {
      const normalized =
        savedAttempt.status === "SUBMITTING"
          ? { ...savedAttempt, status: "RECOVERY_REQUIRED" as const }
          : savedAttempt;
      setRecoverableAttempt(normalized);
    }
    const savedResult =
      [
        readJson<CbtGradeResult>(RESULT_STORAGE_KEY),
        readJson<CbtGradeResult>(LEGACY_RESULT_STORAGE_KEY),
      ].find(
        (candidate): candidate is CbtGradeResult =>
          candidate !== null && !isTutorialCbtReview(candidate),
      ) ?? null;
    setRecentResult(savedResult);
    if (isReviewEntry) {
      setResult(savedResult);
      setReviewFilter("wrong");
      setReviewIndex(0);
      setStage("review");
    }
    setReviewReady(true);
    if (isReviewEntry) router.replace("/questionbank/review?category=CBT");
  }, [isReviewEntry, router]);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    const updateOrientation = () => {
      setViewportWidth(window.innerWidth);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    return () => window.removeEventListener("resize", updateOrientation);
  }, []);

  useEffect(() => {
    if (
      (stage !== "player" && stage !== "full-waiting") ||
      attempt?.mode === "tutorial"
    )
      return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.mode, stage]);

  useEffect(() => {
    if (!isPersistentAttempt(attempt) || attempt.status === "COMPLETED") return;
    setSaveStatus("saving");
    const timeout = window.setTimeout(() => {
      try {
        writeAttempt(attempt);
        setRecoverableAttempt(attempt);
        setSaveStatus(navigator.onLine ? "saved" : "offline");
      } catch {
        setSaveStatus("failed");
      }
    }, saveDelayMs);
    return () => window.clearTimeout(timeout);
  }, [attempt, saveDelayMs]);

  useEffect(() => {
    const flush = () => {
      const current = attemptRef.current;
      if (!isPersistentAttempt(current) || current.status === "COMPLETED")
        return;
      try {
        writeAttempt(current);
      } catch {
        // 페이지 종료 중에는 다음 진입 시 마지막 성공 저장본으로 복구합니다.
      }
    };
    const onOffline = () => setSaveStatus("offline");
    const onOnline = () => setSaveStatus("saved");
    window.addEventListener("pagehide", flush);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    const running =
      stage === "player" &&
      isPersistentAttempt(attempt) &&
      attempt.status === "RUNNING";
    if (!running) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [attempt?.mode, attempt?.status, stage]);

  const patchAttempt = useCallback(
    (updater: (current: LocalAttempt) => LocalAttempt, delayMs = 250) => {
      setSaveDelayMs(delayMs);
      if (isPersistentAttempt(attemptRef.current)) setSaveStatus("saving");
      setAttempt((current) => {
        if (!current) return current;
        const next = updater(current);
        attemptRef.current = next;
        return next;
      });
    },
    [],
  );

  const remainingSec = attempt
    ? Math.max(0, Math.floor((attempt.deadlineAt - now) / 1000))
    : 0;
  const breakRemainingSec = attempt?.breakEndsAt
    ? Math.max(0, Math.ceil((attempt.breakEndsAt - now) / 1000))
    : 0;
  const currentQuestionIndex = attempt
    ? Math.max(
        0,
        attempt.questions.findIndex(
          (question) => question.id === attempt.currentQuestionId,
        ),
      )
    : 0;
  const currentQuestion = attempt?.questions[currentQuestionIndex] ?? null;

  const summary = useMemo(() => {
    const answers = attempt?.answers ?? {};
    const total = attempt?.questions.length ?? 0;
    const answered = Object.values(answers).filter(
      (answer) => answer.selectedChoice !== null,
    ).length;
    return {
      total,
      answered,
      unanswered: total - answered,
      flagged: Object.values(answers).filter((answer) => answer.flagged).length,
      unknown: Object.values(answers).filter((answer) => answer.unknown).length,
    };
  }, [attempt?.answers, attempt?.questions.length]);

  useEffect(() => {
    const questionId = attempt?.currentQuestionId;
    if (stage !== "player" || !questionId) return;
    const frame = window.requestAnimationFrame(() => {
      answerRowRefs.current[questionId]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [attempt?.currentQuestionId, stage]);

  const persistImmediately = (nextAttempt: LocalAttempt) => {
    attemptRef.current = nextAttempt;
    setAttempt(nextAttempt);
    if (!isPersistentAttempt(nextAttempt)) return;
    setRecoverableAttempt(nextAttempt);
    try {
      writeAttempt(nextAttempt);
    } catch {
      setSaveStatus("failed");
    }
  };

  const submitAttempt = useCallback(
    async (reason: "USER_SUBMITTED" | "TIME_EXPIRED") => {
      const current = attemptRef.current;
      if (!current || submittingRef.current || current.status === "COMPLETED")
        return;
      if (current.mode === "tutorial") {
        setSubmitOpen(false);
        persistImmediately({ ...current, status: "COMPLETED" });
        setTutorialStepIndex(CBT_TUTORIAL_STEPS.length - 1);
        return;
      }
      submittingRef.current = true;
      setSubmitError(null);
      const submitting: LocalAttempt = {
        ...current,
        status: "SUBMITTING",
        submissionReason: reason,
      };
      persistImmediately(submitting);
      setSubmitOpen(false);

      try {
        const response = await fetch("/api/cbt/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: submitting.attemptId,
            sessionId: submitting.session.id,
            idempotencyKey: `${submitting.attemptId}-submit-v1`,
            reason,
            answers: submitting.answers,
          }),
        });
        if (!response.ok) throw new Error("답안을 제출하지 못했어요.");
        const sessionGrade = (await response.json()) as CbtGradeResult;
        const fullResults = [...(submitting.fullResults ?? []), sessionGrade];
        const reviewGrade =
          submitting.mode === "full"
            ? combineGradeResults(fullResults, submitting.attemptId)
            : sessionGrade;
        const reviewSaved = saveCbtReview(reviewGrade, submitting.title);
        setReviewSaveFailed(!reviewSaved);
        if (!reviewSaved) setSaveStatus("failed");
        if (
          submitting.mode === "full" &&
          (submitting.fullSessionIndex ?? 0) < SESSION_OPTIONS.length - 1
        ) {
          const fullSessionIndex = submitting.fullSessionIndex ?? 0;
          const waiting: LocalAttempt = {
            ...submitting,
            status: "WAITING",
            fullResults,
            breakEndsAt:
              Date.now() + FULL_BREAK_DURATION_SEC[fullSessionIndex] * 1000,
          };
          persistImmediately(waiting);
          setResult(sessionGrade);
          setStage("full-waiting");
          return;
        }
        const grade =
          submitting.mode === "full"
            ? combineGradeResults(fullResults, submitting.attemptId)
            : sessionGrade;
        const completed = { ...submitting, status: "COMPLETED" as const };
        attemptRef.current = completed;
        setAttempt(completed);
        setRecoverableAttempt(null);
        setResult(grade);
        setRecentResult(grade);
        setStage("result");
        try {
          window.localStorage.setItem(
            RESULT_STORAGE_KEY,
            JSON.stringify(grade),
          );
          window.localStorage.removeItem(ATTEMPT_STORAGE_KEY);
          LEGACY_ATTEMPT_STORAGE_KEYS.forEach((key) =>
            window.localStorage.removeItem(key),
          );
          window.localStorage.removeItem(LEGACY_RESULT_STORAGE_KEY);
        } catch {
          setSaveStatus("failed");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "답안을 제출하지 못했어요.";
        const failed: LocalAttempt = {
          ...submitting,
          status: reason === "TIME_EXPIRED" ? "RECOVERY_REQUIRED" : "RUNNING",
        };
        persistImmediately(failed);
        setSubmitError(
          reason === "TIME_EXPIRED"
            ? `${message} 답안은 잠긴 상태이며 연결 후 다시 제출할 수 있어요.`
            : `${message} 답안은 그대로 보관되었습니다.`,
        );
      } finally {
        submittingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (
      stage === "player" &&
      attempt?.mode !== "tutorial" &&
      attempt?.status === "RUNNING" &&
      remainingSec <= 300 &&
      remainingSec > 0 &&
      !attempt.warningShownAt300
    ) {
      patchAttempt((current) => ({
        ...current,
        warningShownAt300: Date.now(),
      }));
      setWarningOpen(true);
    }
  }, [
    attempt?.status,
    attempt?.warningShownAt300,
    patchAttempt,
    remainingSec,
    stage,
  ]);

  useEffect(() => {
    if (
      stage === "player" &&
      attempt?.mode !== "tutorial" &&
      attempt?.status === "RUNNING" &&
      remainingSec === 0
    ) {
      void submitAttempt("TIME_EXPIRED");
    }
  }, [attempt?.status, remainingSec, stage, submitAttempt]);

  const loadPracticeSet = async (sessionId: CbtSessionId) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/cbt/practice?session=${sessionId}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const practiceSet = (await response.json()) as CbtPracticeSet;
      setPreparedSet(practiceSet);
      return practiceSet;
    } catch {
      setLoadError("문제 세트를 불러오지 못했어요. 다시 시도해 주세요.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const openAction = (action: PendingAction) => {
    if (submittingRef.current || nextSessionStartingRef.current) return;
    if (action === "tutorial") {
      void prepareTutorial();
      return;
    }
    const active = resumableAttempt(attempt, recoverableAttempt);
    if (active) {
      setPendingAction(action);
      setConflictOpen(true);
      return;
    }
    if (action === "session") setStage("session-select");
    else if (action === "full") void prepareFullPractice();
  };

  const prepareTutorial = async () => {
    const practiceSet = await loadPracticeSet("tutorial");
    if (!practiceSet) return;
    setPreparedMode("tutorial");
    setTimeMode("real");
    startPreparedAttempt(practiceSet, "tutorial");
  };

  const prepareFullPractice = async () => {
    const practiceSet = await loadPracticeSet(1);
    if (!practiceSet) return;
    setPreparedMode("full");
    setTimeMode("real");
    setStage("exam-info");
  };

  useEffect(() => {
    if (questActionHandledRef.current) return;
    questActionHandledRef.current = true;
    if (
      new URLSearchParams(window.location.search).get("quest") === "tutorial"
    ) {
      openAction("tutorial");
    }
  }, []);

  const selectSession = async (sessionId: CbtSessionId) => {
    const practiceSet = await loadPracticeSet(sessionId);
    if (!practiceSet) return;
    setPreparedMode("session");
    setTimeMode("real");
    setStage("exam-info");
  };

  const startPreparedAttempt = (
    practiceSet: CbtPracticeSet | null = preparedSet,
    mode: LocalAttempt["mode"] = preparedMode,
  ) => {
    if (!practiceSet) return;
    if (submittingRef.current || nextSessionStartingRef.current) return;
    if (mode === "tutorial") {
      const active = resumableAttempt(attempt, recoverableAttempt);
      if (active) {
        try {
          writeAttempt(active);
        } catch {
          setSaveStatus("failed");
        }
        setRecoverableAttempt(active);
      }
      setTutorialStepIndex(0);
      setTutorialCalculated(false);
    }
    const startedAt = Date.now();
    const durationSec =
      mode !== "tutorial" && timeMode === "quick"
        ? Math.max(
            5 * 60,
            Math.round(practiceSet.session.durationSec * QUICK_TIME_RATIO),
          )
        : practiceSet.session.durationSec;
    const nextAttempt: LocalAttempt = {
      version: 4,
      attemptId: `cbt-${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      templateId: practiceSet.templateId,
      title:
        mode === "full" ? "약사국시 CBT 전체 4교시 실전" : practiceSet.title,
      session: practiceSet.session,
      questions: practiceSet.questions,
      status: "RUNNING",
      startedAt,
      deadlineAt: startedAt + durationSec * 1000,
      durationSec,
      currentQuestionId: practiceSet.questions[0].id,
      answers: createAnswers(practiceSet.questions),
      fontScale: 100,
      layoutMode: "single",
      warningShownAt300: null,
      consentVersion: CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
      fullSessionIndex: mode === "full" ? 0 : undefined,
      fullResults: mode === "full" ? [] : undefined,
    };
    setNow(startedAt);
    setResult(null);
    setOpenNoteQuestionId(null);
    setCalculatorOpen(false);
    setSubmitOpen(false);
    setListOpen(false);
    setExitOpen(false);
    persistImmediately(nextAttempt);
    setStage("player");
  };

  const startNextFullSession = useCallback(async () => {
    const current = attemptRef.current;
    if (
      !current ||
      current.mode !== "full" ||
      current.status !== "WAITING" ||
      nextSessionStartingRef.current
    ) {
      return;
    }
    const nextIndex = (current.fullSessionIndex ?? 0) + 1;
    const nextSession = SESSION_OPTIONS[nextIndex];
    if (!nextSession) return;
    nextSessionStartingRef.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/cbt/practice?session=${nextSession.id}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error();
      const nextSet = (await response.json()) as CbtPracticeSet;
      const startedAt = Date.now();
      const nextAttempt: LocalAttempt = {
        ...current,
        templateId: nextSet.templateId,
        title: "약사국시 CBT 전체 4교시 실전",
        session: nextSet.session,
        questions: nextSet.questions,
        status: "RUNNING",
        startedAt,
        deadlineAt: startedAt + nextSet.session.durationSec * 1000,
        durationSec: nextSet.session.durationSec,
        currentQuestionId: nextSet.questions[0].id,
        answers: createAnswers(nextSet.questions),
        warningShownAt300: null,
        submissionReason: undefined,
        fullSessionIndex: nextIndex,
        breakEndsAt: undefined,
      };
      setNow(startedAt);
      setResult(null);
      setOpenNoteQuestionId(null);
      persistImmediately(nextAttempt);
      setStage("player");
    } catch {
      setLoadError("다음 교시 문제를 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      nextSessionStartingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      stage === "full-waiting" &&
      attempt?.status === "WAITING" &&
      breakRemainingSec === 0 &&
      !loading &&
      !loadError
    ) {
      void startNextFullSession();
    }
  }, [
    attempt?.status,
    breakRemainingSec,
    loading,
    loadError,
    stage,
    startNextFullSession,
  ]);

  const resumeAttempt = () => {
    const saved = resumableAttempt(attempt, recoverableAttempt);
    if (!saved) return;
    const normalized =
      saved.status === "SUBMITTING"
        ? { ...saved, status: "RECOVERY_REQUIRED" as const }
        : saved;
    attemptRef.current = normalized;
    setAttempt(normalized);
    setNow(Date.now());
    setStage(normalized.status === "WAITING" ? "full-waiting" : "player");
  };

  const discardAndContinue = () => {
    window.localStorage.removeItem(ATTEMPT_STORAGE_KEY);
    LEGACY_ATTEMPT_STORAGE_KEYS.forEach((key) =>
      window.localStorage.removeItem(key),
    );
    setAttempt(null);
    setRecoverableAttempt(null);
    setConflictOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action === "session") setStage("session-select");
    if (action === "full") void prepareFullPractice();
    if (action === "tutorial") void prepareTutorial();
  };

  const patchAnswer = (
    questionId: string,
    patch: Partial<AnswerState>,
    delayMs = 250,
  ) => {
    if (
      attempt?.status !== "RUNNING" ||
      (attempt.mode !== "tutorial" && remainingSec === 0)
    )
      return;
    patchAttempt((current) => {
      const previous = current.answers[questionId] ?? emptyAnswer();
      const selectedChoice =
        patch.selectedChoice === undefined
          ? previous.selectedChoice
          : patch.selectedChoice;
      const excludedChoices = Array.from(
        new Set(
          (patch.excludedChoices ?? previous.excludedChoices).filter(
            (choice) =>
              Number.isInteger(choice) &&
              choice >= 0 &&
              choice <= 4 &&
              choice !== selectedChoice,
          ),
        ),
      ).sort((a, b) => a - b);
      return {
        ...current,
        answers: {
          ...current.answers,
          [questionId]: {
            ...previous,
            ...patch,
            selectedChoice,
            excludedChoices,
            revision: previous.revision + 1,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }, delayMs);
  };

  const goToQuestion = (questionId: string) => {
    if (!attempt) return;
    setOpenNoteQuestionId(null);
    patchAttempt((current) => ({ ...current, currentQuestionId: questionId }));
    window.requestAnimationFrame(() => {
      questionPaneRefs.current[questionId]?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  };

  const activateQuestion = (questionId: string) => {
    if (!attempt || attempt.currentQuestionId === questionId) return;
    setOpenNoteQuestionId((current) =>
      current === questionId ? current : null,
    );
    patchAttempt((current) => ({ ...current, currentQuestionId: questionId }));
  };

  const clearAnswer = (questionId: string) => {
    const answer = attempt?.answers[questionId] ?? emptyAnswer();
    if (answer.selectedChoice === null) return;
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setUndoAnswer({
      questionId,
      selectedChoice: answer.selectedChoice,
    });
    patchAnswer(questionId, { selectedChoice: null });
    undoTimerRef.current = window.setTimeout(() => setUndoAnswer(null), 3000);
  };

  const restoreClearedAnswer = () => {
    if (!undoAnswer) return;
    patchAnswer(undoAnswer.questionId, {
      selectedChoice: undoAnswer.selectedChoice,
    });
    setUndoAnswer(null);
  };

  function lockedForEditing() {
    return (
      attempt?.status !== "RUNNING" ||
      (attempt.mode !== "tutorial" && remainingSec === 0)
    );
  }

  const openQuestionList = (filter: ListFilter) => {
    setListFilter(filter);
    setSubmitOpen(false);
    setListOpen(true);
  };

  const leaveAttempt = () => {
    const current = attemptRef.current;
    if (current?.mode === "tutorial") {
      attemptRef.current = null;
      setAttempt(null);
      setOpenNoteQuestionId(null);
      setCalculatorOpen(false);
      setSubmitOpen(false);
      setExitOpen(false);
      setStage("hub");
      return;
    }
    if (current && current.status !== "COMPLETED") {
      try {
        writeAttempt(current);
      } catch {
        setSaveStatus("failed");
      }
    }
    setRecoverableAttempt(current);
    setExitOpen(false);
    setStage("hub");
  };

  const reviewQuestions = useMemo(() => {
    if (!result) return [];
    return result.review.filter((question) =>
      reviewFilter === "unknown"
        ? question.unknown
        : question.status !== "correct",
    );
  }, [result, reviewFilter]);

  if (stage === "hub") {
    return (
      <HubPage
        activeAttempt={resumableAttempt(attempt, recoverableAttempt)}
        recentResult={recentResult}
        onResume={resumeAttempt}
        onSession={() => openAction("session")}
        onFull={() => openAction("full")}
        onTutorial={() => openAction("tutorial")}
        tutorialDisabled={
          loading || submittingRef.current || nextSessionStartingRef.current
        }
        onReview={() => {
          router.push("/questionbank/review?category=CBT");
        }}
        conflictOpen={conflictOpen}
        onCloseConflict={() => setConflictOpen(false)}
        onDiscard={discardAndContinue}
      />
    );
  }

  if (stage === "session-select") {
    return (
      <SessionSelectPage
        loading={loading}
        error={loadError}
        onBack={() => setStage("hub")}
        onSelect={selectSession}
      />
    );
  }

  if (
    !preparedSet &&
    ["exam-info", "device-check", "consent", "ready"].includes(stage)
  ) {
    return (
      <CenteredMessage
        title="문제 세트를 불러오지 못했어요"
        description="교시 선택 화면으로 돌아가 다시 시도해 주세요."
        actionLabel="교시 다시 선택"
        onAction={() => setStage("session-select")}
      />
    );
  }

  if (stage === "exam-info" && preparedSet) {
    const durationSec =
      preparedMode === "full"
        ? SESSION_OPTIONS.reduce(
            (total, session) => total + session.durationSec,
            0,
          )
        : timeMode === "quick"
          ? Math.max(
              5 * 60,
              Math.round(preparedSet.session.durationSec * QUICK_TIME_RATIO),
            )
          : preparedSet.session.durationSec;
    return (
      <FlowPage
        title="시험 정보·시간 설정"
        onBack={() =>
          setStage(preparedMode === "full" ? "hub" : "session-select")
        }
      >
        <InfoGrid
          items={[
            [
              "시험 세트",
              preparedMode === "full"
                ? "약사국시 CBT 전체 4교시 실전"
                : preparedSet.title,
            ],
            [
              "과목",
              preparedMode === "full"
                ? "생명약학 · 산업약학 · 임상·실무약학 · 법규"
                : preparedSet.session.subjectsLabel,
            ],
            [
              "문항 수",
              preparedMode === "full"
                ? `${SESSION_OPTIONS.reduce((sum, session) => sum + session.questionCount, 0)}문항`
                : `${preparedSet.questions.length}문항`,
            ],
            ["제한시간", formatDuration(durationSec)],
            ["예상 종료", formatClock(Date.now() + durationSec * 1000)],
          ]}
        />
        {preparedMode === "full" ? (
          <p className="mt-6 rounded-xl bg-sky-50 p-4 text-sm font-semibold leading-6 text-sky-900">
            1~4교시를 순서대로 응시하며 교시 사이에는 쉬는 시간과 다음 교시 자동
            시작 대기가 적용됩니다.
          </p>
        ) : (
          <section className="mt-6">
            <h2 className="text-base font-extrabold">연습 시간</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <ChoiceCard
                active={timeMode === "real"}
                title="실전 시간"
                description="실제 교시 제한시간으로 연습"
                onClick={() => setTimeMode("real")}
              />
              <ChoiceCard
                active={timeMode === "quick"}
                title="빠른 연습"
                description="문항은 유지하고 시간을 50%로 단축"
                onClick={() => setTimeMode("quick")}
              />
            </div>
          </section>
        )}
        <PrimaryButton onClick={() => setStage("device-check")}>
          다음
        </PrimaryButton>
      </FlowPage>
    );
  }

  if (stage === "device-check" && preparedSet) {
    const supportedOrientation = isCompact || !isPortrait;
    const ready =
      supportedOrientation && deviceChecks.readable && deviceChecks.touch;
    return (
      <FlowPage title="기기 확인" onBack={() => setStage("exam-info")}>
        {isPortrait && !isCompact && <RotateNotice />}
        <CheckRow
          checked={supportedOrientation}
          title={isCompact ? "모바일 화면" : "가로 모드"}
          description={
            isCompact
              ? "현재 화면 크기에 맞춘 모바일 응시 화면을 사용합니다."
              : isPortrait
                ? "패드를 가로로 돌려 주세요."
                : "가로 화면이 확인됐어요."
          }
          readOnly
        />
        <CheckRow
          checked={deviceChecks.readable}
          title="화면 가독성"
          description="문제와 선택지 글자가 선명하게 보입니다."
          onChange={(checked) =>
            setDeviceChecks((value) => ({ ...value, readable: checked }))
          }
        />
        <CheckRow
          checked={deviceChecks.touch}
          title="터치 동작"
          description="버튼과 선택지를 문제없이 터치할 수 있습니다."
          onChange={(checked) =>
            setDeviceChecks((value) => ({ ...value, touch: checked }))
          }
        />
        <PrimaryButton disabled={!ready} onClick={() => setStage("consent")}>
          다음
        </PrimaryButton>
      </FlowPage>
    );
  }

  if (stage === "consent" && preparedSet) {
    return (
      <FlowPage title="유의사항·동의" onBack={() => setStage("device-check")}>
        <ul className="space-y-3 rounded-2xl bg-accent/40 p-5 text-sm leading-6">
          {[
            "시간이 종료되면 답안이 자동 제출됩니다.",
            "시험 중에는 정답과 해설이 보이지 않습니다.",
            "앱을 나가도 시험 시간은 계속 흐릅니다.",
            "문항과 자료를 외부에 무단 배포할 수 없습니다.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
        <label className="mt-5 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl bg-accent/40 px-4 py-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={consented}
            onChange={(event) => setConsented(event.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
          유의사항을 확인했고 연습 응시에 동의합니다.
        </label>
        <PrimaryButton disabled={!consented} onClick={() => setStage("ready")}>
          동의하고 다음
        </PrimaryButton>
      </FlowPage>
    );
  }

  if (stage === "ready" && preparedSet) {
    return (
      <FlowPage
        title={
          preparedSet.session.id === "tutorial" ? "조작 연습" : "시험 시작 대기"
        }
        onBack={() =>
          setStage(preparedSet.session.id === "tutorial" ? "hub" : "consent")
        }
      >
        <div className="rounded-2xl bg-accent/60 p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
            <Play className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold">
            {preparedMode === "full"
              ? "전체 실전 · 1교시"
              : preparedSet.session.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {preparedMode === "full"
              ? "1교시부터 4교시까지 순서대로 진행"
              : preparedSet.session.subjectsLabel}
          </p>
          <p className="mt-4 font-semibold">
            {preparedMode === "full"
              ? SESSION_OPTIONS.reduce(
                  (sum, session) => sum + session.questionCount,
                  0,
                )
              : preparedSet.questions.length}
            문항 ·{" "}
            {formatDuration(
              preparedMode === "full"
                ? SESSION_OPTIONS.reduce(
                    (sum, session) => sum + session.durationSec,
                    0,
                  )
                : timeMode === "quick"
                  ? Math.max(
                      5 * 60,
                      Math.round(
                        preparedSet.session.durationSec * QUICK_TIME_RATIO,
                      ),
                    )
                  : preparedSet.session.durationSec,
            )}
          </p>
        </div>
        <PrimaryButton onClick={() => startPreparedAttempt()}>
          시험 시작
        </PrimaryButton>
      </FlowPage>
    );
  }

  if (stage === "full-waiting" && attempt && attempt.status === "WAITING") {
    const nextIndex = (attempt.fullSessionIndex ?? 0) + 1;
    const nextSession = SESSION_OPTIONS[nextIndex];
    return (
      <FullWaitingPage
        completedSession={attempt.session}
        nextSession={nextSession}
        sessionResult={result}
        remainingSec={breakRemainingSec}
        loading={loading}
        error={loadError}
        onStart={() => void startNextFullSession()}
        onHome={() => setStage("hub")}
      />
    );
  }

  if (stage === "result" && result && attempt) {
    return (
      <ResultPage
        reviewSaveFailed={reviewSaveFailed}
        result={result}
        flagged={result.review.filter((question) => question.flagged).length}
        unknown={result.review.filter((question) => question.unknown).length}
        full={attempt.mode === "full"}
        canRetry={attempt.mode === "session" && attempt.deadlineAt > Date.now()}
        onRetry={() => {
          const current = attemptRef.current;
          if (!current || current.deadlineAt <= Date.now()) return;
          const resumed: LocalAttempt = {
            ...current,
            status: "RUNNING",
            submissionReason: undefined,
          };
          setNow(Date.now());
          persistImmediately(resumed);
          setStage("player");
        }}
        onHome={() => setStage("hub")}
        onReview={() => {
          router.push(
            `/questionbank/review?category=CBT&collection=${encodeURIComponent(`cbt:${result.attemptId}`)}`,
          );
        }}
      />
    );
  }

  if (stage === "review" && !reviewReady) return <ReviewLoadingPage />;

  if (stage === "review" && !result) {
    return (
      <main className="min-h-dvh bg-white text-foreground">
        <PracticeHeader title="복습하기" backHref="/questionbank" />
        <section className="mx-auto flex max-w-md flex-col items-center px-5 py-16 text-center">
          <BookOpenCheck
            className="h-10 w-10 text-primary"
            aria-hidden="true"
          />
          <h1 className="mt-5 text-xl font-semibold">
            복습할 CBT 기록이 없어요
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            CBT 연습을 마치고 답안을 제출하면 오답과 미응답, 모름 표시한 문제를
            복습할 수 있어요.
          </p>
          <PrimaryButton onClick={() => setStage("hub")}>
            CBT 연습 시작하기
          </PrimaryButton>
        </section>
      </main>
    );
  }

  if (stage === "review" && result) {
    const canReturnToResult =
      attempt?.attemptId === result.attemptId &&
      attempt?.status === "COMPLETED";
    return (
      <ReviewPage
        filter={reviewFilter}
        questions={reviewQuestions}
        index={reviewIndex}
        onIndex={setReviewIndex}
        onFilter={(filter) => {
          setReviewFilter(filter);
          setReviewIndex(0);
        }}
        backLabel={canReturnToResult ? "결과로 돌아가기" : "CBT로 돌아가기"}
        onBack={() => setStage(canReturnToResult ? "result" : "hub")}
      />
    );
  }

  if (stage !== "player" || !attempt || !currentQuestion) {
    return (
      <CenteredMessage
        title="응시 정보를 복구하지 못했어요"
        description="CBT 허브로 돌아가 다시 시작해 주세요."
        actionLabel="CBT 허브로"
        onAction={() => setStage("hub")}
      />
    );
  }

  const locked = lockedForEditing();
  const filteredQuestions = attempt.questions.filter((question) => {
    const answer = attempt.answers[question.id] ?? emptyAnswer();
    if (listFilter === "flagged") return answer.flagged;
    if (listFilter === "unanswered") return answer.selectedChoice === null;
    return true;
  });
  const canUseDouble = viewportWidth >= 1180 && !isPortrait;
  const effectiveLayoutMode: CbtLayoutMode = canUseDouble
    ? attempt.layoutMode
    : "single";
  const pairStart = Math.floor(currentQuestionIndex / 2) * 2;
  const displayedQuestions =
    effectiveLayoutMode === "double"
      ? attempt.questions.slice(pairStart, pairStart + 2)
      : [currentQuestion];

  const guide =
    attempt.mode === "tutorial" ? CBT_TUTORIAL_STEPS[tutorialStepIndex] : null;
  const firstAnswer = attempt.answers[attempt.questions[0].id] ?? emptyAnswer();
  const tutorialActionDone = guide
    ? {
        answer: firstAnswer.selectedChoice !== null,
        check: firstAnswer.flagged,
        unknown: firstAnswer.unknown,
        memo: firstAnswer.memo.trim().length > 0,
        calculator: tutorialCalculated,
        navigate: currentQuestionIndex > 0,
        review: submitOpen,
        complete: true,
      }[guide.id]
    : false;
  const tutorialTarget =
    guide?.id === "memo" && openNoteQuestionId
      ? '[data-cbt-tutorial="memo-input"]'
      : guide?.id === "calculator" && calculatorOpen
        ? '[data-cbt-tutorial="calculator-panel"]'
        : guide?.id === "review" && submitOpen
          ? '[data-cbt-tutorial="submit-panel"]'
          : (guide?.target ?? null);

  const guardTutorialClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (!guide) return;
    if (
      !tutorialTarget ||
      !(event.target instanceof Element) ||
      !event.target.closest(tutorialTarget)
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const guardTutorialKeys = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (
      guide &&
      ["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key) &&
      (!tutorialTarget ||
        !(event.target instanceof Element) ||
        !event.target.closest(tutorialTarget))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const nextTutorialStep = () => {
    if (!guide || !tutorialActionDone || guide.id === "complete") return;
    if (guide.id === "review") {
      void submitAttempt("USER_SUBMITTED");
      return;
    }
    setOpenNoteQuestionId(null);
    setCalculatorOpen(false);
    setTutorialStepIndex((index) => index + 1);
  };
  const finishTutorial = () => {
    try {
      completeDailyQuest("cbt-tutorial");
    } catch {
      // 튜토리얼 종료는 퀘스트 기록 가능 여부와 관계없이 진행합니다.
    }
    leaveAttempt();
  };

  return (
    <>
      <main
        className="h-dvh min-w-0 overflow-hidden bg-white text-foreground lg:min-h-[640px]"
        onClickCapture={guardTutorialClick}
        onKeyDownCapture={guardTutorialKeys}
      >
        <header className="fixed inset-x-0 top-0 z-40 h-[calc(60px+env(safe-area-inset-top))] bg-white pt-[env(safe-area-inset-top)]">
          <div className="grid h-[60px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 lg:gap-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-2 lg:gap-3">
              <button
                type="button"
                onClick={() => setExitOpen(true)}
                aria-label="시험 나가기"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fafafa] hover:bg-accent/50 lg:h-11 lg:w-11"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="hidden min-w-0 min-[480px]:block">
                <p className="truncate text-sm font-extrabold">
                  {attempt.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {attempt.session.title} · 현재 {currentQuestionIndex + 1}번
                </p>
              </div>
            </div>
            {isCompact ? (
              <button
                type="button"
                onClick={() => openQuestionList("all")}
                className="h-10 rounded-xl bg-[#fafafa] px-3 text-xs font-extrabold hover:bg-accent/50"
                aria-label="전체 문제 목록 열기"
              >
                {currentQuestionIndex + 1}/{attempt.questions.length}
              </button>
            ) : isPortrait ? (
              <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-extrabold text-amber-900">
                가로 모드 권장
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  role="group"
                  className="flex items-center rounded-xl bg-[#fafafa] p-1"
                  aria-label="글자 크기"
                >
                  {([80, 100, 125] as const).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      disabled={locked}
                      aria-pressed={attempt.fontScale === scale}
                      onClick={() =>
                        patchAttempt((current) => ({
                          ...current,
                          fontScale: scale,
                        }))
                      }
                      className={cn(
                        "h-11 min-w-12 rounded-lg px-2 text-xs font-extrabold disabled:opacity-40",
                        attempt.fontScale === scale &&
                          "bg-foreground text-white",
                      )}
                    >
                      {scale}%
                    </button>
                  ))}
                </div>
                <div
                  role="group"
                  className="hidden items-center rounded-xl bg-[#fafafa] p-1 min-[1180px]:flex"
                  aria-label="문제 화면 배치"
                >
                  {(
                    [
                      ["single", "1문제"],
                      ["double", "2문제"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={locked || (mode === "double" && !canUseDouble)}
                      aria-pressed={effectiveLayoutMode === mode}
                      title={
                        mode === "double" && !canUseDouble
                          ? "가로 1180px 이상에서 사용할 수 있어요."
                          : undefined
                      }
                      onClick={() =>
                        patchAttempt((current) => ({
                          ...current,
                          layoutMode: mode,
                        }))
                      }
                      className={cn(
                        "flex h-11 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg px-2 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-40",
                        effectiveLayoutMode === mode &&
                          "bg-foreground text-white",
                      )}
                    >
                      {mode === "double" && (
                        <Columns2 className="h-3.5 w-3.5" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              {!guide && !isCompact && !isPortrait && (
                <SaveStateBadge status={saveStatus} />
              )}
              {guide ? (
                <span className="rounded-xl bg-accent px-3 py-2 text-sm font-bold text-primary">
                  조작 연습
                </span>
              ) : (
                <div
                  className={cn(
                    "flex min-w-[7.25rem] items-center gap-2 rounded-xl px-2 py-1.5 lg:min-w-[9.5rem] lg:px-3 lg:py-2",
                    remainingSec <= 300
                      ? "bg-red-50 text-destructive"
                      : "bg-[#fafafa]",
                  )}
                >
                  <Clock3 className="hidden h-5 w-5 sm:block" />
                  <div>
                    <p className="text-[0.6875rem] font-bold">
                      {remainingSec <= 300 ? "5분 이하" : "남은시간"}
                    </p>
                    <p className="text-base font-extrabold tabular-nums">
                      {formatDuration(remainingSec)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {isPortrait && !isCompact && (
          <div className="fixed inset-x-0 top-[calc(60px+env(safe-area-inset-top))] z-30 flex h-12 items-center justify-center gap-2 bg-amber-100 text-sm font-bold text-amber-900">
            <RotateCcw className="h-4 w-4" />
            패드를 가로로 돌리면 더 편하게 응시할 수 있어요. 답안과 시간은
            유지됩니다.
          </div>
        )}

        <div
          className={cn(
            "fixed inset-x-0 bottom-[calc(120px+env(safe-area-inset-bottom))] top-[calc(60px+env(safe-area-inset-top))] grid grid-cols-1 lg:bottom-[calc(64px+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_280px] min-[1180px]:grid-cols-[minmax(0,1fr)_304px] min-[1280px]:grid-cols-[minmax(0,1fr)_320px]",
            isPortrait &&
              !isCompact &&
              "top-[calc(108px+env(safe-area-inset-top))]",
          )}
        >
          <section className="flex min-w-0 flex-col overflow-hidden">
            <div
              className={cn(
                "min-h-0 min-w-0 flex-1",
                effectiveLayoutMode === "double"
                  ? "grid grid-cols-2 gap-3 overflow-hidden p-3"
                  : "overflow-hidden",
              )}
            >
              {displayedQuestions.map((question) => {
                const answer = attempt.answers[question.id] ?? emptyAnswer();
                return (
                  <div
                    key={question.id}
                    ref={(node) => {
                      questionPaneRefs.current[question.id] = node;
                    }}
                    className={cn(
                      "h-full min-w-0 overflow-y-auto",
                      effectiveLayoutMode === "single"
                        ? "p-3 sm:p-4 lg:p-6"
                        : "p-1",
                    )}
                  >
                    <QuestionPane
                      question={question}
                      answer={answer}
                      active={question.id === currentQuestion.id}
                      compact={effectiveLayoutMode === "double"}
                      locked={locked}
                      fontScale={attempt.fontScale}
                      noteOpen={openNoteQuestionId === question.id}
                      onActivate={activateQuestion}
                      onPatchAnswer={patchAnswer}
                      onToggleNote={(questionId) => {
                        setOpenNoteQuestionId((current) =>
                          current === questionId ? null : questionId,
                        );
                      }}
                      onClearAnswer={clearAnswer}
                    />
                  </div>
                );
              })}
              {effectiveLayoutMode === "double" &&
                displayedQuestions.length === 1 && (
                  <div className="flex min-w-0 items-center justify-center rounded-2xl bg-[#fafafa] p-6 text-center text-sm font-bold text-muted-foreground">
                    마지막 문항입니다.
                  </div>
                )}
            </div>
          </section>

          <aside
            className="hidden overflow-hidden bg-[#fafafa] lg:block"
            aria-label="답안 표기란"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <div>
                <p className="text-xs font-bold text-primary">답안 표기란</p>
                <p className="mt-1 text-sm font-extrabold">
                  {summary.answered} / {summary.total} 응답
                </p>
              </div>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-[calc(100%-4rem)] overflow-y-auto p-1">
              {attempt.questions.map((question) => {
                const answer = attempt.answers[question.id] ?? emptyAnswer();
                const isCurrent = question.id === currentQuestion.id;
                const stateLabel = [
                  answer.selectedChoice === null
                    ? "미응답"
                    : `${answer.selectedChoice + 1}번 선택`,
                  answer.flagged ? "체크" : "",
                  answer.unknown ? "모름" : "",
                  answer.memo.trim() ? "메모 있음" : "",
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <div
                    key={question.id}
                    ref={(node) => {
                      answerRowRefs.current[question.id] = node;
                    }}
                    className={cn(
                      "mb-2 flex min-h-12 items-center rounded-xl px-1 py-0.5",
                      isCurrent ? "bg-accent" : "hover:bg-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => goToQuestion(question.id)}
                      aria-label={`${question.number}번, ${stateLabel}${isCurrent ? ", 현재 문제" : ""}`}
                      aria-current={isCurrent ? "true" : undefined}
                      className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-xs font-extrabold"
                    >
                      {answer.flagged && (
                        <span
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white"
                          aria-hidden="true"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className={cn(isCurrent && "-translate-y-1")}>
                        {question.number}
                      </span>
                      <span className="absolute bottom-0.5 flex h-3 items-center gap-0.5 text-[0.4375rem] font-extrabold text-primary">
                        {isCurrent ? <span>현재</span> : null}
                        {answer.unknown && (
                          <CircleHelp className="h-2.5 w-2.5 text-sky-700" />
                        )}
                        {answer.memo.trim() && (
                          <StickyNote className="h-2.5 w-2.5 text-amber-700" />
                        )}
                      </span>
                    </button>
                    <div className="ml-0.5 flex min-w-0 flex-1 items-center justify-between">
                      {[0, 1, 2, 3, 4].map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          disabled={locked}
                          aria-label={`${question.number}번 문항 ${choice + 1}번 선택지`}
                          aria-pressed={answer.selectedChoice === choice}
                          onClick={() =>
                            patchAnswer(question.id, { selectedChoice: choice })
                          }
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-extrabold disabled:opacity-60",
                            answer.selectedChoice === choice
                              ? "bg-primary text-white"
                              : "bg-white hover:bg-accent/50",
                          )}
                        >
                          {choice + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>

        <footer
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 bg-white px-3 pb-[env(safe-area-inset-bottom)] lg:px-4",
            isCompact
              ? "h-[calc(120px+env(safe-area-inset-bottom))]"
              : "h-[calc(64px+env(safe-area-inset-bottom))]",
          )}
        >
          {isCompact ? (
            <div className="flex h-[120px] flex-col justify-center gap-2 py-2">
              <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto_2.75rem] items-center gap-2">
                <button
                  type="button"
                  aria-label="이전 문제"
                  disabled={currentQuestionIndex === 0}
                  onClick={() =>
                    goToQuestion(attempt.questions[currentQuestionIndex - 1].id)
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fafafa] hover:bg-accent/50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="truncate text-center text-xs font-extrabold">
                  현재 {currentQuestionIndex + 1} / {attempt.questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => openQuestionList("all")}
                  className="h-11 rounded-xl bg-[#fafafa] px-3 text-xs font-bold hover:bg-accent/50"
                >
                  문제 목록
                </button>
                <button
                  type="button"
                  aria-label="다음 문제"
                  data-cbt-tutorial="navigate"
                  disabled={
                    currentQuestionIndex === attempt.questions.length - 1
                  }
                  onClick={() =>
                    goToQuestion(attempt.questions[currentQuestionIndex + 1].id)
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fafafa] hover:bg-accent/50 disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-[1fr_1.35fr] gap-2">
                <button
                  type="button"
                  disabled={locked}
                  data-cbt-tutorial="calculator"
                  onClick={() => setCalculatorOpen(true)}
                  className="flex h-11 items-center justify-center gap-1 rounded-xl bg-[#fafafa] text-xs font-bold hover:bg-accent/50 disabled:opacity-40"
                >
                  <Calculator className="h-4 w-4" />
                  계산기
                </button>
                <button
                  type="button"
                  disabled={locked}
                  data-cbt-tutorial="review"
                  onClick={() => setSubmitOpen(true)}
                  className="h-11 rounded-xl bg-foreground px-3 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  답안 제출
                </button>
              </div>
            </div>
          ) : (
            <div className="grid h-[64px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="flex gap-2">
                <NavButton
                  label="이전"
                  icon={<ChevronLeft className="h-4 w-4" />}
                  disabled={currentQuestionIndex === 0}
                  onClick={() =>
                    goToQuestion(attempt.questions[currentQuestionIndex - 1].id)
                  }
                />
                <NavButton
                  label="다음"
                  tutorialTarget="navigate"
                  icon={<ChevronRight className="h-4 w-4" />}
                  iconAfter
                  disabled={
                    currentQuestionIndex === attempt.questions.length - 1
                  }
                  onClick={() =>
                    goToQuestion(attempt.questions[currentQuestionIndex + 1].id)
                  }
                />
              </div>
              <div className="flex min-w-0 items-center justify-center gap-2">
                <span className="rounded-full bg-[#fafafa] px-3 py-2 text-xs font-extrabold">
                  현재 {currentQuestionIndex + 1} / {attempt.questions.length}
                </span>
                <FilterButton
                  label="전체 문제"
                  count={summary.total}
                  onClick={() => openQuestionList("all")}
                />
                <FilterButton
                  label="체크 문제"
                  count={summary.flagged}
                  onClick={() => openQuestionList("flagged")}
                />
                <FilterButton
                  label="안 푼 문제"
                  count={summary.unanswered}
                  accent={summary.unanswered > 0}
                  onClick={() => openQuestionList("unanswered")}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <ToolButton
                  icon={<Calculator className="h-4 w-4" />}
                  label="계산기"
                  tutorialTarget="calculator"
                  disabled={locked}
                  onClick={() => setCalculatorOpen(true)}
                />
                <button
                  type="button"
                  disabled={locked}
                  data-cbt-tutorial="review"
                  onClick={() => setSubmitOpen(true)}
                  className="h-11 rounded-xl bg-foreground px-5 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  답안 제출
                </button>
              </div>
            </div>
          )}
        </footer>

        {undoAnswer && (
          <div
            role="status"
            className={cn(
              "fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-foreground px-4 py-3 text-sm font-bold text-white",
              isCompact
                ? "bottom-[calc(132px+env(safe-area-inset-bottom))]"
                : "bottom-[calc(76px+env(safe-area-inset-bottom))]",
            )}
          >
            <span>선택 답을 지웠어요.</span>
            <button
              type="button"
              onClick={restoreClearedAnswer}
              className="text-primary-800 underline"
            >
              실행 취소
            </button>
          </div>
        )}
        {listOpen && (
          <QuestionListDialog
            filter={listFilter}
            questions={filteredQuestions}
            allQuestions={attempt.questions}
            answers={attempt.answers}
            onFilter={setListFilter}
            onClose={() => setListOpen(false)}
            onSelect={(questionId) => {
              goToQuestion(questionId);
              setListOpen(false);
            }}
          />
        )}
        {submitOpen && (
          <SubmitDialog
            tutorial={Boolean(guide)}
            summary={summary}
            submitting={attempt.status === "SUBMITTING"}
            onClose={() => setSubmitOpen(false)}
            onShowUnanswered={() => openQuestionList("unanswered")}
            onSubmit={() => void submitAttempt("USER_SUBMITTED")}
          />
        )}
        {exitOpen && (
          <Dialog
            title="시험을 나가시겠어요?"
            description="시험 시간은 계속 흐르며 현재 답안은 자동 저장됩니다. 나가시겠어요?"
            onClose={() => setExitOpen(false)}
          >
            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton onClick={() => setExitOpen(false)}>
                계속 풀기
              </SecondaryButton>
              <PrimaryButton compact onClick={leaveAttempt}>
                나가기
              </PrimaryButton>
            </div>
          </Dialog>
        )}
        {warningOpen && (
          <Dialog
            title="남은 시간이 5분 이하예요"
            description="답안 표기란에서 안 푼 문제를 확인하고 제출 시간을 확보해 주세요."
            onClose={() => setWarningOpen(false)}
          >
            <PrimaryButton compact onClick={() => setWarningOpen(false)}>
              확인
            </PrimaryButton>
          </Dialog>
        )}
        {submitError && (
          <Dialog
            title={
              attempt.status === "RECOVERY_REQUIRED"
                ? "제출을 완료하지 못했어요"
                : "제출 오류"
            }
            description={submitError}
            onClose={() =>
              attempt.status !== "RECOVERY_REQUIRED" && setSubmitError(null)
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {attempt.status !== "RECOVERY_REQUIRED" && (
                <SecondaryButton onClick={() => setSubmitError(null)}>
                  계속 풀기
                </SecondaryButton>
              )}
              <PrimaryButton
                compact
                onClick={() =>
                  void submitAttempt(
                    attempt.submissionReason ?? "USER_SUBMITTED",
                  )
                }
              >
                제출 다시 시도
              </PrimaryButton>
            </div>
          </Dialog>
        )}
        {calculatorOpen && (
          <CalculatorDialog
            onClose={() => setCalculatorOpen(false)}
            onCalculate={() => setTutorialCalculated(true)}
          />
        )}
      </main>
      {guide && (
        <CbtTutorialOverlay
          targetSelector={tutorialTarget}
          stepNumber={tutorialStepIndex + 1}
          totalSteps={CBT_TUTORIAL_STEPS.length}
          title={guide.title}
          description={guide.description}
          completed={guide.id === "complete"}
          onExit={leaveAttempt}
          onNext={nextTutorialStep}
          nextDisabled={!tutorialActionDone}
          onRestart={() => startPreparedAttempt()}
          onFinish={finishTutorial}
        />
      )}
    </>
  );
}

function HubPage({
  activeAttempt,
  recentResult,
  onResume,
  onSession,
  onFull,
  onTutorial,
  tutorialDisabled,
  onReview,
  conflictOpen,
  onCloseConflict,
  onDiscard,
}: {
  activeAttempt: LocalAttempt | null;
  recentResult: CbtGradeResult | null;
  onResume: () => void;
  onSession: () => void;
  onFull: () => void;
  onTutorial: () => void;
  tutorialDisabled: boolean;
  onReview: () => void;
  conflictOpen: boolean;
  onCloseConflict: () => void;
  onDiscard: () => void;
}) {
  const canResume =
    activeAttempt &&
    ["RUNNING", "SUBMITTING", "WAITING", "RECOVERY_REQUIRED"].includes(
      activeAttempt.status,
    );
  return (
    <main className="min-h-dvh bg-white pb-8 text-foreground">
      <PracticeHeader title="약사국시 CBT 실전 연습" />
      <div className="mx-auto max-w-[1024px] px-4 sm:px-6">
        <section className="mt-7">
          <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
            실제 시험 흐름으로
            <br />
            시간 관리와 답안 선택을 연습해요
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            국시원 공식 서비스가 아닌 필챗 학습용 모의 기능입니다.
          </p>
        </section>
        {canResume && (
          <button
            type="button"
            onClick={onResume}
            className="mt-5 flex w-full items-center gap-3 rounded-xl bg-primary-980 px-4 py-3 text-left transition-colors hover:bg-primary-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary">
              <Play className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-semibold text-primary">
                이어서 풀기
              </strong>
              <span className="mt-0.5 block break-words text-xs leading-5 text-muted-foreground">
                {activeAttempt.session.title} ·{" "}
                {activeAttempt.session.subjectsLabel}
              </span>
            </span>
          </button>
        )}
        <div className="mt-5 flex flex-col gap-3">
          <ModeCard
            icon={<BookOpenCheck className="h-7 w-7 text-primary" />}
            title="교시별 연습"
            description="교시와 연습 시간 선택"
            onClick={onSession}
          />
          <ModeCard
            icon={<MonitorCheck className="h-7 w-7 text-primary" />}
            title="조작 튜토리얼"
            description="예제 5문항으로 조작 익히기"
            onClick={onTutorial}
            disabled={tutorialDisabled}
          />
          <ModeCard
            icon={<Clock3 className="h-7 w-7 text-primary" />}
            title="전체 4교시 실전"
            description="350문항 · 쉬는 시간 포함"
            onClick={onFull}
          />
          <ModeCard
            icon={<RotateCcw className="h-7 w-7 text-primary" />}
            title="오답 복습"
            description="제출한 문제 모음의 오답·미응답 복습"
            onClick={onReview}
          />
        </div>
        {recentResult && (
          <section className="mt-5 rounded-xl bg-accent/40 px-4 py-3">
            <p className="text-xs font-medium text-primary">최근 결과</p>
            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <strong className="text-xl font-semibold tabular-nums">
                {recentResult.score}점
              </strong>
              <span className="text-xs leading-5 text-muted-foreground">
                정답 {recentResult.correct}개 · 오답 {recentResult.incorrect}개
                · 미응답 {recentResult.unanswered}개
              </span>
            </div>
          </section>
        )}
      </div>
      {conflictOpen && (
        <Dialog
          title="진행 중인 시험이 있어요"
          description="현재 시험을 이어서 풀거나 종료한 뒤 새 연습을 시작해 주세요."
          onClose={onCloseConflict}
        >
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton
              onClick={() => {
                onCloseConflict();
                onResume();
              }}
            >
              기존 시험 이어서 풀기
            </SecondaryButton>
            <PrimaryButton compact onClick={onDiscard}>
              종료 후 새로 시작
            </PrimaryButton>
          </div>
        </Dialog>
      )}
    </main>
  );
}

function SessionSelectPage({
  loading,
  error,
  onBack,
  onSelect,
}: {
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onSelect: (sessionId: CbtSessionId) => void;
}) {
  return (
    <FlowPage title="교시 선택" onBack={onBack}>
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-destructive">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {SESSION_OPTIONS.map((session) => (
          <button
            key={session.id}
            type="button"
            disabled={loading}
            onClick={() => onSelect(session.id)}
            className="min-h-36 rounded-2xl bg-accent/60 p-5 text-left transition-colors hover:bg-primary-980 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
          >
            <span className="text-sm font-extrabold text-primary">
              {session.title}
            </span>
            <strong className="mt-2 block text-xl font-extrabold">
              {session.subjectsLabel}
            </strong>
            <span className="mt-3 block text-sm text-muted-foreground">
              {session.questionCount}문항 ·{" "}
              {formatDuration(session.durationSec)}
            </span>
          </button>
        ))}
      </div>
      {loading && (
        <LoadingIndicator
          label="문제 세트를 불러오는 중..."
          className="mt-4 text-center text-sm font-bold text-muted-foreground"
        />
      )}
    </FlowPage>
  );
}

function ResultPage({
  reviewSaveFailed,
  result,
  flagged,
  unknown,
  full,
  canRetry,
  onRetry,
  onHome,
  onReview,
}: {
  result: CbtGradeResult;
  flagged: number;
  unknown: number;
  full: boolean;
  canRetry: boolean;
  onRetry: () => void;
  onHome: () => void;
  onReview: (filter: "wrong" | "unknown") => void;
  reviewSaveFailed: boolean;
}) {
  return (
    <main className="min-h-dvh bg-white px-4 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] text-foreground sm:px-6">
      <div className="mx-auto max-w-[960px]">
        <p className="text-sm font-bold text-primary">
          {full ? "전체 실전 종합 결과" : "교시 결과"}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
          {full ? "4교시 실전을 모두 완료했어요" : "연습을 완료했어요"}
        </h1>
        {reviewSaveFailed && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            복습 기록을 저장하지 못했어요. 기기의 저장 공간과 브라우저 설정을
            확인해주세요.
          </p>
        )}
        <section className="mt-6 rounded-2xl bg-accent p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <strong className="text-4xl font-extrabold text-primary sm:text-5xl">
              {result.score}점
            </strong>
            <span className="text-sm font-bold text-muted-foreground">
              총 {result.total}문항
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 min-[480px]:grid-cols-5">
            {[
              ["정답", result.correct],
              ["오답", result.incorrect],
              ["미응답", result.unanswered],
              ["체크", flagged],
              ["모름", unknown],
            ].map(([label, value]) => (
              <ResultMetric
                key={String(label)}
                label={String(label)}
                value={Number(value)}
              />
            ))}
          </div>
        </section>
        <section className="mt-8 px-1">
          <h2 className="font-extrabold text-primary">과목별 점수</h2>
          <div className="mt-3 space-y-3">
            {result.scoresBySubject.map((item) => (
              <div
                key={item.subject}
                className="flex items-center justify-between rounded-xl bg-accent/50 px-4 py-3"
              >
                <span className="font-bold">{item.subject}</span>
                <span className="font-extrabold text-primary">
                  {item.correct}/{item.total} · {item.score}점
                </span>
              </div>
            ))}
          </div>
        </section>
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">
          필챗 자체 모의 채점 결과이며 실제 국가시험 결과와 다를 수 있습니다.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="col-span-2 h-14 rounded-xl bg-accent font-extrabold text-primary"
            >
              남은 시간으로 다시 풀기
            </button>
          )}
          <button
            type="button"
            onClick={() => onReview("wrong")}
            className="col-span-2 h-14 rounded-xl bg-primary font-extrabold text-white"
          >
            복습하기
          </button>
          <Link
            href="/learn/flashcards"
            className="col-span-2 flex h-14 items-center justify-center rounded-xl bg-accent/50 font-extrabold"
          >
            AI 플래시카드로 학습하기
          </Link>
        </div>
        <button
          type="button"
          onClick={onHome}
          className="mt-4 h-12 w-full text-sm font-bold text-muted-foreground"
        >
          CBT 허브로 돌아가기
        </button>
      </div>
    </main>
  );
}

function FullWaitingPage({
  completedSession,
  nextSession,
  sessionResult,
  remainingSec,
  loading,
  error,
  onStart,
  onHome,
}: {
  completedSession: CbtSessionSummary;
  nextSession?: CbtSessionSummary;
  sessionResult: CbtGradeResult | null;
  remainingSec: number;
  loading: boolean;
  error: string | null;
  onStart: () => void;
  onHome: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] text-foreground sm:px-6">
      <section className="w-full max-w-[760px] p-5 text-center sm:p-7">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <p className="mt-4 text-sm font-bold text-primary">
          {completedSession.title} 제출 완료
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
          잠시 쉬어 가세요
        </h1>
        {sessionResult && (
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            이번 교시 {sessionResult.correct}/{sessionResult.total} 정답 ·{" "}
            {sessionResult.score}점
          </p>
        )}
        {nextSession && (
          <div className="mt-6 rounded-2xl bg-accent p-5">
            <p className="text-xs font-bold text-primary">다음 교시</p>
            <h2 className="mt-2 text-xl font-extrabold">
              {nextSession.title} · {nextSession.subjectsLabel}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {nextSession.questionCount}문항 ·{" "}
              {formatDuration(nextSession.durationSec)}
            </p>
            <p className="mt-5 text-4xl font-extrabold tabular-nums text-primary">
              {formatDuration(remainingSec)}
            </p>
            <p className="mt-2 text-xs font-bold text-muted-foreground">
              대기 시간이 끝나면 다음 교시가 자동으로 시작됩니다.
            </p>
          </div>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-destructive">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={onStart}
          className="mt-5 h-14 w-full rounded-xl bg-primary font-extrabold text-white disabled:opacity-50"
        >
          {loading ? (
            <LoadingIndicator inline label="다음 교시 준비 중..." />
          ) : (
            "연습이므로 바로 시작"
          )}
        </button>
        <button
          type="button"
          onClick={onHome}
          className="mt-2 h-11 w-full text-sm font-bold text-muted-foreground"
        >
          CBT 허브로 나가기
        </button>
      </section>
    </main>
  );
}

function ReviewPage({
  filter,
  questions,
  index,
  onIndex,
  onFilter,
  backLabel,
  onBack,
}: {
  filter: "wrong" | "unknown";
  questions: CbtGradeResult["review"];
  index: number;
  onIndex: (index: number) => void;
  onFilter: (filter: "wrong" | "unknown") => void;
  backLabel: string;
  onBack: () => void;
}) {
  const question = questions[index];
  const reviewHeader = (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 items-center gap-2 text-sm font-bold"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </button>
      <div className="mt-4 flex gap-2" role="group" aria-label="CBT 복습 유형">
        {(
          [
            ["wrong", "오답·미응답"],
            ["unknown", "모름 표시"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => onFilter(value)}
            className={cn(
              "min-h-11 rounded-lg px-4 text-sm font-semibold",
              filter === value
                ? "bg-primary text-white"
                : "bg-accent text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
  if (!question)
    return (
      <main className="min-h-dvh bg-white px-4 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] text-foreground sm:px-6">
        <section className="mx-auto max-w-[880px] p-4 sm:p-6">
          {reviewHeader}
          <div className="py-16 text-center">
            <h1 className="text-xl font-semibold">
              {filter === "unknown"
                ? "모름 표시한 문제가 없어요"
                : "복습할 오답과 미응답이 없어요"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              다른 복습 유형을 선택하거나 CBT 연습을 이어가세요.
            </p>
          </div>
        </section>
      </main>
    );
  return (
    <main className="min-h-dvh bg-white px-4 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] text-foreground sm:px-6">
      <article className="mx-auto max-w-[880px] p-4 sm:p-6">
        {reviewHeader}
        <p className="mt-4 text-sm font-bold text-primary">
          {question.subject} · {question.topic}
        </p>
        <h1 className="mt-2 text-xl font-extrabold text-primary">
          {question.number}번 문항
        </h1>
        <p className="mt-5 whitespace-pre-wrap break-words text-lg leading-8">
          {question.stem}
        </p>
        <div className="mt-5 space-y-3">
          {question.choices.map((choice, choiceIndex) => (
            <div
              key={choiceIndex}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-xl px-4 py-3",
                choiceIndex === question.correctChoice
                  ? "bg-emerald-50"
                  : choiceIndex === question.selectedChoice
                    ? "bg-red-50"
                    : "bg-accent/40",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/75 font-extrabold">
                {choiceIndex + 1}
              </span>
              <span className="flex-1">{choice}</span>
              {choiceIndex === question.correctChoice && (
                <span className="text-xs font-extrabold text-emerald-700">
                  정답
                </span>
              )}
              {choiceIndex === question.selectedChoice &&
                choiceIndex !== question.correctChoice && (
                  <span className="text-xs font-extrabold text-destructive">
                    선택 답
                  </span>
                )}
            </div>
          ))}
        </div>
        <section className="mt-6 rounded-xl bg-accent/60 p-4">
          <h2 className="font-extrabold text-primary">해설</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {question.explanation}
          </p>
          <p className="mt-3 text-xs font-bold text-primary">
            관련 개념 · {question.conceptTags.join(" · ")}
          </p>
          {question.memo && (
            <p className="mt-4 text-sm">내 메모: {question.memo}</p>
          )}
        </section>
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onIndex(index - 1)}
            className="h-11 rounded-xl bg-accent px-4 font-bold text-primary disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm font-bold">
            {index + 1} / {questions.length}
          </span>
          <button
            type="button"
            disabled={index === questions.length - 1}
            onClick={() => onIndex(index + 1)}
            className="h-11 rounded-xl bg-primary px-4 font-bold text-white disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </article>
    </main>
  );
}

function FlowPage({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-white px-4 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] text-foreground sm:px-6">
      <div className="mx-auto max-w-[860px]">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="이전 화면"
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-primary sm:text-2xl">
            {title}
          </h1>
        </header>
        <section className="mt-6">{children}</section>
      </div>
    </main>
  );
}

function QuestionPane({
  question,
  answer,
  active,
  compact,
  locked,
  fontScale,
  noteOpen,
  onActivate,
  onPatchAnswer,
  onToggleNote,
  onClearAnswer,
}: {
  question: CbtExamQuestion;
  answer: AnswerState;
  active: boolean;
  compact: boolean;
  locked: boolean;
  fontScale: LocalAttempt["fontScale"];
  noteOpen: boolean;
  onActivate: (questionId: string) => void;
  onPatchAnswer: (
    questionId: string,
    patch: Partial<AnswerState>,
    delayMs?: number,
  ) => void;
  onToggleNote: (questionId: string) => void;
  onClearAnswer: (questionId: string) => void;
}) {
  const headingId = `cbt-question-${question.id}`;
  const typography = QUESTION_TYPOGRAPHY[fontScale];

  return (
    <article
      aria-labelledby={headingId}
      onClick={() => onActivate(question.id)}
      className={cn(
        "mx-auto min-w-0 rounded-2xl bg-white",
        compact ? "max-w-none p-4" : "max-w-[880px] p-6",
        active
          ? "border-2 border-primary"
          : "border-2 border-transparent bg-[#fafafa]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "break-words font-bold text-primary",
              typography.meta,
            )}
          >
            {question.subject} · {question.topic}
          </p>
          <div className="relative mt-3 inline-flex">
            {answer.flagged && (
              <span
                className="absolute -right-7 -top-4 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-white"
                aria-label={`${question.number}번 체크 문제`}
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
            )}
            <h2
              id={headingId}
              className={cn("font-extrabold", typography.heading)}
            >
              {question.number}번 문항
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {active && (
            <span
              className={cn(
                "rounded-full bg-primary-980 px-2 py-1 font-extrabold text-primary",
                typography.badge,
              )}
            >
              현재 문제
            </span>
          )}
          <span
            className={cn(
              "rounded-full bg-[#fafafa] px-2 py-1 font-bold",
              typography.badge,
            )}
          >
            필챗 모의 문항
          </span>
        </div>
      </div>

      <p
        className={cn("mt-6 whitespace-pre-wrap break-words", typography.stem)}
      >
        {question.stem}
      </p>

      {question.type === "case" && (
        <section className="mt-4 rounded-xl bg-sky-50 p-4">
          <p
            className={cn(
              "font-extrabold text-sky-800",
              typography.auxiliaryLabel,
            )}
          >
            사례형 문항
          </p>
          <p
            className={cn(
              "mt-1 font-medium text-sky-950",
              typography.auxiliaryBody,
            )}
          >
            동일한 환자 사례를 바탕으로 이어지는 문항입니다. 제시된 조건을
            유지해 답하세요.
          </p>
        </section>
      )}
      {(question.media ?? []).map((media) => (
        <section key={media.id} className="mt-4 rounded-xl bg-[#fafafa] p-4">
          <div
            className={cn(
              "flex items-center gap-2 font-extrabold",
              typography.auxiliaryLabel,
            )}
          >
            <Table2 className="h-4 w-4 text-primary" />
            {media.title}
          </div>
          <p
            className={cn(
              "mt-2 text-muted-foreground",
              typography.auxiliaryBody,
            )}
          >
            {media.description}
          </p>
        </section>
      ))}

      <ol className="mt-6 space-y-3" data-cbt-tutorial="answer">
        {question.choices.map((choice, choiceIndex) => {
          const selected = answer.selectedChoice === choiceIndex;
          const excluded = answer.excludedChoices.includes(choiceIndex);
          return (
            <li
              key={`${question.id}-${choiceIndex}`}
              className="flex min-w-0 items-stretch gap-2"
            >
              <button
                type="button"
                disabled={locked}
                aria-pressed={selected}
                aria-label={`${choiceIndex + 1}번 선택지${selected ? ", 선택됨" : ""}`}
                onClick={() => {
                  onPatchAnswer(question.id, { selectedChoice: choiceIndex });
                }}
                className={cn(
                  "flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left disabled:cursor-not-allowed",
                  selected
                    ? "bg-accent"
                    : excluded
                      ? "bg-gray-100 text-muted-foreground"
                      : "bg-[#fafafa] hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold",
                    typography.choiceNumber,
                    selected
                      ? "bg-primary text-white"
                      : "bg-white text-muted-foreground",
                  )}
                >
                  {choiceIndex + 1}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words font-medium",
                    typography.choice,
                    excluded && "line-through decoration-2",
                  )}
                >
                  {choice}
                </span>
                {selected && (
                  <span
                    className={cn(
                      "shrink-0 font-extrabold text-primary",
                      typography.action,
                    )}
                  >
                    선택됨
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={locked || selected}
                aria-pressed={excluded}
                aria-label={`${choiceIndex + 1}번 선택지 ${excluded ? "제외 해제" : "제외"}`}
                title={selected ? "선택한 답은 제외할 수 없어요." : undefined}
                onClick={() =>
                  onPatchAnswer(question.id, {
                    excludedChoices: excluded
                      ? answer.excludedChoices.filter(
                          (value) => value !== choiceIndex,
                        )
                      : [...answer.excludedChoices, choiceIndex],
                  })
                }
                className={cn(
                  "min-h-[56px] w-14 shrink-0 rounded-xl font-extrabold disabled:cursor-not-allowed disabled:opacity-40",
                  typography.action,
                  excluded
                    ? "bg-red-50 text-destructive"
                    : "bg-[#fafafa] text-muted-foreground hover:bg-accent/50",
                )}
              >
                {excluded ? "복원" : "제외"}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap gap-2 pt-2">
        <ToolButton
          active={answer.flagged}
          tutorialTarget="check"
          icon={<Flag className="h-4 w-4" />}
          label="체크"
          textClassName={typography.action}
          disabled={locked}
          onClick={() => {
            onPatchAnswer(question.id, { flagged: !answer.flagged });
          }}
        />
        <ToolButton
          active={answer.unknown}
          tutorialTarget="unknown"
          icon={<CircleHelp className="h-4 w-4" />}
          label="모름"
          textClassName={typography.action}
          disabled={locked}
          onClick={() => {
            onPatchAnswer(question.id, { unknown: !answer.unknown });
          }}
        />
        <ToolButton
          active={noteOpen || answer.memo.trim().length > 0}
          tutorialTarget="memo"
          icon={<StickyNote className="h-4 w-4" />}
          label="메모"
          textClassName={typography.action}
          disabled={locked}
          onClick={() => onToggleNote(question.id)}
        />
        <ToolButton
          icon={<RotateCcw className="h-4 w-4" />}
          label="답 지우기"
          textClassName={typography.action}
          disabled={locked || answer.selectedChoice === null}
          onClick={() => onClearAnswer(question.id)}
        />
      </div>

      {noteOpen && (
        <div className="mt-4" data-cbt-tutorial="memo-input">
          <textarea
            value={answer.memo}
            maxLength={1000}
            rows={5}
            disabled={locked}
            onChange={(event) =>
              onPatchAnswer(question.id, { memo: event.target.value }, 500)
            }
            placeholder="풀이 과정과 확인할 내용을 메모하세요."
            className={cn(
              "w-full resize-none rounded-xl bg-[#fafafa] p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary",
              typography.memo,
            )}
          />
          <p
            className={cn(
              "mt-1 text-right text-muted-foreground",
              typography.counter,
            )}
          >
            {answer.memo.length} / 1,000
          </p>
        </div>
      )}
    </article>
  );
}

function ModeCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className="flex w-full items-center gap-4 py-3 text-left transition-transform active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base font-semibold leading-6 text-foreground">
          {title}
        </strong>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
function ChoiceCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-28 rounded-xl p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        active ? "bg-accent text-primary" : "bg-accent/30 hover:bg-accent/50",
      )}
    >
      <strong className="block font-extrabold">{title}</strong>
      <span className="mt-1 block text-sm text-muted-foreground">
        {description}
      </span>
    </button>
  );
}
function CheckRow({
  checked,
  title,
  description,
  readOnly,
  onChange,
}: {
  checked: boolean;
  title: string;
  description: string;
  readOnly?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "mt-3 flex min-h-16 items-center gap-3 rounded-xl px-4 py-3",
        checked ? "bg-accent/60" : "bg-accent/30",
        readOnly ? "cursor-default" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-primary"
      />
      <span>
        <strong className="block text-sm font-semibold">{title}</strong>
        <span className="mt-1 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
function RotateNotice() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-900">
      <RotateCcw className="h-5 w-5" />
      <div>
        <strong className="text-sm font-semibold">가로로 돌려 주세요</strong>
        <p className="mt-1 text-xs">
          화면을 돌려도 답안과 타이머는 유지됩니다.
        </p>
      </div>
    </div>
  );
}
function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-accent/40 p-4">
          <dt className="text-xs font-semibold text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-2 font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function ToolButton({
  icon,
  label,
  active,
  disabled,
  textClassName,
  onClick,
  tutorialTarget,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  textClassName?: string;
  onClick: () => void;
  tutorialTarget?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      data-cbt-tutorial={tutorialTarget}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl px-4 font-bold disabled:opacity-40",
        textClassName ?? "text-sm",
        active ? "bg-accent text-primary" : "bg-[#fafafa] hover:bg-accent/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
function NavButton({
  label,
  icon,
  iconAfter,
  disabled,
  onClick,
  tutorialTarget,
}: {
  label: string;
  icon: ReactNode;
  iconAfter?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tutorialTarget?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-cbt-tutorial={tutorialTarget}
      className="flex h-11 items-center gap-1 rounded-xl bg-[#fafafa] px-3 text-sm font-bold hover:bg-accent/50 disabled:opacity-40"
    >
      {!iconAfter && icon}
      {label}
      {iconAfter && icon}
    </button>
  );
}
function FilterButton({
  label,
  count,
  accent,
  onClick,
}: {
  label: string;
  count: number;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl px-3 text-xs font-bold",
        accent
          ? "bg-red-50 text-destructive"
          : "bg-[#fafafa] hover:bg-accent/50",
      )}
    >
      {label} {count}
    </button>
  );
}
function SaveStateBadge({ status }: { status: SaveStatus }) {
  const labels: Record<SaveStatus, string> = {
    saved: "저장됨",
    saving: "저장 중",
    offline: "오프라인 저장됨",
    failed: "저장 실패",
  };
  return (
    <div
      role="status"
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold",
        status === "failed"
          ? "bg-red-50 text-destructive"
          : "bg-[#fafafa] text-muted-foreground",
      )}
    >
      {status === "saving" ? (
        <PillLoader size={24} decorative />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {labels[status]}
    </div>
  );
}

function QuestionListDialog({
  filter,
  questions,
  allQuestions,
  answers,
  onFilter,
  onClose,
  onSelect,
}: {
  filter: ListFilter;
  questions: CbtExamQuestion[];
  allQuestions: CbtExamQuestion[];
  answers: Record<string, AnswerState>;
  onFilter: (filter: ListFilter) => void;
  onClose: () => void;
  onSelect: (questionId: string) => void;
}) {
  const counts = {
    all: allQuestions.length,
    flagged: allQuestions.filter((q) => answers[q.id]?.flagged).length,
    unanswered: allQuestions.filter(
      (q) => answers[q.id]?.selectedChoice == null,
    ).length,
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      role="dialog"
      aria-modal="true"
      aria-label="문제 목록"
    >
      <section className="flex max-h-[80dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white">
        <header className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-bold text-primary">문제 탐색</p>
            <h2 className="text-xl font-extrabold">문제 목록</h2>
          </div>
          <button
            type="button"
            aria-label="문제 목록 닫기"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-accent/50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {(
            [
              ["all", "전체"],
              ["flagged", "체크"],
              ["unanswered", "안 푼 문제"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => onFilter(key)}
              className={cn(
                "h-11 rounded-xl px-4 text-sm font-bold",
                filter === key
                  ? "bg-accent text-primary"
                  : "bg-[#fafafa] hover:bg-accent/50",
              )}
            >
              {label} {counts[key]}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto p-4">
          {questions.length === 0 ? (
            <p className="py-16 text-center text-sm font-bold text-muted-foreground">
              현재 조건에 맞는 문제가 없어요.
            </p>
          ) : (
            questions.map((question) => {
              const answer = answers[question.id] ?? emptyAnswer();
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => onSelect(question.id)}
                  className="mb-3 flex min-h-16 w-full items-center gap-3 rounded-xl bg-[#fafafa] p-3 text-left hover:bg-accent/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-extrabold">
                    {question.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-bold">
                      {question.stem}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      선택 답{" "}
                      {answer.selectedChoice === null
                        ? "없음"
                        : `${answer.selectedChoice + 1}번`}
                    </span>
                  </span>
                  <span
                    className="flex gap-1"
                    aria-label={[
                      answer.flagged ? "체크" : "",
                      answer.unknown ? "모름" : "",
                      answer.memo.trim() ? "메모 있음" : "",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  >
                    {answer.flagged && (
                      <Flag className="h-4 w-4 text-primary" />
                    )}
                    {answer.unknown && (
                      <CircleHelp className="h-4 w-4 text-sky-700" />
                    )}
                    {answer.memo.trim() && (
                      <StickyNote className="h-4 w-4 text-amber-700" />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function SubmitDialog({
  summary,
  submitting,
  onClose,
  onShowUnanswered,
  onSubmit,
  tutorial = false,
}: {
  summary: {
    answered: number;
    unanswered: number;
    flagged: number;
    unknown: number;
  };
  submitting: boolean;
  onClose: () => void;
  onShowUnanswered: () => void;
  onSubmit: () => void;
  tutorial?: boolean;
}) {
  return (
    <Dialog
      title={tutorial ? "예제 답안을 확인해 보세요" : "답안을 제출할까요?"}
      tutorialTarget="submit-panel"
      description={
        tutorial
          ? "실전에서도 제출 전에 응답과 표시한 문제를 확인할 수 있어요."
          : summary.unanswered > 0
            ? `아직 풀지 않은 문제가 ${summary.unanswered}개 있어요.`
            : "모든 문제에 답했습니다. 제출 후에는 답을 수정할 수 없어요."
      }
      onClose={onClose}
    >
      <div className="grid grid-cols-4 gap-2">
        {[
          ["푼 문제", summary.answered],
          ["안 푼 문제", summary.unanswered],
          ["체크", summary.flagged],
          ["모름", summary.unknown],
        ].map(([label, value]) => (
          <ResultMetric
            key={String(label)}
            label={String(label)}
            value={Number(value)}
          />
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        {!tutorial && summary.unanswered > 0 && (
          <SecondaryButton onClick={onShowUnanswered}>
            안 푼 문제 확인
          </SecondaryButton>
        )}
        <PrimaryButton compact disabled={submitting} onClick={onSubmit}>
          {tutorial ? (
            "튜토리얼 마치기"
          ) : submitting ? (
            <LoadingIndicator inline label="제출 중..." />
          ) : summary.unanswered > 0 ? (
            "그래도 제출"
          ) : (
            "답안 제출"
          )}
        </PrimaryButton>
        <button
          type="button"
          onClick={onClose}
          className="h-11 text-sm font-bold text-muted-foreground"
        >
          계속 풀기
        </button>
      </div>
    </Dialog>
  );
}

type CalculatorOperator = "+" | "−" | "×" | "÷";

function CalculatorDialog({
  onClose,
  onCalculate,
}: {
  onClose: () => void;
  onCalculate?: () => void;
}) {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalculatorOperator | null>(null);
  const [replaceDisplay, setReplaceDisplay] = useState(false);
  const [completedExpression, setCompletedExpression] = useState<string | null>(
    null,
  );

  const calculate = (left: number, right: number, op: CalculatorOperator) => {
    if (op === "+") return left + right;
    if (op === "−") return left - right;
    if (op === "×") return left * right;
    return right === 0 ? Number.NaN : left / right;
  };
  const formatValue = (value: number) =>
    Number.isFinite(value)
      ? Number(value.toPrecision(12)).toString().slice(0, 16)
      : "오류";
  const enterDigit = (digit: string) => {
    setCompletedExpression(null);
    if (display === "오류" || replaceDisplay) {
      setDisplay(digit === "." ? "0." : digit);
      setReplaceDisplay(false);
      return;
    }
    if (digit === "." && display.includes(".")) return;
    setDisplay((current) =>
      digit === "."
        ? `${current}.`
        : current === "0"
          ? digit
          : `${current}${digit}`.slice(0, 16),
    );
  };
  const chooseOperator = (nextOperator: CalculatorOperator) => {
    const value = Number(display);
    if (!Number.isFinite(value)) return;
    setCompletedExpression(null);
    if (accumulator !== null && operator && !replaceDisplay) {
      const next = calculate(accumulator, value, operator);
      setDisplay(formatValue(next));
      setAccumulator(Number.isFinite(next) ? next : null);
      if (!Number.isFinite(next)) {
        setCompletedExpression(
          `${formatValue(accumulator)} ${operator} ${display} = 오류`,
        );
        setOperator(null);
        setReplaceDisplay(true);
        return;
      }
    } else {
      setAccumulator(value);
    }
    setOperator(nextOperator);
    setReplaceDisplay(true);
  };
  const resolve = () => {
    if (accumulator === null || !operator) return;
    const next = calculate(accumulator, Number(display), operator);
    const result = formatValue(next);
    setCompletedExpression(
      `${formatValue(accumulator)} ${operator} ${display} = ${result}`,
    );
    setDisplay(result);
    setAccumulator(null);
    setOperator(null);
    setReplaceDisplay(true);
    onCalculate?.();
  };
  const clear = () => {
    setDisplay("0");
    setAccumulator(null);
    setOperator(null);
    setReplaceDisplay(false);
    setCompletedExpression(null);
  };
  const editDisplay = (edit: (value: string) => string) => {
    if (display === "오류") return;
    setCompletedExpression(null);
    setDisplay(edit(display));
    setReplaceDisplay(false);
  };
  const expression =
    completedExpression ??
    (accumulator !== null && operator
      ? `${formatValue(accumulator)} ${operator}${replaceDisplay ? "" : ` ${display}`}`
      : null);

  return (
    <Dialog
      title="시험용 계산기"
      tutorialTarget="calculator-panel"
      description="계산 결과는 답안에 자동으로 입력되지 않습니다."
      onClose={onClose}
    >
      <div className="mx-auto max-w-[360px]">
        <div
          role="status"
          aria-label={
            expression
              ? `계산식 ${expression}. 계산 값 ${display}`
              : `계산 값 ${display}`
          }
          className="mb-3 flex min-h-20 flex-col items-end justify-end gap-1 rounded-xl bg-accent/50 p-3 text-right sm:min-h-28 sm:gap-2 sm:p-4"
        >
          <p className="min-h-5 w-full break-all text-sm font-bold text-muted-foreground">
            {expression ?? "\u00a0"}
          </p>
          <p className="w-full break-all text-3xl font-extrabold tabular-nums text-primary">
            {display}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <CalculatorKey label="C" accent onClick={clear} />
          <CalculatorKey
            label="±"
            onClick={() =>
              editDisplay((current) =>
                current.startsWith("-")
                  ? current.slice(1)
                  : current === "0"
                    ? current
                    : `-${current}`,
              )
            }
          />
          <CalculatorKey
            label="%"
            onClick={() =>
              editDisplay((current) => formatValue(Number(current) / 100))
            }
          />
          <CalculatorKey label="÷" accent onClick={() => chooseOperator("÷")} />
          {["7", "8", "9"].map((digit) => (
            <CalculatorKey
              key={digit}
              label={digit}
              onClick={() => enterDigit(digit)}
            />
          ))}
          <CalculatorKey label="×" accent onClick={() => chooseOperator("×")} />
          {["4", "5", "6"].map((digit) => (
            <CalculatorKey
              key={digit}
              label={digit}
              onClick={() => enterDigit(digit)}
            />
          ))}
          <CalculatorKey label="−" accent onClick={() => chooseOperator("−")} />
          {["1", "2", "3"].map((digit) => (
            <CalculatorKey
              key={digit}
              label={digit}
              onClick={() => enterDigit(digit)}
            />
          ))}
          <CalculatorKey label="+" accent onClick={() => chooseOperator("+")} />
          <CalculatorKey
            label="⌫"
            onClick={() =>
              editDisplay((current) => {
                const next = current.slice(0, -1);
                return next === "" || next === "-" ? "0" : next;
              })
            }
          />
          <CalculatorKey label="0" onClick={() => enterDigit("0")} />
          <CalculatorKey label="." onClick={() => enterDigit(".")} />
          <CalculatorKey label="=" primary onClick={resolve} />
        </div>
      </div>
    </Dialog>
  );
}

function CalculatorKey({
  label,
  accent,
  primary,
  onClick,
}: {
  label: string;
  accent?: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl text-lg font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:h-14",
        primary
          ? "bg-primary text-white"
          : accent
            ? "bg-primary-980 text-primary"
            : "bg-accent/40",
      )}
    >
      {label}
    </button>
  );
}

function Dialog({
  title,
  description,
  onClose,
  children,
  tutorialTarget,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  tutorialTarget?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-5"
      role="dialog"
      aria-modal="true"
    >
      <section
        data-cbt-tutorial={tutorialTarget}
        className="w-full max-w-[min(720px,80vw)] rounded-2xl bg-white p-5"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}
function PrimaryButton({
  children,
  onClick,
  disabled,
  compact,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl bg-primary font-extrabold text-white disabled:bg-gray-100 disabled:text-gray-500",
        compact ? "h-12" : "mt-6 h-14",
      )}
    >
      {children}
    </button>
  );
}
function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-full rounded-xl bg-accent/50 text-sm font-extrabold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}
function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/80 p-3 text-center">
      <strong className="text-xl font-extrabold">{value}</strong>
      <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
function CenteredMessage({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white p-5">
      <section className="w-full max-w-md p-6 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-4 text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
      </section>
    </main>
  );
}
