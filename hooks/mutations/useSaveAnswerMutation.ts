import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type AnswerStepPayload = {
  id: string;
  content: string;
  keys?: string[];
};

type SaveAnswerPayload = {
  questionId: string;
  steps: AnswerStepPayload[];
  answerId?: string | null;
};

export const saveAnswer = ({
  questionId,
  steps,
  answerId,
}: SaveAnswerPayload) => {
  if (answerId) {
    return fetchAPI(`/api/answers/${answerId}`, "PUT", {
      questionId,
      steps,
    });
  }

  return fetchAPI("/api/answers", "POST", {
    questionId,
    steps,
  });
};

export const useSaveAnswerMutation = (
  options?: UseMutationOptions<any, Error, SaveAnswerPayload>,
) => {
  return useMutation({
    mutationFn: saveAnswer,
    ...options,
  });
};
