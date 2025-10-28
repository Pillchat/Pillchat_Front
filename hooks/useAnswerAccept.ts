import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/functions";

interface UseAnswerAcceptProps {
  questionId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useAnswerAccept = ({
  questionId,
  onSuccess,
  onError,
}: UseAnswerAcceptProps) => {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (answerId: string) => {
      return fetchAPI(`/api/answers/${answerId}/accept`, "POST");
    },
    onSuccess: (data, answerId) => {
      console.log("Answer accepted:", data);

      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
      queryClient.invalidateQueries({ queryKey: ["answer", answerId] });

      // 질문 목록도 무효화 (채택 상태가 변경되므로)
      queryClient.invalidateQueries({ queryKey: ["questions"] });

      // 질문과 관련된 모든 쿼리 무효화
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

  const acceptAnswer = (answerId: string) => {
    acceptMutation.mutate(answerId);
  };

  return {
    acceptAnswer,
    isAccepting: acceptMutation.isPending,
    error: acceptMutation.error,
  };
};
