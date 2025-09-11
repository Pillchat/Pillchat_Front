import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { QuestionCreateRequest, QuestionFormData } from "@/types/question";
import { fetchAPI } from "@/lib/functions";
import { useState, useRef } from "react";
import { ImageButtonRef } from "@/components/atoms/ImageButton";

const DEFAULT_VALUES: QuestionFormData = {
  title: "",
  content: "",
  subject: "",
  subjectId: "",
  images: [],
};

export const useQuestionForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [questionId] = useState(() => `temp-${Date.now()}`);
  const imageButtonRef = useRef<ImageButtonRef>(null);

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
    mutationFn: (data: QuestionCreateRequest) =>
      fetchAPI("/api/questions", "POST", data),
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
    const submitData: QuestionCreateRequest = {
      title: data.title,
      content: data.content,
      subjectId: data.subjectId,
      images: uploadedImages,
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
    // 먼저 이미지 업로드 실행
    try {
      if (imageButtonRef.current) {
        await imageButtonRef.current.uploadAll();
      }
      // 이미지 업로드 완료 후 질문 등록
      handleSubmit(onSubmit)();
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      // 이미지 업로드가 실패해도 질문은 등록할 수 있도록 함
      handleSubmit(onSubmit)();
    }
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
  };
};
