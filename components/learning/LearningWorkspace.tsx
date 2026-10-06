"use client";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CustomHeader } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { ApiError, fetchAPI } from "@/lib/client/fetch";
import {
  LearningCommands,
  type Attempt,
  type Catalog,
  type Command,
  type Grade,
  type Result,
  type Source,
} from "@/lib/learning/api";

export default function LearningWorkspace({ source }: { source: Source }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [history, setHistory] = useState<
    { attemptId: string; title: string; state: string }[]
  >([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [bankId, setBankId] = useState("");
  const [ordinal, setOrdinal] = useState(0);
  const [count, setCount] = useState(5);
  const [quick, setQuick] = useState(false);
  const [index, setIndex] = useState(0);
  const [memo, setMemo] = useState("");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const clockOffset = useRef(0);
  const commands = useRef(new LearningCommands());
  const lock = useRef(false);
  const revision = useRef(0);
  const memoDirty = useRef(false);
  const base = "/api/learning";
  const subject = catalog?.subjects.find(
    (item) => item.subjectId === subjectId,
  );
  const bank = catalog?.banks.find((item) => item.bankId === bankId);
  const question = attempt?.currentSectionQuestions[index];
  const answer = attempt?.savedAnswers.find(
    (item) => item.attemptQuestionId === question?.attemptQuestionId,
  );
  const section = attempt?.sections.find(
    (item) => item.sectionId === attempt.currentSectionId,
  );
  const title = source === "CBT" ? "CBT" : "수제 문제";

  const apply = useCallback((next: Attempt) => {
    clockOffset.current = Date.parse(next.serverNow) - Date.now();
    setNow(Date.now());
    setAttempt(next);
    const nextIndex = Math.max(
      0,
      next.currentSectionQuestions.findIndex(
        (q) => q.attemptQuestionId === next.currentQuestionId,
      ),
    );
    setIndex(nextIndex);
    const current = next.currentSectionQuestions[nextIndex];
    memoDirty.current = false;
    setMemo(
      next.savedAnswers.find(
        (a) => a.attemptQuestionId === current?.attemptQuestionId,
      )?.memo ?? "",
    );
    const url = new URL(window.location.href);
    url.searchParams.set("attempt", next.attemptId);
    window.history.replaceState(null, "", url);
  }, []);
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
  const loadHistory = async (before?: string) => {
    const page = await fetchAPI(`${base}/attempts`, "GET", {
      source,
      before,
      limit: 20,
    });
    setHistory((prev) => (before ? [...prev, ...page.items] : page.items));
    setCursor(page.nextCursor);
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Catalog = await fetchAPI(`${base}/catalog`, "GET", {
          source,
        });
        if (cancelled) return;
        setCatalog(data);
        setSubjectId(data.subjects[0]?.subjectId ?? "");
        setBankId(data.banks[0]?.bankId ?? "");
        const id = new URLSearchParams(window.location.search).get("attempt");
        if (id) await recover(id);
        await loadHistory();
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "불러오기에 실패했습니다.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, recover]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const deadline =
    attempt?.state === "BREAK"
      ? section?.scheduledStartAt
      : section?.deadlineAt;
  const remaining = deadline
    ? Math.max(
        0,
        Math.ceil((Date.parse(deadline) - now - clockOffset.current) / 1000),
      )
    : null;
  useEffect(() => {
    if (!attempt || attempt.state === "COMPLETED") return;
    const refresh = () => {
      if (
        !lock.current &&
        !memoDirty.current &&
        !commands.current.pending &&
        document.visibilityState === "visible"
      ) {
        void recover(attempt.attemptId).catch((e) => setError(e.message));
      }
    };
    // Reconcile server deadlines and transitions; never finalize using the local clock.
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    if (remaining === 0) refresh();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [attempt?.attemptId, attempt?.state, remaining === 0, recover]);

  const run = async (operation: () => Promise<Command>) => {
    if (lock.current) return;
    revision.current += 1;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await operation();
      if (response.attempt) apply(response.attempt);
      setGrade(response.grade ?? null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && attempt) {
        const draftMemo = memo;
        await recover(attempt.attemptId).catch(() => undefined);
        setMemo(draftMemo);
        memoDirty.current = true;
        setError(
          `${e.message} 최신 상태를 불러왔습니다. 변경 내용을 확인한 뒤 다시 저장해주세요.`,
        );
      } else setError(e instanceof Error ? e.message : "요청에 실패했습니다.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const command = (
    path: string,
    method: string,
    body: Record<string, unknown>,
  ) =>
    run(() => commands.current.send<Command>(`${base}${path}`, method, body));
  const start = () => {
    if (source === "HANDCRAFTED" && subject) {
      void command("/handcrafted/attempts", "POST", {
        sourceRevisions: subject.sourceRevisions,
        subjectId,
        ...(topicId ? { topicId } : {}),
        questionCount: count,
      });
    } else if (bank) {
      void command("/cbt/attempts", "POST", {
        bankId: bank.bankId,
        revisionId: bank.revisionId,
        mode: ordinal ? "SESSION" : "FULL",
        timingMode: ordinal && quick ? "QUICK" : "STANDARD",
        ...(ordinal ? { sectionOrdinal: ordinal } : {}),
      });
    }
  };
  const save = (
    changes: Record<string, unknown> = {},
    nextQuestionId?: string,
  ) => {
    if (!attempt || !question || !answer) return;
    void command(`/attempts/${attempt.attemptId}/answers`, "PUT", {
      updates: answer.finalized
        ? []
        : [
            {
              attemptQuestionId: question.attemptQuestionId,
              expectedVersion: answer.version,
              memo,
              ...changes,
            },
          ],
      currentQuestionId: nextQuestionId ?? question.attemptQuestionId,
    });
  };
  const showResult = async () => {
    if (!attempt) return;
    setBusy(true);
    setError("");
    try {
      setResult(
        await fetchAPI(`${base}/attempts/${attempt.attemptId}/result`, "GET"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "결과를 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const disabled = busy || !!commands.current.pending;
  return (
    <div className="min-h-dvh bg-background pb-20">
      <CustomHeader title={title} />
      <main className="mx-auto max-w-3xl space-y-5 p-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {commands.current.pending && (
          <Button
            disabled={busy}
            onClick={() => void run(() => commands.current.retry<Command>())}
          >
            같은 요청 다시 전송
          </Button>
        )}
        {!attempt ? (
          <>
            <h1 className="text-xl font-semibold">{title} 시작하기</h1>
            {!catalog ? (
              !error && (
                <LoadingIndicator label="문제 목록을 불러오는 중입니다." />
              )
            ) : !catalog.banks.length ? (
              <p>아직 공개된 문제가 없습니다.</p>
            ) : (
              <div className="space-y-4 rounded-2xl border p-5">
                {source === "HANDCRAFTED" ? (
                  <>
                    <label className="block">
                      과목
                      <select
                        aria-label="과목"
                        className="mt-2 w-full rounded-lg border p-3"
                        value={subjectId}
                        onChange={(e) => {
                          setSubjectId(e.target.value);
                          setTopicId("");
                        }}
                      >
                        {catalog.subjects.map((s) => (
                          <option key={s.subjectId} value={s.subjectId}>
                            {s.name} ({s.availableCount}문항)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      주제
                      <select
                        aria-label="주제"
                        className="mt-2 w-full rounded-lg border p-3"
                        value={topicId}
                        onChange={(e) => setTopicId(e.target.value)}
                      >
                        <option value="">전체</option>
                        {subject?.topics.map((t) => (
                          <option key={t.topicId} value={t.topicId}>
                            {t.name} ({t.availableCount}문항)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      문항 수
                      <input
                        className="ml-3 w-20 rounded border p-2"
                        type="number"
                        min={1}
                        max={30}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block">
                      시험
                      <select
                        className="mt-2 w-full rounded-lg border p-3"
                        value={bankId}
                        onChange={(e) => {
                          setBankId(e.target.value);
                          setOrdinal(0);
                        }}
                      >
                        {catalog.banks.map((b) => (
                          <option key={b.bankId} value={b.bankId}>
                            {b.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      응시 방식
                      <select
                        className="mt-2 w-full rounded-lg border p-3"
                        value={ordinal}
                        onChange={(e) => setOrdinal(Number(e.target.value))}
                      >
                        <option value={0}>전체 시험</option>
                        {bank?.sections
                          .filter((s) => s.available)
                          .map((s) => (
                            <option key={s.ordinal} value={s.ordinal}>
                              {s.title} · {s.questionCount}문항 ·{" "}
                              {Math.ceil((s.durationSec ?? 0) / 60)}분
                            </option>
                          ))}
                      </select>
                    </label>
                    {ordinal > 0 && (
                      <label className="flex gap-2">
                        <input
                          type="checkbox"
                          checked={quick}
                          onChange={(e) => setQuick(e.target.checked)}
                        />
                        빠른 연습 (시간 절반)
                      </label>
                    )}
                  </>
                )}
                <Button
                  disabled={
                    disabled ||
                    !Number.isInteger(count) ||
                    count < 1 ||
                    count > 30 ||
                    (source === "HANDCRAFTED" && !subject)
                  }
                  onClick={start}
                >
                  응시 시작
                </Button>
              </div>
            )}
            <Link className="block text-brand" href="/learning/review">
              서버에 저장된 학습 복습
            </Link>
            <h2 className="font-semibold">최근 응시</h2>
            {history.map((h) => (
              <button
                key={h.attemptId}
                className="block w-full rounded-xl border p-4 text-left"
                disabled={disabled}
                onClick={() =>
                  void run(async () => ({
                    attempt: await recover(h.attemptId),
                  }))
                }
              >
                {h.title} ·{" "}
                {h.state === "COMPLETED" ? "완료 · 결과 확인" : "이어 풀기"}
              </button>
            ))}
            {cursor && (
              <Button
                variant="outline"
                onClick={() =>
                  void loadHistory(cursor).catch((e) => setError(e.message))
                }
              >
                더 보기
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">{attempt.title}</h1>
              <span>{busy ? "저장 중…" : "서버 저장"}</span>
            </div>
            {remaining !== null && attempt.state !== "COMPLETED" && (
              <p aria-live="off">
                {attempt.state === "BREAK" ? "다음 교시까지" : "남은 시간"}{" "}
                {Math.floor(remaining / 60)}분 {remaining % 60}초
              </p>
            )}
            {attempt.state === "BREAK" && section && (
              <Button
                disabled={disabled}
                onClick={() =>
                  void command(
                    `/attempts/${attempt.attemptId}/sections/${section.sectionId}/start`,
                    "POST",
                    {},
                  )
                }
              >
                다음 교시 바로 시작
              </Button>
            )}
            {question && answer && !result && (
              <>
                <div className="flex flex-wrap gap-2">
                  {attempt.currentSectionQuestions.map((q, i) => (
                    <button
                      key={q.attemptQuestionId}
                      className={`rounded-lg border px-3 py-2 ${index === i ? "bg-primary text-primary-foreground" : ""}`}
                      disabled={disabled}
                      onClick={() => save({}, q.attemptQuestionId)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <article className="space-y-5 rounded-2xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    {question.subjectName} · {index + 1}번
                  </p>
                  {question.referenceContent && (
                    <p className="whitespace-pre-wrap rounded-lg bg-muted p-4">
                      {question.referenceContent}
                    </p>
                  )}
                  <h2 className="whitespace-pre-wrap font-semibold">
                    {question.stem}
                  </h2>
                  {question.media?.map(
                    (media, i) =>
                      (media.url ?? media.downloadUrl) && (
                        <img
                          key={i}
                          src={media.url ?? media.downloadUrl}
                          alt={media.alt ?? "문항 첨부"}
                          className="max-w-full"
                        />
                      ),
                  )}
                  {question.choices.map((choice) => (
                    <div
                      key={choice.choiceId}
                      className="flex items-center gap-2"
                    >
                      <button
                        disabled={disabled || answer.finalized}
                        className={`flex-1 rounded-xl border p-4 text-left ${answer.selectedChoiceId === choice.choiceId ? "border-brand bg-blue-50" : ""} ${answer.excludedChoiceIds.includes(choice.choiceId) ? "line-through opacity-50" : ""}`}
                        onClick={() =>
                          save({ selectedChoiceId: choice.choiceId })
                        }
                      >
                        {choice.text}
                      </button>
                      <button
                        aria-label={`${choice.text} 제외 표시`}
                        disabled={disabled || answer.finalized}
                        onClick={() =>
                          save({
                            excludedChoiceIds:
                              answer.excludedChoiceIds.includes(choice.choiceId)
                                ? answer.excludedChoiceIds.filter(
                                    (id) => id !== choice.choiceId,
                                  )
                                : [
                                    ...answer.excludedChoiceIds,
                                    choice.choiceId,
                                  ],
                          })
                        }
                      >
                        제외
                      </button>
                    </div>
                  ))}
                  <label className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={answer.flagged}
                      disabled={disabled || answer.finalized}
                      onChange={(e) => save({ flagged: e.target.checked })}
                    />
                    다시 확인할 문제
                  </label>
                  <label className="block">
                    메모
                    <textarea
                      className="mt-2 w-full rounded-lg border p-3"
                      maxLength={1000}
                      value={memo}
                      disabled={disabled || answer.finalized}
                      onChange={(e) => {
                        memoDirty.current = true;
                        setMemo(e.target.value);
                      }}
                      onBlur={() => {
                        if (memo !== answer.memo) save();
                      }}
                    />
                  </label>
                  {source === "HANDCRAFTED" && (
                    <>
                      <Button
                        variant="outline"
                        disabled={disabled}
                        onClick={() =>
                          void run(async () => {
                            const effect = await commands.current.send<{
                              details: { bookmarked: boolean };
                            }>(
                              `${base}/questions/${question.sourceQuestionVersionId}/bookmark`,
                              "PUT",
                              {},
                            );
                            setBookmarks((prev) => ({
                              ...prev,
                              [question.sourceQuestionVersionId]:
                                effect.details.bookmarked,
                            }));
                            return { attempt };
                          })
                        }
                      >
                        북마크 저장
                      </Button>
                      <Button
                        variant="outline"
                        disabled={disabled}
                        onClick={() =>
                          void run(async () => {
                            await commands.current.send(
                              `${base}/questions/${question.sourceQuestionVersionId}/bookmark`,
                              "DELETE",
                              {},
                            );
                            setBookmarks((prev) => ({
                              ...prev,
                              [question.sourceQuestionVersionId]: false,
                            }));
                            return { attempt };
                          })
                        }
                      >
                        북마크 해제
                      </Button>
                      {bookmarks[question.sourceQuestionVersionId] && (
                        <p>북마크를 저장했습니다.</p>
                      )}
                    </>
                  )}
                  {(source === "HANDCRAFTED" || attempt.mode === "REVIEW") &&
                    !answer.finalized && (
                      <div className="flex gap-3">
                        <Button
                          disabled={disabled || !answer.selectedChoiceId}
                          onClick={() =>
                            void command(
                              `/attempts/${attempt.attemptId}/questions/${question.attemptQuestionId}/grade`,
                              "POST",
                              {
                                expectedVersion: answer.version,
                                action: "ANSWER",
                                selectedChoiceId: answer.selectedChoiceId,
                              },
                            )
                          }
                        >
                          채점하기
                        </Button>
                        <Button
                          variant="outline"
                          disabled={disabled}
                          onClick={() =>
                            void command(
                              `/attempts/${attempt.attemptId}/questions/${question.attemptQuestionId}/grade`,
                              "POST",
                              {
                                expectedVersion: answer.version,
                                action: "REVEAL",
                              },
                            )
                          }
                        >
                          정답 보기
                        </Button>
                      </div>
                    )}
                  {answer.finalized && <p>채점이 완료된 문항입니다.</p>}
                </article>
              </>
            )}
            {grade && (
              <div className="rounded-xl bg-muted p-5">
                <p>정답: {grade.correctChoiceId}</p>
                <p className="whitespace-pre-wrap">{grade.explanation}</p>
                {grade.choices?.map((c) => (
                  <p key={c.choiceId}>
                    {c.text}: {c.explanation}
                  </p>
                ))}
              </div>
            )}
            {attempt.state === "IN_PROGRESS" && section && (
              <Button
                disabled={disabled}
                onClick={() => {
                  if (
                    window.confirm(
                      "현재 교시를 제출할까요? 제출 후 답안을 바꿀 수 없습니다.",
                    )
                  )
                    void command(
                      `/attempts/${attempt.attemptId}/sections/${section.sectionId}/submit`,
                      "POST",
                      {
                        expectedSectionVersion: section.version,
                        finalUpdates:
                          question && answer && !answer.finalized
                            ? [
                                {
                                  attemptQuestionId: question.attemptQuestionId,
                                  expectedVersion: answer.version,
                                  memo,
                                },
                              ]
                            : [],
                      },
                    );
                }}
              >
                교시 제출
              </Button>
            )}
            {attempt.resultAvailable && (
              <Button
                variant="outline"
                disabled={disabled}
                onClick={() => void showResult()}
              >
                공개된 결과 보기
              </Button>
            )}
            {attempt.state === "COMPLETED" && !attempt.resultAvailable && (
              <p>응시가 완료되었습니다. 결과 공개를 기다려주세요.</p>
            )}
            {result && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">
                  {result.score}점 · 정답 {result.counts.correct}/
                  {result.counts.total}
                </h2>
                <p>
                  오답 {result.counts.incorrect} · 미응답{" "}
                  {result.counts.unanswered}
                </p>
                {result.questions.map((item) => (
                  <article
                    key={item.question.attemptQuestionId}
                    className="rounded-xl border p-4"
                  >
                    <p>{item.question.stem}</p>
                    <p>
                      정답:{" "}
                      {item.question.choices.find(
                        (c) => c.choiceId === item.grade.correctChoiceId,
                      )?.text ?? item.grade.correctChoiceId}
                    </p>
                    <p className="whitespace-pre-wrap">
                      {item.grade.explanation}
                    </p>
                  </article>
                ))}
              </section>
            )}
            <a
              className="block text-brand"
              href={
                source === "CBT" ? "/learning/cbt" : "/questionbank/handcrafted"
              }
            >
              응시 목록으로
            </a>
          </>
        )}
      </main>
    </div>
  );
}
