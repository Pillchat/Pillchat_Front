import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  QuestionCreateRequest,
  QuestionFormData,
  QuestionResponse,
} from "@/types/question";
import { fetchAPI, getCurrentUserId } from "@/lib/functions";
import { useState, useRef, useEffect } from "react";
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
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [questionId] = useState(() => `temp-${Date.now()}`);
  const [initialImages, setInitialImages] = useState<
    Array<{ url: string; key: string; name?: string }>
  >([]);
  const [existingImageKeys, setExistingImageKeys] = useState<string[]>([]);
  const imageButtonRef = useRef<ImageButtonRef>(null);

  // Edit 모드 확인
  const editQuestionId = searchParams.get("edit");
  const isEditMode = !!editQuestionId;
  const currentUserId = getCurrentUserId();

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

  // Edit 모드일 때 기존 질문 데이터 조회
  const { data: existingQuestion, isLoading: isLoadingQuestion } =
    useQuery<QuestionResponse>({
      queryKey: ["question", editQuestionId],
      queryFn: () => fetchAPI(`/api/questions/${editQuestionId}`, "GET"),
      enabled: isEditMode && !!editQuestionId,
    });

  // Edit 모드일 때 기존 이미지 데이터 조회
  const { data: existingFiles } = useQuery({
    queryKey: ["files", editQuestionId, existingQuestion?.images],
    queryFn: async () => {
      if (!existingQuestion?.images || existingQuestion.images.length === 0) {
        return [];
      }

      // questionData.images 배열의 urlKey를 바탕으로 keys 배열 생성
      const keys = existingQuestion.images.map((image) => {
        // urlKey가 이미 전체 경로인 경우와 파일명만인 경우를 모두 처리
        if (image.urlKey.includes("/")) {
          return image.urlKey; // 이미 전체 경로
        } else {
          return `question/${editQuestionId}/${image.urlKey}`; // 파일명만 있는 경우
        }
      });

      return fetchAPI("/api/files", "GET", { keys });
    },
    enabled:
      isEditMode &&
      !!existingQuestion?.images &&
      existingQuestion.images.length > 0,
  });

  const { data } = useQuery({
    queryKey: ["subjects", selectedSubject],
    queryFn: () =>
      fetchAPI(
        `/api/subjects/${getSubjectCodeByLabel(selectedSubject)}`,
        "GET",
      ),
    enabled: !!selectedSubject,
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

      // 질문 데이터가 로드된 후 권한 체크
      if (existingQuestion) {
        const isAuthor = existingQuestion.userId
          ? existingQuestion.userId === currentUserId
          : false;

        if (!isAuthor) {
          alert("수정 권한이 없습니다.");
          router.back();
          return;
        }

        // 폼 초기화
        setValue("title", existingQuestion.title);
        setValue("content", existingQuestion.content);
        setValue(
          "subject",
          existingQuestion.subjectName || existingQuestion.subjectId,
        );
        setValue("subjectId", existingQuestion.subjectId || "");
      }
    }
  }, [isEditMode, existingQuestion, currentUserId, router, setValue]);

  // 기존 이미지 데이터 초기화
  useEffect(() => {
    if (isEditMode && existingFiles && existingFiles.length > 0) {
      const imageData = existingFiles.map((file: any, index: number) => {
        // 파일명만 추출 (서버로 보낼 때 사용)
        const fileName = file.key.split("/").pop() || file.key;

        return {
          url: file.preSignedUrl,
          key: fileName, // 파일명만 저장
          name: fileName,
        };
      });
      setInitialImages(imageData);

      // 기존 이미지 키들을 파일명만으로 저장
      const keys = existingFiles.map((file: any) => {
        const fileName = file.key.split("/").pop() || file.key;
        return fileName;
      });
      setExistingImageKeys(keys);
    }
  }, [isEditMode, existingFiles]);

  // data가 변경될 때마다 subjectId를 자동으로 업데이트
  useEffect(() => {
    if (data?.id) {
      setValue("subjectId", data.id, { shouldValidate: true });
    }
  }, [data, setValue]);

  const mutation = useMutation({
    mutationFn: (data: QuestionCreateRequest) => {
      if (isEditMode) {
        // Edit 모드일 때는 PUT 요청 (keys 포함)
        return fetchAPI(`/api/questions/${editQuestionId}`, "PUT", {
          title: data.title,
          content: data.content,
          subjectId: data.subjectId,
          keys: data.keys, // 기존 이미지 + 새 이미지 keys
        });
      } else {
        // 새 질문 등록일 때는 POST 요청
        return fetchAPI("/api/questions", "POST", data);
      }
    },
    onSuccess: async (response) => {
      if (isEditMode) {
        // Edit 모드에서도 새로운 이미지가 있으면 업로드
        if (imageButtonRef.current) {
          try {
            await imageButtonRef.current.uploadAll(editQuestionId);
          } catch (error) {
            console.error("이미지 업로드 실패:", error);
            // 이미지 업로드 실패해도 질문 수정은 완료되었으므로 계속 진행
          }
        }

        // Edit 모드일 때는 질문 상세 페이지로 이동
        queryClient.invalidateQueries({
          queryKey: ["question", editQuestionId],
        });
        queryClient.invalidateQueries({ queryKey: ["questions"] });
        router.push(`/question/${editQuestionId}`);
      } else {
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
      }
    },
    onError: (error) => {
      console.error(isEditMode ? "질문 수정 실패:" : "질문 등록 실패:", error);
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
      keys: uploadedImages,
    };

    mutation.mutate(submitData);
  };

  const handleImagesChange = (images: any[]) => {
    if (isEditMode) {
      // Edit 모드: 현재 남아있는 기존 이미지 + 새로 업로드할 이미지
      const remainingExistingImages = images
        .filter((img) => img.uploadStatus === "success" && img.s3Key)
        .map((img) => img.s3Key) // 이미 파일명만 저장되어 있음
        .filter(Boolean); // undefined 제거

      const newUploads = images
        .filter((img) => img.uploadStatus === "pending")
        .map((img) => img.file.name);

      // 현재 이미지 상태를 반영한 전체 키 목록
      const allKeys = [...remainingExistingImages, ...newUploads];
      setUploadedImages(allKeys);
    } else {
      // 새 질문 모드에서는 기존 로직 유지
      const successfulUploads = images
        .filter((img) => img.uploadStatus === "pending")
        .map((img) => img.file.name);

      setUploadedImages(successfulUploads);
    }
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
    isLoading: mutation.isPending || isLoadingQuestion,
    error: mutation.error,
    isValid,
    isEditMode,
    initialImages,
  };
};
