"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { handcraftedQuestions } from "@/lib/handcrafted/questions";
import { REVIEW_MODE_LABELS, type ReviewMode } from "@/types/review";
import ChoiceItem from "../../_components/ChoiceItem";
import ActionSheet from "../../_components/ActionSheet";

const steps = [
  {
    title: "문제와 답 선택하기",
    description:
      "예제의 선택지 하나를 골라보세요. 답을 고른 뒤 채점할 수 있어요.",
  },
  {
    title: "북마크 등록·해제하기",
    description:
      "북마크를 눌러 등록한 뒤, 한 번 더 눌러 해제해보세요. 정답 여부와 관계없이 채점 전에도 표시할 수 있어요.",
  },
  {
    title: "채점과 해설 확인하기",
    description:
      "채점하기를 누르면 정답과 해설이 표시돼요. 다음 문제로 이동하기 전에 확인해보세요.",
  },
  {
    title: "북마크 문제 복습하기",
    description:
      "예제에 북마크를 다시 표시했어요. 문제 모음을 열고 ‘북마크 문제 복습’을 골라보세요. 전체·오답 복습도 같은 곳에서 선택해요.",
  },
  {
    title: "사용법을 익혔어요",
    description:
      "실제 풀이에서 북마크한 문제는 복습하기 → 수제 제작 문제 → 문제 모음 → 북마크 문제 복습으로 다시 풀 수 있어요.",
  },
];

export default function HandcraftedTutorial({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [graded, setGraded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<ReviewMode | null>(null);
  const question = handcraftedQuestions[0];
  const canNext =
    step === 0
      ? selected !== null
      : step === 1
        ? registered && removed
        : step === 2
          ? graded
          : step === 3
            ? mode === "bookmarked"
            : true;
  const next = () => {
    if (!canNext) return;
    if (step === 2) setBookmarked(true);
    setStep(step + 1);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl">
        <p className="text-xs font-semibold text-primary">
          수제 문제 사용법 · {step + 1}/{steps.length}
        </p>
        <DialogTitle className="pr-5 text-lg font-bold">
          {steps[step].title}
        </DialogTitle>
        <DialogDescription className="text-sm leading-6">
          {steps[step].description}
        </DialogDescription>
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-muted-foreground">
          연습 답안과 북마크는 저장되지 않아요. 언제든 닫아도 괜찮아요.
        </p>
        {step < 3 && (
          <section className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                예제 문제
              </span>
              {step === 1 && (
                <button
                  type="button"
                  aria-label={bookmarked ? "북마크 해제" : "북마크"}
                  aria-pressed={bookmarked}
                  className="rounded-lg border p-2"
                  onClick={() => {
                    if (bookmarked) setRemoved(true);
                    else setRegistered(true);
                    setBookmarked(!bookmarked);
                  }}
                >
                  {bookmarked ? (
                    <BookmarkCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              )}
            </div>
            <p className="mb-4 text-sm font-semibold">{question.prompt}</p>
            <div className="space-y-2">
              {question.choices.map((choice, index) => (
                <ChoiceItem
                  key={index}
                  choice={{ id: String.fromCharCode(65 + index), text: choice }}
                  isSelected={selected === index}
                  gradingState={
                    graded
                      ? "graded"
                      : selected === null
                        ? "unanswered"
                        : "answered"
                  }
                  isCorrectChoice={index === question.answer}
                  onClick={() => {
                    if (step === 0) setSelected(index);
                  }}
                />
              ))}
            </div>
            {step === 1 && (
              <p className="mt-3 text-xs text-primary">
                {registered && removed
                  ? "등록과 해제를 모두 해봤어요."
                  : bookmarked
                    ? "북마크를 다시 눌러 해제해보세요."
                    : "북마크를 눌러 등록해보세요."}
              </p>
            )}
            {step === 2 &&
              (graded ? (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-bold">
                    정답: {question.choices[question.answer]}
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {question.explanation}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setGraded(true)}
                  className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white"
                >
                  채점하기
                </button>
              ))}
          </section>
        )}
        {step === 3 && (
          <div>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="w-full rounded-xl border px-4 py-4 text-left"
            >
              <p className="text-sm font-semibold">약리학 예제 문제 모음</p>
              <p className="mt-1 text-xs text-muted-foreground">
                총 1문제 · 북마크 1
              </p>
            </button>
            {mode && (
              <p className="mt-3 text-sm text-primary">
                선택한 방법: {REVIEW_MODE_LABELS[mode]}
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          disabled={!canNext}
          onClick={step === steps.length - 1 ? onClose : next}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {step === steps.length - 1 ? "연습 마치기" : "다음"}
        </button>
        <ActionSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSelectMode={setMode}
          totalCount={1}
          wrongCount={selected === question.answer ? 0 : 1}
          bookmarkedCount={1}
        />
      </DialogContent>
    </Dialog>
  );
}
