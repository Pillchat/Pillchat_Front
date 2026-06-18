import { fetchAPI } from "@/lib/client/fetch";
import type { QuestionCreateRequest } from "@/types/question";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type SaveQuestionPayload = {
  data: QuestionCreateRequest;
  questionId?: string | null;
};

export const saveQuestion = ({ data, questionId }: SaveQuestionPayload) => {
  if (questionId) {
    return fetchAPI(`/api/questions/${questionId}`, "PUT", {
      title: data.title,
      content: data.content,
      subjectId: data.subjectId,
      keys: data.keys,
    });
  }

  return fetchAPI("/api/questions", "POST", data);
};

export const useSaveQuestionMutation = (
  options?: UseMutationOptions<any, Error, SaveQuestionPayload>,
) => {
  return useMutation({
    mutationFn: saveQuestion,
    ...options,
  });
};
