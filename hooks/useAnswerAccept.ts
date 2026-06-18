import { useAcceptAnswerMutation } from "@/hooks/mutations";

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
  const acceptMutation = useAcceptAnswerMutation({
    questionId,
    onSuccess,
    onError,
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
