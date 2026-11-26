"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import {
  getPreviewQuestion,
  getPreviewQuestionIds,
  previewChapters,
  previewStudyDate,
  readPreviewProgress,
  submitPreviewAnswer,
  type PreviewChapter,
  type PreviewProgress,
} from "@/lib/learning/home-preview";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function HomeQuestionPreview() {
  const userId = useAuthIdentity();

  return <QuestionPreview key={userId ?? "guest"} userId={userId} />;
}

function QuestionPreview({ userId }: { userId: string | null }) {
  const router = useRouter();
  // shortcut: Progress is local to this device until preview questions have server catalog IDs.
  const storageKey = userId ? `pillchat:home-preview:v1:${userId}` : null;
  const [progress, setProgress] = useState<PreviewProgress | null>(null);
  const [chapters, setChapters] = useState<PreviewChapter[]>(previewChapters);
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const questionStart = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const promptId = useId();
  const contextId = `${promptId}-context`;

  useEffect(() => {
    let timer: number;
    const restore = () => {
      const today = previewStudyDate();
      let stored: string | null = null;
      try {
        if (storageKey) stored = localStorage.getItem(storageKey);
      } catch {
        // The quiz stays available if storage is blocked.
      }
      const restored = readPreviewProgress(stored, today);
      setChapters(restored.chapters);
      setProgress(restored);
      setSelected(null);
      window.clearTimeout(timer);
      timer = window.setTimeout(
        restore,
        Math.max(1, Date.parse(`${today}T15:00:00Z`) - Date.now()),
      );
    };
    const sync = (event: StorageEvent) => {
      if (storageKey && event.key === storageKey) restore();
    };
    restore();
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, [storageKey]);

  function save(next: PreviewProgress) {
    if (next.studyDate !== previewStudyDate()) {
      next = readPreviewProgress(JSON.stringify(next));
      setSelected(null);
    }
    setProgress(next);
    try {
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Keep the in-memory attempt if storage is blocked or full.
    }
  }

  const attempt = progress?.attempt;
  const question =
    attempt && getPreviewQuestion(attempt.questionIds[attempt.position]);
  const submittedAnswer = attempt?.answers[attempt.position];
  const choiceId = submittedAnswer ?? selected;
  const correctCount =
    attempt?.answers.filter(
      (answer, index) =>
        getPreviewQuestion(attempt.questionIds[index])?.correctChoiceId ===
        answer,
    ).length ?? 0;
  const questionIds = progress
    ? getPreviewQuestionIds(chapters, progress.submitted, progress.studyDate)
    : [];
  const remainingCount = progress
    ? getPreviewQuestionIds(
        previewChapters,
        progress.submitted,
        progress.studyDate,
      ).length
    : 0;
  const unavailableMessage = !chapters.length
    ? "단원을 선택해 주세요."
    : remainingCount
      ? `다른 단원에 아직 풀지 않은 미리보기 문제가 ${remainingCount}개 있어요.`
      : "오늘의 미리보기 3문제를 모두 풀었어요.";
  const allSelected = chapters.length === previewChapters.length;

  function focusPrompt() {
    requestAnimationFrame(() => {
      focusTarget.current?.focus({ preventScroll: true });
      (questionStart.current ?? focusTarget.current)?.scrollIntoView({
        block: "nearest",
      });
    });
  }

  function start() {
    if (!progress || !questionIds.length) return;

    save({
      ...progress,
      chapters,
      attempt: { questionIds, answers: [], position: 0 },
    });
    setSelected(null);
    setChoosing(false);
    focusPrompt();
  }

  function openScope() {
    setChoosing(true);
    requestAnimationFrame(() => title.current?.focus());
  }

  function closeScope() {
    setChapters(progress?.chapters ?? previewChapters);
    setChoosing(false);
    requestAnimationFrame(() => title.current?.focus());
  }

  return (
    <section
      aria-labelledby={titleId}
      aria-busy={!progress}
      className="mt-6 px-6 md:px-10"
    >
      <div className="border-b border-gray-100 pb-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id={titleId}
            ref={title}
            tabIndex={-1}
            className="scroll-mt-24 text-headline-small focus:outline-none"
          >
            오늘의 문제
          </h2>
          {choosing ? (
            <button
              type="button"
              className="text-body-medium text-muted-foreground"
              onClick={closeScope}
            >
              닫기
            </button>
          ) : (
            attempt && (
              <span className="shrink-0 text-body-medium text-muted-foreground">
                {attempt.questionIds.length}문제
              </span>
            )
          )}
        </div>

        {progress && attempt && question ? (
          <div className="mt-3">
            <div className="flex justify-between gap-3 border-b border-gray-100 pb-3 text-body-medium text-muted-foreground">
              <span>약물치료학 · {question.chapter}</span>
              <span
                className="shrink-0 tabular-nums"
                aria-label={`${attempt.questionIds.length}문제 중 ${attempt.position + 1}번`}
              >
                {attempt.position + 1} / {attempt.questionIds.length}
              </span>
            </div>
            <div ref={questionStart} className="mt-3 scroll-mt-24 space-y-2.5">
              {question.context && (
                <p
                  id={contextId}
                  className="whitespace-pre-wrap break-words break-keep text-body-large leading-relaxed"
                >
                  {question.context}
                </p>
              )}
              <h3
                id={promptId}
                ref={focusTarget}
                tabIndex={-1}
                aria-describedby={question.context ? contextId : undefined}
                className="whitespace-pre-wrap break-words break-keep text-title-large focus:outline-none"
              >
                {question.stem}
              </h3>
            </div>
            <fieldset
              aria-labelledby={promptId}
              disabled={!!submittedAnswer}
              className="mt-4 min-w-0 space-y-1.5"
            >
              {question.choices.map((choice) => {
                const isSelected = choice.id === choiceId;
                const isCorrect =
                  !!submittedAnswer && choice.id === question.correctChoiceId;
                const isWrong = !!submittedAnswer && isSelected && !isCorrect;

                return (
                  <label
                    key={choice.id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 text-body-large has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                      submittedAnswer && "cursor-default",
                      !submittedAnswer && isSelected && "bg-primary-980",
                      isCorrect && "bg-green-50",
                      isWrong && "bg-primary-980",
                    )}
                  >
                    <input
                      type="radio"
                      name={promptId}
                      value={choice.id}
                      checked={isSelected}
                      onChange={() => setSelected(choice.id)}
                      className={cn(
                        "size-5 shrink-0 accent-primary focus:outline-none",
                        (isCorrect || isWrong) && "sr-only",
                      )}
                    />
                    {(isCorrect || isWrong) && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-white",
                          isCorrect ? "bg-green-700" : "bg-primary",
                        )}
                      >
                        {isCorrect ? (
                          <Check className="size-4" />
                        ) : (
                          <X className="size-4" />
                        )}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                      {choice.text}
                    </span>
                    {(isCorrect || isWrong) && (
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-label-medium",
                          isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-primary-900 text-red-900",
                        )}
                      >
                        {isCorrect ? "정답" : "내 답"}
                      </span>
                    )}
                  </label>
                );
              })}
            </fieldset>

            {submittedAnswer && (
              <div role="status" className="mt-4">
                <p
                  className={cn(
                    "text-headline-small",
                    submittedAnswer === question.correctChoiceId
                      ? "text-green-700"
                      : "text-red-700",
                  )}
                >
                  {submittedAnswer === question.correctChoiceId
                    ? "정답이에요"
                    : "오답이에요"}
                </p>
                <p className="mt-1 whitespace-pre-line break-words text-body-medium text-muted-foreground">
                  {question.explanation}
                </p>
              </div>
            )}

            <Button
              type="button"
              className="mt-3 w-full hover:bg-primary active:bg-primary active:brightness-95"
              disabled={!choiceId}
              onClick={() => {
                if (submittedAnswer) {
                  save({
                    ...progress,
                    attempt: { ...attempt, position: attempt.position + 1 },
                  });
                  setSelected(null);
                  focusPrompt();
                } else if (selected) {
                  save(submitPreviewAnswer(progress, selected));
                }
              }}
            >
              {submittedAnswer
                ? attempt.position + 1 < attempt.questionIds.length
                  ? "다음 문제"
                  : "결과 보기"
                : "정답 확인"}
            </Button>
          </div>
        ) : progress && attempt ? (
          <div className="mt-4">
            <h3
              ref={focusTarget}
              tabIndex={-1}
              className="text-title-large focus:outline-none"
            >
              미리보기 완료
            </h3>
            <p className="mt-1 text-body-medium text-muted-foreground">
              {attempt.questionIds.length}문제 중 {correctCount}문제를 맞혔어요.
            </p>
            {remainingCount === 0 && (
              <p className="mt-2 text-body-medium text-muted-foreground">
                오늘의 미리보기 3문제를 모두 풀었어요.
              </p>
            )}
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={() => {
                if (remainingCount) save({ ...progress, attempt: null });
                router.push(
                  remainingCount ? "/questionbank/handcrafted" : "/membership",
                );
              }}
            >
              추가문제풀기
            </Button>
          </div>
        ) : progress && choosing ? (
          <div className="mt-4">
            <dl>
              <dt className="text-body-medium text-muted-foreground">과목</dt>
              <dd className="mt-1 rounded-xl border border-gray-200 px-3 py-3 text-title-large">
                약물치료학
              </dd>
            </dl>
            <fieldset className="mt-4 space-y-2">
              <legend className="mb-2 text-title-small">
                단원{" "}
                <span className="ml-2 text-body-small text-muted-foreground">
                  하나 이상 선택
                </span>
              </legend>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 text-body-large">
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-primary"
                  checked={allSelected}
                  ref={(input) => {
                    if (input)
                      input.indeterminate = !allSelected && chapters.length > 0;
                  }}
                  onChange={(event) =>
                    setChapters(event.target.checked ? previewChapters : [])
                  }
                />
                전체 단원
              </label>
              {previewChapters.map((chapter) => (
                <label
                  key={chapter}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 text-body-large",
                    chapters.includes(chapter) && "bg-primary-980",
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-5 shrink-0 accent-primary"
                    checked={chapters.includes(chapter)}
                    onChange={(event) =>
                      setChapters(
                        event.target.checked
                          ? [...chapters, chapter]
                          : chapters.filter((value) => value !== chapter),
                      )
                    }
                  />
                  {chapter}
                </label>
              ))}
            </fieldset>
            <p
              aria-live="polite"
              className="mt-3 text-body-medium text-muted-foreground"
            >
              {questionIds.length
                ? `새 문제 ${questionIds.length}개`
                : unavailableMessage}
            </p>
            <Button
              type="button"
              className="mt-3 w-full"
              onClick={start}
              disabled={!questionIds.length}
            >
              {questionIds.length
                ? `${questionIds.length}문제 풀기`
                : "문제 풀기"}
            </Button>
          </div>
        ) : progress ? (
          <div className="mt-3 space-y-3">
            <p className="text-body-medium text-muted-foreground">
              {questionIds.length
                ? `약물치료학 · ${chapters.join(", ")}`
                : unavailableMessage}
            </p>
            {questionIds.length > 0 && (
              <Button type="button" className="w-full" onClick={start}>
                추천 미리보기 {questionIds.length}문제 풀기
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={openScope}
            >
              직접 과목·단원 선택
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
