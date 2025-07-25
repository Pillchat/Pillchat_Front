"use client";

import { fetchAPI, fetchPost } from "@/lib/functions";
import { ImageButton, TextButton } from "@/components/atoms";
import { CustomCard, CustomHeader } from "@/components/molecules";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAnswerSteps } from "@/app/(qna)/answer/[id]/_hooks";
import { ViewQuestion } from "./ViewQuestion";
import { QuestionResponse } from "@/types";

export type AnswerFormData = {
  title: string;
  content: string;
  subject: string;
  reward: string;
  images?: string[];
  subjectId: string;
};

type AnswerFormProps = {
  questionId: string;
};

export const AnswerForm = ({ questionId }: AnswerFormProps) => {
  const { steps, addStep, updateStep, removeStep } = useAnswerSteps();

  const { handleSubmit } = useForm<AnswerFormData>({
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      subject: "",
    },
  });

  const router = useRouter();
  const queryClient = useQueryClient();

  //TODO: hook으로 분리
  const mutation = useMutation({
    mutationFn: (formData: AnswerFormData) => {
      return fetchPost("/api/answers", { ...formData, questionId, steps });
    },
    onSuccess: (data) => {
      console.log("Answer posted:", data);
      queryClient.invalidateQueries({ queryKey: ["questionsList"] });
      router.push("/");
    },
    onError: (error: any) => {
      console.error("답변 등록 실패:", error);
    },
  });

  //TODO: hook으로 분리
  const { data: question, isLoading } = useQuery<QuestionResponse>({
    queryKey: ["question", questionId],
    queryFn: () => fetchAPI(`/api/questions/${questionId}`, "GET"),
    enabled: !!questionId,
    initialData: {
      id: "",
      title: "",
      content: "",
      subject: "",
      reward: "",
      createdAt: "",
      updatedAt: "",
    },
  });

  const onSubmit = (data: AnswerFormData) => {
    mutation.mutate(data);
  };

  const handleRightButtonClick = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomHeader
        title="답변하기"
        rightButtonLabel="작성 완료"
        onRightButtonClick={handleRightButtonClick}
      />

      {/* {isLoading ? (
        <div className="mx-6 my-5 h-12 animate-pulse rounded bg-gray-100" />
      ) : (
        question && <ViewQuestion question={question} />
      )} */}
      <div className="mx-6 flex flex-1 flex-col gap-3 pb-5">
        {steps.map((step, index) => (
          <CustomCard
            key={step.id}
            title={`STEP ${index + 1}`}
            onDelete={() => removeStep(step.id)}
            showDeleteButton={index > 0 && steps.length > 1}
          >
            <ImageButton />
            <Textarea
              placeholder="탭하여 답변을 작성해주세요."
              className="border-none bg-secondary text-sm placeholder:text-border"
              value={step.content}
              onChange={(e) => updateStep(step.id, { content: e.target.value })}
            />
          </CustomCard>
        ))}

        <TextButton
          className="text-sm font-normal tracking-normal"
          label="답변 STEP 추가"
          variant="outline"
          onClick={addStep}
          supportIcon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="hover:fill-primary"
            >
              <path
                d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
};
