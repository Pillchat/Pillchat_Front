"use client";

import { ImageButton, TextInput, TextareaWithLabel } from "@/components/atoms";
import { CustomHeader, SectionWithChips } from "@/components/molecules";
import { QUESTION_FORM_RULES } from "@/constants/formValidation";
import { useQuestionForm } from "./_hooks";
import { Controller } from "react-hook-form";
import { useSubjects } from "@/hooks";
import { useEffect } from "react";

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

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === "+" || key === "-" || key === "=" || key === "0")) {
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
    };

    const block = (e: Event) => e.preventDefault();

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    document.addEventListener("gesturestart", block as any, { passive: false } as any);
    document.addEventListener("gesturechange", block as any, { passive: false } as any);
    document.addEventListener("gestureend", block as any, { passive: false } as any);

    return () => {
      window.removeEventListener("wheel", onWheel as any);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("touchmove", onTouchMove as any);

      document.removeEventListener("gesturestart", block as any);
      document.removeEventListener("gesturechange", block as any);
      document.removeEventListener("gestureend", block as any);
    };
  }, []);

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
          type="question"
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
