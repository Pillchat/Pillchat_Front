"use client";
import { useWeaknessQuery } from "@/hooks/queries/useWeaknessQuery";
import { useQuestionConfusionMutation } from "@/hooks/mutations/useQuestionConfusionMutation";
import { Button } from "@/components/ui/button";
import type { ReviewSource } from "@/types/review";
export default function WeaknessReviewFeedback({
  source,
  questionId,
  disabled = false,
}: {
  source: ReviewSource;
  questionId: string;
  disabled?: boolean;
}) {
  const query = useWeaknessQuery();
  const mutation = useQuestionConfusionMutation(source, questionId);
  const question = query.data?.questions.find(
    (q) => q.source === source && q.questionId === questionId,
  );
  const blocked =
    disabled ||
    query.isPending ||
    !question ||
    mutation.isPending ||
    mutation.isError;
  return (
    <aside
      className="space-y-3 rounded-xl bg-primary-980 p-4 text-body-medium"
      aria-label="약점 복습 결과"
    >
      {query.isPending ? (
        <p role="status">복습 현황을 확인하는 중이에요.</p>
      ) : query.isError ? (
        <p role="alert">
          복습 현황을 확인하지 못했어요.{" "}
          <button className="underline" onClick={() => void query.refetch()}>
            다시 시도
          </button>
        </p>
      ) : question?.status === "MASTERED" ? (
        <p>서로 다른 날에 2회 연속 정답! 극복한 문제로 옮겼어요.</p>
      ) : question ? (
        <p>
          극복까지 정답 {Math.max(0, 2 - question.consecutiveCorrect)}회
          남았어요. 다음 복습: {question.dueDate ?? "–"}
        </p>
      ) : (
        <p>복습 기록을 새로 불러와주세요.</p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={blocked}
          onClick={() =>
            mutation.mutate({
              confused: true,
              idempotencyKey: crypto.randomUUID(),
            })
          }
        >
          아직 헷갈려요
        </Button>
        <Button
          disabled={blocked}
          onClick={() =>
            mutation.mutate({
              confused: false,
              idempotencyKey: crypto.randomUUID(),
            })
          }
        >
          이해했어요
        </Button>
      </div>
      {mutation.isPending && <p role="status">저장 중이에요.</p>}
      {mutation.isSuccess && (
        <p role="status">
          {mutation.data.confused
            ? "헷갈림으로 기록했어요. 연속 정답 횟수를 다시 시작해요."
            : "이해한 상태로 기록했어요."}
        </p>
      )}
      {mutation.isError && (
        <p role="alert">
          저장을 확인하지 못했어요.{" "}
          <button
            className="underline"
            onClick={() =>
              mutation.variables && mutation.mutate(mutation.variables)
            }
          >
            같은 요청 다시 시도
          </button>
        </p>
      )}
    </aside>
  );
}
