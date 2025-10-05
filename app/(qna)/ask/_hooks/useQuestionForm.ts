import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { QuestionCreateRequest, QuestionFormData } from "@/types/question";
import { fetchAPI } from "@/lib/functions";
import { useState, useRef } from "react";
import { ImageButtonRef } from "@/components/atoms/ImageButton";
import { useSubjects } from "@/hooks";

const DEFAULT_VALUES: QuestionFormData = {
  title: "",
  content: "",
  subject: "",
  subjectId: "",
  keys: [],
};

export const useQuestionForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [questionId] = useState(() => `temp-${Date.now()}`);
  const imageButtonRef = useRef<ImageButtonRef>(null);

  const { getSubjectCodeByLabel } = useSubjects();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<QuestionFormData>({
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const selectedSubject = watch("subject");

  const mutation = useMutation({
    mutationFn: (data: QuestionCreateRequest) =>
      fetchAPI("/api/questions", "POST", data),
    onSuccess: async (response) => {
      // 질문 등록 성공 후 실제 questionId로 이미지 업로드
      if (response?.id && imageButtonRef.current) {
        try {
          // ImageButton에 실제 questionId 전달하고 업로드
          await imageButtonRef.current.uploadAll(response.id);
        } catch (error) {
          console.error("이미지 업로드 실패:", error);
          // 이미지 업로드 실패해도 질문은 등록되었으므로 계속 진행
        }
      }

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

    // subject 라벨로 subjectId 찾아서 설정
    const subjectCode = getSubjectCodeByLabel(subject);
    if (subjectCode) {
      setValue("subjectId", subjectCode, { shouldValidate: true });
    }
  };

  const onSubmit = (data: QuestionFormData) => {
    const submitData: QuestionCreateRequest = {
      title: data.title,
      content: data.content,
      subjectId: data.subjectId,
      keys: uploadedImages,
    };

    mutation.mutate(submitData);
  };

  const handleImagesChange = (images: any[]) => {
    const successfulUploads = images
      .filter((img) => img.uploadStatus === "pending")
      .map((img) => img.file.name);

    setUploadedImages(successfulUploads);
  };

  const handleRightButtonClick = async () => {
    // 질문 먼저 등록 (onSuccess에서 이미지 업로드 처리)
    handleSubmit(onSubmit)();
  };

  return {
    control,
    errors,
    selectedSubject,
    handleSubjectToggle,
    handleRightButtonClick,
    handleImagesChange,
    questionId,
    imageButtonRef,
    isLoading: mutation.isPending,
    error: mutation.error,
    isValid,
  };
};
