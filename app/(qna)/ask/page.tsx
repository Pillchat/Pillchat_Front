"use client";

import { ImageButton, TextInput, TextareaWithLabel } from "@/components/atoms";
import { CustomHeader, SectionWithChips } from "@/components/molecules";
import { QUESTION_FORM_RULES } from "@/constants/formValidation";
import { useQuestionForm } from "./_hooks";
import { Controller } from "react-hook-form";
import { useSubjects } from "@/hooks";

const QuestionPage = () => {
  const {
    control,
    errors,
    selectedSubject,
    handleSubjectToggle,
    handleRightButtonClick,
    handleImagesChange,
    questionId,
    imageButtonRef,
    isLoading,
    error,
    isValid,
    isEditMode,
    initialImages,
  } = useQuestionForm();

  const { getSubjectMapForChips } = useSubjects();

  return (
    <div className="flex min-h-screen flex-col gap-7">
      <CustomHeader
        title={isEditMode ? "질문 수정" : "질문하기"}
        rightButtonLabel={
          isLoading
            ? isEditMode
              ? "수정 중..."
              : "등록 중..."
            : isEditMode
              ? "수정 완료"
              : "등록하기"
        }
        onRightButtonClick={isLoading ? () => {} : handleRightButtonClick}
        isActive={isValid}
      />

      {error && (
        <div className="mx-6 rounded-lg bg-destructive/10 p-4 text-destructive">
          <p className="text-sm">
            {error.message || "질문 등록 중 오류가 발생했습니다."}
          </p>
        </div>
      )}
      <div className="mx-6 flex flex-grow flex-col gap-5">
        <ImageButton
          ref={imageButtonRef}
          onImagesChange={handleImagesChange}
          questionId={questionId}
          initialImages={initialImages}
        />
        <Controller
          name="title"
          control={control}
          rules={QUESTION_FORM_RULES.title}
          render={({ field }) => (
            <TextInput
              label="제목"
              placeholder="제목을 입력해주세요."
              errorMessage={errors.title?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="content"
          control={control}
          rules={QUESTION_FORM_RULES.content}
          render={({ field }) => (
            <TextareaWithLabel
              label="내용"
              placeholder="궁금한 것을 자유롭게 적어주세요."
              errorMessage={errors.content?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="subject"
          control={control}
          rules={QUESTION_FORM_RULES.subject}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <SectionWithChips
                data={{
                  과목: Object.values(getSubjectMapForChips()).flat(),
                }}
                selectedItems={selectedSubject ? [selectedSubject] : []}
                onItemToggle={handleSubjectToggle}
                chipContainerClassName="flex gap-1"
                selectedChipClassName="border-primary bg-accent text-primary"
                selectionMode="single"
                showDropdown={true}
                maxVisibleChips={4}
                expandedData={getSubjectMapForChips()}
                showDropdownButton={true}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">
                  {errors.subject.message}
                </p>
              )}
            </div>
          )}
        />
        {/* TODO: 팜머니 기능 추가시 활성화 */}
        {/* <Controller
          name="reward"
          control={control}
          rules={QUESTION_FORM_RULES.reward}
          render={({ field }) => (
            <TextInput
              label="팜머니"
              placeholder="팜머니를 입력해주세요."
              type="number"
              errorMessage={errors.reward?.message}
              {...field}
            />
          )}
        /> */}
      </div>
    </div>
  );
};

export default QuestionPage;
