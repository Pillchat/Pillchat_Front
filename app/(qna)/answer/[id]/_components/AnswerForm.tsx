"use client";

import { ImageButton, TextButton } from "@/components/atoms";
import { CustomCard, CustomHeader } from "@/components/molecules";
import { Textarea } from "@/components/ui/textarea";
import { useAnswerForm } from "@/app/(qna)/answer/[id]/_hooks";
import { ViewQuestion } from "./ViewQuestion";
import { map, some } from "lodash";

export interface AnswerFormData {
  questionId: string;
  steps: { id: string; content: string; keys: string[] }[];
}

interface AnswerFormProps {
  questionId: string;
}

export const AnswerForm = ({ questionId }: AnswerFormProps) => {
  const {
    steps,
    addStep,
    updateStep,
    removeStep,
    imageButtonRefs,
    initialImages,
    question,
    isLoading,
    isEditMode,
    handleImagesChange,
    handleRightButtonClick,
    mutation,
  } = useAnswerForm({ questionId });

  return (
    <div className="flex min-h-screen flex-col">
      <CustomHeader
        title={isEditMode ? "답변 수정" : "답변하기"}
        rightButtonLabel={
          mutation.isPending
            ? isEditMode
              ? "수정 중..."
              : "등록 중..."
            : isEditMode
              ? "수정 완료"
              : "작성 완료"
        }
        onRightButtonClick={
          mutation.isPending ? () => {} : handleRightButtonClick
        }
        isActive={some(steps, (step) => step.content.length > 0)}
      />

      {isLoading ? (
        <div className="mx-6 my-5 h-12 animate-pulse rounded bg-gray-100" />
      ) : (
        question && <ViewQuestion question={question} />
      )}
      <div className="mx-6 flex flex-1 flex-col gap-3 pb-5">
        {map(steps, (step, index) => (
          <CustomCard
            key={step.id}
            title={`STEP ${index + 1}`}
            onDelete={() => removeStep(step.id)}
            showDeleteButton={index > 0 && steps.length > 1}
          >
            <ImageButton
              ref={(ref) => {
                imageButtonRefs.current[step.id] = ref;
              }}
              questionId={`answer-${questionId}-step-${step.id}`}
              onImagesChange={(images) => handleImagesChange(step.id, images)}
              initialImages={initialImages[step.id] || []}
              type="question"
            />
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
