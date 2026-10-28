"use client";
import { useQuestionConfusionQuery } from "@/hooks/queries/useQuestionConfusionQuery";
import { useQuestionConfusionMutation } from "@/hooks/mutations/useQuestionConfusionMutation";
import type { ReviewSource } from "@/types/review";

export function ConfusionToggle({
  source,
  questionId,
  disabled = false,
}: {
  source: ReviewSource;
  questionId: string;
  disabled?: boolean;
}) {
  return (
    <QuestionConfusion
      key={`${source}:${questionId}`}
      source={source}
      questionId={questionId}
      disabled={disabled}
    />
  );
}
function QuestionConfusion({
  source,
  questionId,
  disabled,
}: {
  source: ReviewSource;
  questionId: string;
  disabled: boolean;
}) {
  const query = useQuestionConfusionQuery(source, questionId);
  const mutation = useQuestionConfusionMutation(source, questionId);
  return (
    <div className="space-y-2 py-2 text-body-small">
      <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
        <input
          type="checkbox"
          checked={query.data?.confused ?? false}
          disabled={
            disabled || !query.data || mutation.isPending || mutation.isError
          }
          onChange={(event) =>
            mutation.mutate({
              confused: event.target.checked,
              idempotencyKey: crypto.randomUUID(),
            })
          }
          className="h-4 w-4 accent-primary"
        />
        헷갈려요
        {mutation.isPending && <span role="status">저장 중</span>}
      </label>
      {query.isError && (
        <p role="alert">
          헷갈림 표시를 불러오지 못했어요.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void query.refetch()}
          >
            다시 불러오기
          </button>
        </p>
      )}
      {mutation.isError && (
        <p role="alert">
          저장을 확인하지 못했어요.{" "}
          <button
            type="button"
            className="underline"
            onClick={() =>
              mutation.variables && mutation.mutate(mutation.variables)
            }
          >
            다시 시도
          </button>
        </p>
      )}
    </div>
  );
}
