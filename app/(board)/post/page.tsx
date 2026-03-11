"use client";

import { TextButton, SelectBox, TextareaWithLabel } from "@/components/atoms";
import {
  IconInputField,
  ExpandableChipSection,
  SelectModal,
} from "@/components/molecules";
import { BoardHeader, BoardButton } from "@/components/molecules/board";
import { Controller } from "react-hook-form";
import { Step, useStep, usePostForm, usePostFiles, CATEGORY_MAP, useCategoryType } from "./_hooks";
import { useRouter } from "next/navigation";
import { useState, ChangeEvent } from "react";
import { QUESTION_FORM_RULES } from "@/constants/formValidation";
import { useSubjects } from "@/hooks";
import { SelectCategoryModal } from "./SelectCategoryModal";

const PostPage = () => {
  const { getSubjectMapForChips } = useSubjects();
  const router = useRouter();
  const { step, nextStep, setStep } = useStep();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const {
    imageInputRef,
    pdfInputRef,
    openImagePicker,
    openPdfPicker,
    handleImageChange,
    handlePdfChange,
    removeItem,
    clearFiles,
    previewItems,
    imageFiles,
    pdfFile,
    hasFiles,
  } = usePostFiles();

  const {
    control,
    errors,
    title,
    content,
    handleContentChange,
    handleUpload,
    resetForm,
    isSubmitting,
  } = usePostForm({
    onSubmit: async (data) => {
      console.log({
        ...data,
        imageFiles,
        pdfFile,
      });
    },
  });

  const canSubmit =
    !!selectedCategory &&
    !!title?.trim() &&
    !!content?.trim() &&
    hasFiles &&
    !isSubmitting;

  const openConfirmModal = () => {
    if (!canSubmit) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmUpload = async () => {
    setIsConfirmOpen(false);
    await handleUpload();
    nextStep();
  };

  const resetPostPage = () => {
    resetForm();
    clearFiles();
    setStep(Step.Upload);
  };

  const openCategory = () => {
    setIsCategoryOpen(true);
  };

  const closeCategory = () => {
    setIsCategoryOpen(false);
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectValue(value);
    const mapped = CATEGORY_MAP[value as keyof typeof CATEGORY_MAP];
    setSelectedCategory(mapped?.value || value);
  };

  const handleCategorySelect = (label: string, value: string) => {
    setSelectValue(label);
    setSelectedCategory(value);
    setIsCategoryOpen(false);
  };

  return (
    <>
      {step === Step.Upload && (
        <div className="flex h-full w-full flex-1 flex-col">
          <BoardHeader
            title="게시글 업로드"
            rightButtonLabel={isSubmitting ? "등록하는 중..." : "등록하기"}
            onRightButtonClick={openConfirmModal}
            isActive={canSubmit}
            onLeftButtonClick={() => router.push("/board")}
          />

          <div className="px-6 mb-5">
            <SelectBox
              label="카테고리"
              options={categories.map((type) => ({ key: type, value: type }))}
              selectedValue={selectValue || ""}
              placeholder="카테고리를 선택해주세요."
              disabled={false}
              handleChange={handleSelectChange}
              onClick={openCategory}
            />
          </div>

          <SelectCategoryModal
            isOpen={isCategoryOpen}
            closeClick={closeCategory}
            onSelect={handleCategorySelect}
            setCategories={setCategories}
          />

          <div className="mb-5 w-full px-6">
            <Controller
              name="title"
              control={control}
              rules={{
                required: "제목을 입력해주세요.",
              }}
              render={({ field }) => (
                <IconInputField
                  content="제목"
                  placeholder="제목을 입력해주세요."
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .replace(/^\s+/, "")
                        .replace(/\s{2,}/g, " ")
                        .slice(0, 30),
                    )
                  }
                  onBlur={field.onBlur}
                  ref={field.ref}
                  errorMessage={errors.title?.message}
                />
              )}
            />
          </div>

          <div className="mb-5 w-full px-6">
            <Controller
              name="content"
              control={control}
              rules={QUESTION_FORM_RULES.content}
              render={({ field }) => (
                <TextareaWithLabel
                  label="본문"
                  placeholder="본문을 입력해주세요."
                  value={field.value ?? ""}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={field.onBlur}
                  errorMessage={errors.content?.message}
                />
              )}
            />
          </div>

          <div className="px-6">
            <p className="mb-3 font-[Pretendard] text-xs">업로드 할 파일</p>
            <p className="mb-1 font-[Pretendard] text-xs text-[#999]">
              이미지 파일 (JPG, PNG 등) 최대 10장 가능 또는 PDF 파일 1개
            </p>

            <div className="flex w-full flex-row justify-around">
              <BoardButton
                imageSrc="/Image.svg"
                text="이미지 업로드"
                onClick={openImagePicker}
                type="button"
              />
              <BoardButton
                imageSrc="/File2.svg"
                text="파일 업로드"
                onClick={openPdfPicker}
                type="button"
              />
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfChange}
            />

            {previewItems.length > 0 && (
              <div className="mt-5">
                <div className="grid max-h-[calc(100vw-48px)] grid-cols-3 gap-3 overflow-y-auto pr-1">
                  {previewItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden border border-[#C4C4C4] bg-[#F8F8F8]"
                    >
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center"
                      >
                        <img src="/Remove.svg" alt="제거" />
                      </button>

                      {item.type === "image" ? (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <embed
                            src={`${item.previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            type="application/pdf"
                            className="h-full w-full"
                          />
                          <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
                            PDF
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 truncate bg-black/55 px-2 py-1 text-[10px] text-white">
                            {item.name}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <SelectModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmUpload}
        title="업로드 최종 확인"
        message={`‘${title ?? ""}’ 게시글을 업로드 하시겠습니까?`}
      />

      {step === Step.Complete && (
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-grow flex-col items-center justify-center gap-3">
            <div className="flex flex-col items-center justify-center text-center">
              <img
                src="/UncheckedIcon.svg"
                alt="완료"
                width={72}
                className="mb-2"
              />
              <p className="text-2xl font-semibold">
                게시글이 업로드되었습니다!
              </p>
            </div>
            <p className="text-sm">
              업로드한 게시글은 게시판에서 바로 확인할 수 있어요.
            </p>
          </div>

          <div className="mx-6 mb-10 flex flex-col gap-3">
            <TextButton
              className="border border-primary text-primary"
              label="내 게시물 보기"
              variant="teritary"
              onClick={() => router.push("/archive")}
            />
            <TextButton
              label="다른 게시글 올리기"
              onClick={resetPostPage}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PostPage;