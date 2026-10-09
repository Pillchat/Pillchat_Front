"use client";

import ChoiceItem from "@/app/(questionbank)/questionbank/_components/ChoiceItem";
import type { AdminQuestionSetDraft } from "@/types/adminQuestion";

export function QuestionPreview({ value }: { value: AdminQuestionSetDraft }) {
  return (
    <div className="min-w-0 space-y-6">
      <section className="space-y-3 rounded-2xl border border-gray-300 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2 text-body-small">
          <span className="rounded-lg bg-primary-980 px-2 py-1 text-primary">
            {value.kind === "CBT" ? "CBT" : "수제 문제"}
          </span>
          <span className="rounded-lg bg-gray-100 px-2 py-1 text-muted-foreground">
            {value.isActive ? "활성" : "비활성"}
          </span>
        </div>
        <h2 className="break-words text-headline-small [overflow-wrap:anywhere]">
          {value.title}
        </h2>
        <p className="text-body-medium text-muted-foreground">
          문제 {value.questions.length}개
          {value.kind === "CBT" &&
            ` · ${value.sessionId}교시 · ${value.durationMinutes}분`}
        </p>
      </section>

      {value.questions.map((question, index) => {
        const correctIndex = question.choices.findIndex(
          (choice) => choice.id === question.correctChoiceId,
        );
        return (
          <article
            key={question.id}
            className="min-w-0 rounded-2xl border border-gray-300 bg-white p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-lg bg-primary-980 px-2 py-1 text-title-small text-primary">
                Q{index + 1}
              </span>
              <span className="text-body-small text-muted-foreground">
                {question.isActive ? "활성 문제" : "비활성 문제"}
              </span>
            </div>
            <p className="mt-3 break-words text-body-small text-muted-foreground [overflow-wrap:anywhere]">
              {[question.subject, question.topic, question.subtopic]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h3 className="mt-4 whitespace-pre-wrap break-words text-title-large [overflow-wrap:anywhere]">
              {question.prompt}
            </h3>
            {question.referenceContent && (
              <div className="mt-4 rounded-xl bg-gray-100 p-4">
                <p className="text-title-small">자료 / 제시문</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-body-medium [overflow-wrap:anywhere]">
                  {question.referenceContent}
                </p>
              </div>
            )}
            <div className="mt-5 min-w-0 space-y-3 whitespace-pre-wrap break-words [&_button]:min-w-0 [&_span]:min-w-0 [&_span]:[overflow-wrap:anywhere]">
              {question.choices.map((choice, choiceIndex) => (
                <ChoiceItem
                  key={choice.id}
                  choice={{ id: String(choiceIndex + 1), text: choice.text }}
                  isSelected={choice.id === question.correctChoiceId}
                  gradingState="graded"
                  isCorrectChoice={choice.id === question.correctChoiceId}
                  onClick={() => {}}
                />
              ))}
            </div>
            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-title-small text-primary">
                {correctIndex >= 0
                  ? `정답: ${correctIndex + 1}번`
                  : "정답을 선택해 주세요"}
              </p>
              <div className="mt-3 rounded-xl bg-gray-100 p-4">
                <p className="text-title-small">전체 해설</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-body-medium [overflow-wrap:anywhere]">
                  {question.explanation || "입력된 전체 해설이 없습니다."}
                </p>
              </div>
              <ol className="mt-4 space-y-3">
                {question.choices.map((choice, choiceIndex) => (
                  <li
                    key={choice.id}
                    className="flex min-w-0 gap-2 text-body-small"
                  >
                    <span className="shrink-0 font-semibold">
                      {choiceIndex + 1}.
                    </span>
                    <span className="whitespace-pre-wrap break-words text-muted-foreground [overflow-wrap:anywhere]">
                      {choice.explanation || "입력된 보기별 해설이 없습니다."}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </article>
        );
      })}
    </div>
  );
}
