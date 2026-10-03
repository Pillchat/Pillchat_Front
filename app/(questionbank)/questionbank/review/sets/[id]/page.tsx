"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PracticeHeader } from "@/components/molecules";
import { useRouter } from "@/lib/navigation";
import {
  readReviewCollections,
  selectReviewQuestions,
  setHandcraftedBookmark,
  HANDCRAFTED_BOOKMARK_UPDATED_EVENT,
} from "@/lib/review/collections";
import {
  REVIEW_MODE_LABELS,
  type ReviewMode,
  type LocalReviewCollection,
  type LocalReviewQuestion,
} from "@/types/review";
import ChoiceItem from "../../../_components/ChoiceItem";
import {
  ReviewPlayerFrame,
  ReviewControls,
  ReviewExplanation,
} from "../../../_components/ReviewPlayerFrame";

type Answer = { selected: number | null; graded: boolean };

export default function ReviewSetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [collection, setCollection] = useState<LocalReviewCollection | null>(
    null,
  );
  const [questions, setQuestions] = useState<LocalReviewQuestion[]>([]);
  const [mode, setMode] = useState<ReviewMode>("all");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    try {
      const found = readReviewCollections().find(
        (item) => item.id === decodeURIComponent(id),
      );
      setCollection(found ?? null);
      const selectedMode = new URLSearchParams(window.location.search).get(
        "mode",
      );
      if (found) {
        if (
          (selectedMode !== "all" &&
            selectedMode !== "wrong" &&
            selectedMode !== "bookmarked") ||
          (selectedMode === "bookmarked" && found.source === "CBT")
        ) {
          router.replace(
            `/questionbank/review?category=${found.source}&collection=${encodeURIComponent(found.id)}`,
          );
          return;
        }
        setMode(selectedMode);
        setQuestions(selectReviewQuestions(found, selectedMode));
      }
      setReady(true);
    } catch {
      setError(true);
      setReady(true);
    }
  }, [id, router]);

  useEffect(() => {
    const refresh = () => {
      try {
        setCollection(
          readReviewCollections().find(
            (item) => item.id === decodeURIComponent(id),
          ) ?? null,
        );
      } catch {
        setSaveError(true);
      }
    };
    window.addEventListener(HANDCRAFTED_BOOKMARK_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(HANDCRAFTED_BOOKMARK_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [id]);

  const question = questions[index];
  const answer = question ? answers[question.id] : undefined;
  const graded = answer?.graded ?? false;
  const selected = answer?.selected ?? null;
  const backHref = `/questionbank/review?category=${collection?.source ?? "CBT"}`;
  const chooseHref = `${backHref}&collection=${encodeURIComponent(collection?.id ?? "")}`;
  const isBookmarked =
    collection?.questions.find((item) => item.id === question?.id)
      ?.bookmarked ?? false;
  const correct = questions.filter(
    (item) =>
      answers[item.id]?.graded &&
      answers[item.id].selected === item.correctChoice,
  ).length;
  const grade = (reveal = false) => {
    if (!question || graded || (!reveal && selected === null)) return;
    setAnswers((previous) => ({
      ...previous,
      [question.id]: { selected: reveal ? null : selected, graded: true },
    }));
  };
  const mainAction = () => {
    if (!graded) {
      grade();
      return;
    }
    if (index === questions.length - 1) setComplete(true);
    else setIndex(index + 1);
  };

  if (!ready || !collection || !question || complete)
    return (
      <main className="min-h-dvh bg-white">
        <PracticeHeader title="복습하기" backHref={backHref} />
        {!ready ? (
          <p
            role="status"
            className="p-8 text-center text-sm text-muted-foreground"
          >
            복습 기록을 불러오는 중...
          </p>
        ) : !collection ? (
          <div className="p-8 text-center">
            <p
              role={error ? "alert" : undefined}
              className="text-sm text-muted-foreground"
            >
              {error
                ? "복습 기록을 읽지 못했어요. 다시 시도해주세요."
                : "이 기기에서 문제 모음을 찾을 수 없어요."}
            </p>
            <Link
              href={backHref}
              className="mt-5 inline-block text-sm font-semibold text-primary"
            >
              복습 목록으로
            </Link>
          </div>
        ) : complete ? (
          <section className="px-6 py-10">
            <p className="text-sm font-semibold text-primary">
              {REVIEW_MODE_LABELS[mode]}
            </p>
            <h1 className="mt-2 text-2xl font-bold">복습을 완료했어요</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {collection.title}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-gray-50 p-5 text-center">
              {[
                ["전체", questions.length],
                ["정답", correct],
                ["오답", questions.length - correct],
              ].map(([label, count]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-bold">{count}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                href={backHref}
                className="flex-1 rounded-xl border py-3 text-center text-sm font-semibold"
              >
                복습 목록
              </Link>
              <Link
                href={chooseHref}
                className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
              >
                복습 방법 다시 선택
              </Link>
            </div>
          </section>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              선택한 범위에 해당하는 문제가 없어요.
            </p>
            <Link
              href={chooseHref}
              className="mt-5 inline-block text-sm font-semibold text-primary"
            >
              복습 방법 다시 선택
            </Link>
          </div>
        )}
      </main>
    );

  return (
    <ReviewPlayerFrame
      key={question.id}
      title={collection.title}
      modeLabel={REVIEW_MODE_LABELS[mode]}
      backHref={backHref}
      index={index}
      total={questions.length}
      onPrevious={() => setIndex(Math.max(0, index - 1))}
      onBookmark={
        collection.source === "HANDCRAFTED"
          ? () =>
              setSaveError(!setHandcraftedBookmark(question.id, !isBookmarked))
          : undefined
      }
      isBookmarked={isBookmarked}
      explanation={
        graded && (
          <ReviewExplanation
            correct={selected === question.correctChoice}
            correctAnswer={question.choices[question.correctChoice]}
            explanation={question.explanation}
          >
            {question.choiceExplanations?.map((text, i) => (
              <p key={i} className="mt-2 text-sm text-muted-foreground">
                {i + 1}. {text}
              </p>
            ))}
            {!!question.conceptTags?.length && (
              <p className="mt-3 text-xs text-primary">
                {question.conceptTags.join(" · ")}
              </p>
            )}
            {question.memo && (
              <p className="mt-3 whitespace-pre-wrap text-sm">
                내 메모: {question.memo}
              </p>
            )}
          </ReviewExplanation>
        )
      }
      footer={
        <ReviewControls
          graded={graded}
          disabled={!graded && selected === null}
          isLast={index === questions.length - 1}
          onReveal={() => grade(true)}
          onMain={mainAction}
        />
      }
    >
      {saveError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          북마크를 저장하지 못했어요. 다시 시도해주세요.
        </p>
      )}
      <p className="mb-2 text-xs text-muted-foreground">
        {question.subject} · {question.topic} · 이전 풀이:{" "}
        {question.status === "correct"
          ? "정답"
          : question.status === "incorrect"
            ? "오답"
            : question.status === "unanswered"
              ? "미응답"
              : "아직 풀지 않음"}
        {question.unknown ? " · 모름 표시" : ""}
      </p>
      <p className="mb-6 whitespace-pre-wrap text-base font-medium leading-relaxed">
        {question.prompt}
      </p>
      {question.media?.map((media) => (
        <div key={media.id} className="mb-4 rounded-xl bg-gray-50 p-4 text-sm">
          <p className="font-semibold">{media.title}</p>
          <p className="mt-1 whitespace-pre-wrap">{media.description}</p>
        </div>
      ))}
      <div className="flex flex-col gap-3">
        {question.choices.map((choice, choiceIndex) => (
          <ChoiceItem
            key={choiceIndex}
            choice={{ id: String.fromCharCode(65 + choiceIndex), text: choice }}
            isSelected={selected === choiceIndex}
            gradingState={
              graded ? "graded" : selected === null ? "unanswered" : "answered"
            }
            isCorrectChoice={choiceIndex === question.correctChoice}
            onClick={() =>
              setAnswers((previous) => ({
                ...previous,
                [question.id]: { selected: choiceIndex, graded: false },
              }))
            }
          />
        ))}
      </div>
    </ReviewPlayerFrame>
  );
}
