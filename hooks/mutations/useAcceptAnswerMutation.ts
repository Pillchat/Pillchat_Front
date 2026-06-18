import { fetchAPI } from "@/lib/client/fetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UseAcceptAnswerMutationProps = {
  questionId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
};

export const acceptAnswer = (answerId: string) => {
  return fetchAPI(`/api/answers/${answerId}/accept`, "POST");
};

export const useAcceptAnswerMutation = ({
  questionId,
  onSuccess,
  onError,
}: UseAcceptAnswerMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptAnswer,
    onSuccess: (_data, answerId) => {
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
      queryClient.invalidateQueries({ queryKey: ["answer", answerId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            query.queryKey.includes(questionId) ||
            query.queryKey.includes("question") ||
            query.queryKey.includes("answers")
          );
        },
      });

      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("답변 채택 실패:", error);
      onError?.(error);
    },
  });
};
