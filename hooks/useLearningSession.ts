"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchAPI } from "@/lib/client/fetch";
import {
  LearningCommands,
  type Attempt,
  type Catalog,
  type Grade,
  type Result,
  type Source,
} from "@/lib/learning/api";
import {
  answerUpdates,
  attemptIndex,
  secondsRemaining,
} from "@/lib/learning/presentation";

type HistoryItem = {
  attemptId: string;
  title: string;
  state: string;
  mode?: string;
};
type Effect = {
  attempt?: Attempt;
  grade?: Grade;
  details?: { bookmarked?: boolean };
};
const base = "/api/learning";
const errorMessage = (error: unknown) =>
  error instanceof ApiError && error.status === 401
    ? "로그인 후 학습할 수 있어요."
    : error instanceof ApiError &&
        [
          "NO_NEW_QUESTIONS",
          "INSUFFICIENT_NEW_QUESTIONS",
          "CBT_RETRY_UNAVAILABLE",
          "EXAM_CONTENT_UNAVAILABLE",
        ].includes(error.code ?? "")
      ? error.message
      : "요청을 완료하지 못했어요. 잠시 후 다시 시도해주세요.";
export function useLearningSession(source: Source) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [memos, setMemos] = useState<Record<string, string>>({});
  const memoRef = useRef<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const clockOffset = useRef(0);
  const commands = useRef(new LearningCommands());
  const lock = useRef(false);
  const revision = useRef(0);
  const active = useRef(true);
  const current = useRef<Attempt | null>(null);
  const pendingEffect = useRef<((effect: Effect) => void) | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const apply = useCallback(
    (next: Attempt) => {
      if (!active.current) return;
      if (next.source !== source) throw new Error("다른 종류의 응시입니다.");
      const serverTime = Date.parse(next.serverNow);
      if (Number.isFinite(serverTime))
        clockOffset.current = serverTime - Date.now();
      if (current.current?.attemptId !== next.attemptId) {
        setGrades({});
        setResult(null);
        memoRef.current = {};
        setMemos({});
      }
      current.current = next;
      setAttempt(next);
      setNow(Date.now());
      // Only clear notes whose exact values were acknowledged by the server.
      const remaining = { ...memoRef.current };
      next.savedAnswers.forEach((a) => {
        if (remaining[a.attemptQuestionId] === a.memo || a.finalized)
          delete remaining[a.attemptQuestionId];
      });
      memoRef.current = remaining;
      setMemos(remaining);
      const url = new URL(window.location.href);
      url.searchParams.set("attempt", next.attemptId);
      window.history.replaceState(null, "", url);
    },
    [source],
  );
  const recover = useCallback(
    async (id: string) => {
      const requestRevision = revision.current;
      const next: Attempt = await fetchAPI(
        `${base}/attempts/${encodeURIComponent(id)}`,
        "GET",
      );
      if (requestRevision === revision.current) apply(next);
      return next;
    },
    [apply],
  );
  const loadHistory = useCallback(
    async (before?: string) => {
      const page = await fetchAPI(`${base}/attempts`, "GET", {
        source,
        before,
        limit: 20,
      });
      if (!active.current) return;
      setHistory((previous) =>
        before ? [...previous, ...page.items] : page.items,
      );
      setCursor(page.nextCursor);
    },
    [source],
  );
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data: Catalog = await fetchAPI(`${base}/catalog`, "GET", {
        source,
      });
      if (!active.current) return;
      setCatalog(data);
      const id = new URLSearchParams(window.location.search).get("attempt");
      if (id) await recover(id);
      await loadHistory();
    } catch (error) {
      if (active.current) setError(errorMessage(error));
    } finally {
      if (active.current) setLoading(false);
    }
  }, [source, recover, loadHistory]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = attempt
    ? secondsRemaining(attempt, now, clockOffset.current)
    : null;
  useEffect(() => {
    if (!attempt || attempt.state === "COMPLETED") return;
    const refresh = () => {
      if (
        !lock.current &&
        !commands.current.pending &&
        !Object.keys(memoRef.current).length &&
        document.visibilityState === "visible"
      )
        void recover(attempt.attemptId).catch(() =>
          setError("현재 응시 상태를 확인하지 못했어요. 다시 연결해주세요."),
        );
    };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    if (remaining === 0) refresh();
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [attempt?.attemptId, attempt?.state, remaining === 0, recover]);
  const execute = async (
    action: () => Promise<Effect>,
    after?: (effect: Effect) => void,
    retry = false,
  ) => {
    if (lock.current || (!retry && commands.current.pending)) return false;
    revision.current++;
    lock.current = true;
    setBusy(true);
    setError("");
    if (!retry) pendingEffect.current = after ?? null;
    try {
      const response = await action();
      if (!active.current) return false;
      if (response.attempt) apply(response.attempt);
      pendingEffect.current?.(response);
      pendingEffect.current = null;
      return true;
    } catch (error) {
      if (!active.current) return false;
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        current.current
      ) {
        await recover(current.current.attemptId).catch(() => undefined);
        setError(
          "다른 화면에서 응시 내용이 변경됐어요. 최신 답안을 확인하고 다시 시도해주세요.",
        );
      } else setError(errorMessage(error));
      if (!commands.current.pending) pendingEffect.current = null;
      return false;
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  };
  const command = (
    path: string,
    method: string,
    body: Record<string, unknown>,
    after?: (effect: Effect) => void,
  ) =>
    execute(
      () => commands.current.send<Effect>(`${base}${path}`, method, body),
      after,
    );
  const acknowledgeMemos = (updates: ReturnType<typeof answerUpdates>) => {
    const remaining = { ...memoRef.current };
    for (const update of updates) {
      if (
        "memo" in update &&
        remaining[update.attemptQuestionId] === update.memo
      )
        delete remaining[update.attemptQuestionId];
    }
    memoRef.current = remaining;
    setMemos(remaining);
  };
  const writeAnswers = (
    questionId?: string,
    patch: Record<string, unknown> = {},
    nextQuestionId?: string,
  ) => {
    const a = current.current;
    if (!a || a.state !== "IN_PROGRESS") return Promise.resolve(false);
    const updates = answerUpdates(a, memoRef.current, questionId, patch);
    return command(
      `/attempts/${a.attemptId}/answers`,
      "PUT",
      {
        updates,
        currentQuestionId: nextQuestionId ?? a.currentQuestionId,
      },
      () => acknowledgeMemos(updates),
    );
  };
  const setMemo = (questionId: string, memo: string) => {
    setError("");
    memoRef.current = { ...memoRef.current, [questionId]: memo };
    setMemos(memoRef.current);
  };
  const flushMemos = async () =>
    current.current?.state !== "IN_PROGRESS" ||
    !Object.keys(memoRef.current).length ||
    (await writeAnswers());
  const navigate = async (id: string) => {
    const a = current.current;
    if (
      !a ||
      !a.currentSectionQuestions.some((q) => q.attemptQuestionId === id)
    )
      return false;
    if (a.state !== "IN_PROGRESS") {
      setAttempt({ ...a, currentQuestionId: id });
      current.current = { ...a, currentQuestionId: id };
      return true;
    }
    return writeAnswers(undefined, {}, id);
  };
  const grade = async (reveal: boolean) => {
    if (!(await flushMemos())) return false;
    const a = current.current;
    if (!a) return false;
    const id = a.currentQuestionId;
    const answer = a.savedAnswers.find((v) => v.attemptQuestionId === id);
    if (!answer || answer.finalized || a.state !== "IN_PROGRESS") return false;
    return command(
      `/attempts/${a.attemptId}/questions/${id}/grade`,
      "POST",
      {
        expectedVersion: answer.version,
        action: reveal ? "REVEAL" : "ANSWER",
        ...(!reveal ? { selectedChoiceId: answer.selectedChoiceId } : {}),
      },
      (response) => {
        if (response.grade)
          setGrades((previous) => ({ ...previous, [id]: response.grade! }));
      },
    );
  };
  const submitSection = () => {
    const a = current.current;
    const section = a?.sections.find((s) => s.sectionId === a.currentSectionId);
    if (!a || !section || a.state !== "IN_PROGRESS")
      return Promise.resolve(false);
    const finalUpdates = answerUpdates(a, memoRef.current);
    return command(
      `/attempts/${a.attemptId}/sections/${section.sectionId}/submit`,
      "POST",
      {
        expectedSectionVersion: section.version,
        finalUpdates,
      },
      () => acknowledgeMemos(finalUpdates),
    );
  };
  const showResult = async () => {
    const a = current.current;
    if (!a?.resultAvailable) return false;
    return execute(async () => {
      const next: Result = await fetchAPI(
        `${base}/attempts/${a.attemptId}/result`,
        "GET",
      );
      if (active.current) setResult(next);
      return {};
    });
  };
  const leave = async () => {
    if (!(await flushMemos()) || lock.current || commands.current.pending)
      return false;
    revision.current++;
    current.current = null;
    setAttempt(null);
    setResult(null);
    setGrades({});
    memoRef.current = {};
    setMemos({});
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("attempt");
    window.history.replaceState(null, "", url);
    void loadHistory().catch(() => setError("응시 내역을 불러오지 못했어요."));
    return true;
  };
  const bookmark = (questionId: string, enabled: boolean) => {
    const q = current.current?.currentSectionQuestions.find(
      (q) => q.attemptQuestionId === questionId,
    );
    if (!q) return Promise.resolve(false);
    return command(
      `/questions/${q.sourceQuestionVersionId}/bookmark`,
      enabled ? "PUT" : "DELETE",
      {},
      () =>
        setBookmarks((previous) => ({
          ...previous,
          [q.sourceQuestionVersionId]: enabled,
        })),
    );
  };
  return {
    source,
    catalog,
    attempt,
    result,
    grades,
    history,
    cursor,
    bookmarks,
    memos,
    busy,
    loading,
    error,
    remaining,
    index: attempt ? attemptIndex(attempt) : 0,
    pending: !!commands.current.pending,
    disabled: busy || !!commands.current.pending,
    retry: () =>
      execute(() => commands.current.retry<Effect>(), undefined, true),
    reload: load,
    resume: (id: string) =>
      execute(async () => ({ attempt: await recover(id) })),
    moreHistory: () =>
      loadHistory(cursor ?? undefined).catch(() =>
        setError("응시 내역을 불러오지 못했어요."),
      ),
    startHandcrafted: (subjectId: string, topicId: string, count: number) => {
      const subject = catalog?.subjects.find((s) => s.subjectId === subjectId);
      const available = topicId
        ? subject?.topics.find((t) => t.topicId === topicId)?.availableCount
        : subject?.availableCount;
      if (
        !subject ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > Math.min(30, available ?? 0)
      )
        return Promise.resolve(false);
      return command("/handcrafted/attempts", "POST", {
        sourceRevisions: subject.sourceRevisions,
        subjectId,
        ...(topicId ? { topicId } : {}),
        questionCount: count,
      });
    },
    startCbt: (bankId: string, ordinal: number, quick: boolean) => {
      const bank = catalog?.banks.find((b) => b.bankId === bankId);
      if (!bank) return Promise.resolve(false);
      return command("/cbt/attempts", "POST", {
        bankId,
        revisionId: bank.revisionId,
        mode: ordinal ? "SESSION" : "FULL",
        timingMode: ordinal && quick ? "QUICK" : "STANDARD",
        questionCount: ordinal && quick ? 25 : 100,
        ...(ordinal ? { sectionOrdinal: ordinal } : {}),
      });
    },
    retryCbt: (attemptId: string) =>
      source === "CBT"
        ? command(
            `/cbt/attempts/${encodeURIComponent(attemptId)}/retry`,
            "POST",
            {},
          )
        : Promise.resolve(false),
    reconnect: () =>
      Object.keys(memoRef.current).length
        ? flushMemos()
        : current.current
          ? execute(async () => ({
              attempt: await recover(current.current!.attemptId),
            }))
          : load(),
    writeAnswers,
    setMemo,
    flushMemos,
    navigate,
    grade,
    submitSection,
    showResult,
    leave,
    bookmark,
    startNextSection: () => {
      const a = current.current;
      return a
        ? command(
            `/attempts/${a.attemptId}/sections/${a.currentSectionId}/start`,
            "POST",
            {},
          )
        : Promise.resolve(false);
    },
  };
}
export type LearningSession = ReturnType<typeof useLearningSession>;
