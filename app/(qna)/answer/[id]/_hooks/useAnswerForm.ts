import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAPI, getCurrentUserId } from "@/lib/functions";
import { useState, useRef, useEffect, useCallback } from "react";
import { ImageButtonRef } from "@/components/atoms/ImageButton";
import { useAnswerSteps } from "./useAnswerSteps";
import { Answer, QuestionResponse } from "@/types";

export interface AnswerFormData {
  questionId: string;
  steps: { id: string; content: string; keys: string[] }[];
}

interface UseAnswerFormProps {
  questionId: string;
}

export const useAnswerForm = ({ questionId }: UseAnswerFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();

  // Edit 모드 확인
  const editAnswerId = searchParams.get("edit");
  const isEditMode = !!editAnswerId;

  const { steps, addStep, updateStep, removeStep, setSteps } = useAnswerSteps();
  const imageButtonRefs = useRef<{ [stepId: string]: ImageButtonRef | null }>(
    {},
  );
  const [initialImages, setInitialImages] = useState<{
    [stepId: string]: Array<{ url: string; key: string; name?: string }>;
  }>({});
  const [existingImageKeys, setExistingImageKeys] = useState<{
    [stepId: string]: string[];
  }>({});

  const { handleSubmit } = useForm<AnswerFormData>({
    mode: "onChange",
    defaultValues: {
      questionId,
      steps,
    },
  });

  // 질문 데이터 조회
  const { data: question, isLoading: isLoadingQuestion } =
    useQuery<QuestionResponse>({
      queryKey: ["question", questionId],
      queryFn: () => fetchAPI(`/api/questions/${questionId}`, "GET"),
      enabled: !!questionId,
    });

  // Edit 모드일 때 기존 답변 데이터 조회
  const { data: existingAnswer, isLoading: isLoadingAnswer } = useQuery({
    queryKey: ["answer", editAnswerId],
    queryFn: () => fetchAPI(`/api/answers/${editAnswerId}`, "GET"),
    enabled: isEditMode && !!editAnswerId,
  });

  // Edit 모드일 때 기존 이미지 데이터 조회
  const { data: existingFiles } = useQuery({
    queryKey: ["answer-files", editAnswerId, existingAnswer?.steps],
    queryFn: async () => {
      if (!existingAnswer?.steps) return [];

      // 모든 step의 이미지 키를 수집
      const allKeys: string[] = [];
      existingAnswer.steps.forEach((step) => {
        step.images.forEach((imageKey) => {
          allKeys.push(
            `answer/${editAnswerId}/step/${step.stepId}/${imageKey}`,
          );
        });
      });

      if (allKeys.length === 0) return [];
      return fetchAPI("/api/files", "GET", { keys: allKeys });
    },
    enabled: isEditMode && !!existingAnswer?.steps,
  });

  // Edit 모드일 때 로그인 및 권한 체크
  useEffect(() => {
    if (isEditMode) {
      // 로그인 체크
      if (!currentUserId) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      // 답변 데이터가 로드된 후 권한 체크
      if (existingAnswer) {
        if (existingAnswer.userId !== currentUserId) {
          alert("수정 권한이 없습니다.");
          router.back();
          return;
        }

        // 기존 답변 데이터로 steps 초기화
        if (existingAnswer.steps && existingAnswer.steps.length > 0) {
          const formattedSteps = existingAnswer.steps.map((step) => ({
            id: step.stepId || `step-${Date.now()}`,
            content: step.content || "",
            keys: step.images || [],
          }));

          setSteps(formattedSteps);
        }
      }
    }
  }, [isEditMode, existingAnswer, currentUserId, router, setSteps]);

  // 기존 이미지 데이터 초기화
  useEffect(() => {
    if (isEditMode && existingFiles && existingAnswer?.steps) {
      const imagesByStep: {
        [stepId: string]: Array<{ url: string; key: string; name?: string }>;
      } = {};
      const keysByStep: { [stepId: string]: string[] } = {};

      existingAnswer.steps.forEach((step) => {
        if (!step.stepId || !step.images) return;

        const stepImages: Array<{ url: string; key: string; name?: string }> =
          [];
        const stepKeys: string[] = [];

        step.images.forEach((imageKey) => {
          const fileData = existingFiles.find((file: any) =>
            file.key.endsWith(imageKey),
          );

          if (fileData) {
            stepImages.push({
              url: fileData.preSignedUrl,
              key: imageKey,
              name: imageKey,
            });
            stepKeys.push(imageKey);
          }
        });

        if (stepImages.length > 0) {
          imagesByStep[step.stepId] = stepImages;
          keysByStep[step.stepId] = stepKeys;
        }
      });

      setInitialImages(imagesByStep);
      setExistingImageKeys(keysByStep);
    }
  }, [isEditMode, existingFiles, existingAnswer]);

  // 답변 등록/수정 mutation
  const mutation = useMutation({
    mutationFn: (formData: AnswerFormData) => {
      if (isEditMode && editAnswerId) {
        return fetchAPI(`/api/answers/${editAnswerId}`, "PUT", {
          questionId,
          steps,
        });
      } else {
        return fetchAPI("/api/answers", "POST", {
          ...formData,
          questionId,
          steps,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
      if (isEditMode && editAnswerId) {
        queryClient.invalidateQueries({ queryKey: ["answer", editAnswerId] });
      }
      router.push(`/question/${questionId}`);
    },
    onError: (error: any) => {
      console.error(isEditMode ? "답변 수정 실패:" : "답변 등록 실패:", error);
    },
  });

  // 각 step별로 이미지 변경을 처리하는 함수
  const handleImagesChange = useCallback(
    (stepId: string, images: any[]) => {
      setTimeout(() => {
        const successfulImages = images
          .filter((img) => img.uploadStatus === "success" && img.s3Key)
          .map((img) => img.s3Key);

        const pendingImages = images
          .filter((img) => img.uploadStatus === "pending")
          .map((img) => img.file.name);

        const allImageKeys = [...successfulImages, ...pendingImages];
        updateStep(stepId, { keys: allImageKeys });
      }, 0);
    },
    [updateStep],
  );

  const onSubmit = async (data: AnswerFormData) => {
    // 모든 step의 이미지를 업로드
    for (const step of steps) {
      const imageButtonRef = imageButtonRefs.current[step.id];
      if (imageButtonRef) {
        const uploadKey = isEditMode
          ? `answer/${editAnswerId}/step/${step.id}`
          : `answer-${questionId}-step-${step.id}`;
        await imageButtonRef.uploadAll(uploadKey);
      }
    }

    mutation.mutate(data);
  };

  const handleRightButtonClick = () => {
    handleSubmit(onSubmit)();
  };

  return {
    steps,
    addStep,
    updateStep,
    removeStep,
    imageButtonRefs,
    initialImages,
    existingImageKeys,
    question,
    isLoading: isLoadingQuestion || (isEditMode && isLoadingAnswer),
    isEditMode,
    handleImagesChange,
    handleRightButtonClick,
    mutation,
  };
};
