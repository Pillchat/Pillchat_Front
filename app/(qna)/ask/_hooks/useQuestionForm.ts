import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { QuestionFormData } from "@/types/question";
import { createQuestion } from "@/lib/services";

const DEFAULT_VALUES: QuestionFormData = {
  title: "",
  content: "",
  subject: "",
  subjectId: "2",
  reward: "",
};

export const useQuestionForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<QuestionFormData>({
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedSubject = watch("subject");

  const mutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionsList"] });
      router.push("/ask/complete");
    },
    onError: (error) => {
      console.error("질문 등록 실패:", error);
      // TODO: 토스트 알림 또는 에러 모달 표시
    },
  });

  const handleSubjectToggle = (subject: string) => {
    setValue("subject", subject, { shouldValidate: true });
  };

  const onSubmit = (data: QuestionFormData) => {
    const submitData = {
      title: data.title,
      content: data.content,
      subjectId: data.subjectId,
      reward: data.reward,
    };
    mutation.mutate(submitData);
  };

  const handleRightButtonClick = () => {
    handleSubmit(onSubmit)();
  };

  return {
    control,
    errors,
    selectedSubject,
    handleSubjectToggle,
    handleRightButtonClick,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
