"use client";

import { TextButton, SelectBox, TextareaWithLabel } from "@/components/atoms";
import { IconInputField, SelectModal } from "@/components/molecules";
import { BoardHeader, BoardButton } from "@/components/molecules/board";
import { Controller } from "react-hook-form";
import {
  Step,
  useStep,
  usePostForm,
  usePostFiles,
  CATEGORY_MAP,
  uploadBoardFiles,
} from "./_hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, ChangeEvent, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { SelectCategoryModal } from "./SelectCategoryModal";
import { fetchAPI } from "@/lib/functions";

const buildQueryParams = (
  params: Record<
    string,
    string | number | (string | number)[] | null | undefined
  >,
) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === "") return;
        searchParams.append(key, String(item));
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

type PostDraft = {
  step: Step;
  title: string;
  content: string;
  selectValue: string;
  selectedCategory: string;
  updatedAt: number;
};

const getPostDraftKey = (editId: string | null) =>
  editId ? `board-post-draft:edit:${editId}` : "board-post-draft:create";

const createBoard = async ({
  title,
  content,
  category,
  keys,
}: {
  title: string;
  content: string;
  category: string;
  keys: string[];
}) => {
  const queryString = buildQueryParams({
    title: title.trim(),
    content: content.trim(),
    category,
    keys,
  });

  return fetchAPI(`/api/boards?${queryString}`, "POST");
};

const PostPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const { step, nextStep, setStep } = useStep();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(
    Object.keys(CATEGORY_MAP),
  );
  const [selectValue, setSelectValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const draftKey = useMemo(() => getPostDraftKey(editId), [editId]);
  const [draftReady, setDraftReady] = useState(false);
  const [hasDraftValues, setHasDraftValues] = useState(false);

  const didRestoreDraftRef = useRef(false);
  const didApplyEditDataRef = useRef(false);

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
    setExistingPreviewItems,
    remainingExistingKeys,
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
    setFormValues,
  } = usePostForm({
    onSubmit: async (data) => {
      const trimmedTitle = data.title.trim();
      const trimmedContent = data.content.trim();
      const hasAnyFiles = hasFiles || remainingExistingKeys.length > 0;

      if (!selectedCategory) {
        throw new Error("카테고리를 선택해주세요.");
      }

      if (!trimmedTitle) {
        throw new Error("제목을 입력해주세요.");
      }

      if (!trimmedContent) {
        throw new Error("내용이 필요합니다.");
      }

      if (!hasAnyFiles) {
        throw new Error("이미지 또는 PDF 파일을 1개 이상 업로드해주세요.");
      }

      const uploadedKeys = await uploadBoardFiles(imageFiles, pdfFile);

      if (isEditMode) {
        const queryString = buildQueryParams({
          title: trimmedTitle,
          content: trimmedContent,
          category: selectedCategory,
          keys: [...remainingExistingKeys, ...uploadedKeys],
        });

        await fetchAPI(`/api/boards/${editId}?${queryString}`, "PUT");
        return;
      }

      await createBoard({
        title: trimmedTitle,
        content: trimmedContent,
        category: selectedCategory,
        keys: uploadedKeys,
      });
    },
  });

  useEffect(() => {
    if (didRestoreDraftRef.current) return;

    const savedDraft = window.localStorage.getItem(draftKey);

    didRestoreDraftRef.current = true;

    if (!savedDraft) {
      setDraftReady(true);
      return;
    }

    try {
      const parsed: Partial<PostDraft> = JSON.parse(savedDraft);

      setFormValues({
        title: parsed.title ?? "",
        content: parsed.content ?? "",
      });
      setSelectValue(parsed.selectValue ?? "");
      setSelectedCategory(parsed.selectedCategory ?? "");

      if (parsed.step && parsed.step !== Step.Complete) {
        setStep(parsed.step);
      }

      setHasDraftValues(
        !!parsed.title ||
          !!parsed.content ||
          !!parsed.selectValue ||
          !!parsed.selectedCategory,
      );
    } catch (error) {
      console.error("게시글 임시저장 복원 실패:", error);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey, setStep, setFormValues]);

  const { data: boardData } = useQuery({
    queryKey: ["board-edit", editId],
    queryFn: () => fetchAPI(`/api/boards/${editId}`, "GET"),
    enabled: isEditMode,
  });

  const { data: filesData } = useQuery({
    queryKey: ["board-edit-files", editId, boardData?.images],
    queryFn: async () => {
      if (!boardData?.images || boardData.images.length === 0) return [];

      const params = new URLSearchParams();
      boardData.images.forEach((image: any) => {
        params.append("keys", image.urlKey);
      });

      return fetchAPI(`/api/files?${params.toString()}`, "GET");
    },
    enabled: !!boardData?.images?.length,
  });

  useEffect(() => {
    if (!draftReady || !isEditMode || !boardData || hasDraftValues) return;
    if (didApplyEditDataRef.current) return;

    didApplyEditDataRef.current = true;

    const categoryLabel =
      Object.entries(CATEGORY_MAP).find(
        ([, value]) => value.value === boardData.category,
      )?.[0] ??
      boardData.categoryName ??
      "";

    setFormValues({
      title: boardData.title ?? "",
      content: boardData.content ?? "",
    });
    setSelectedCategory(boardData.category ?? "");
    setSelectValue(categoryLabel);
  }, [draftReady, isEditMode, boardData, hasDraftValues, setFormValues]);

  useEffect(() => {
    if (!isEditMode || !boardData?.images || !Array.isArray(filesData)) return;

    const items = boardData.images
      .map((image: any, index: number) => ({
        id: `existing-${image.id ?? image.urlKey ?? index}`,
        type: "image" as const,
        name: image.urlKey,
        previewUrl: filesData[index]?.preSignedUrl ?? "",
        source: "existing" as const,
        urlKey: image.urlKey,
      }))
      .filter((item) => !!item.previewUrl);

    setExistingPreviewItems(items);
  }, [isEditMode, boardData, filesData, setExistingPreviewItems]);

  const trimmedTitle = title?.trim() ?? "";
  const hasAnyFiles = hasFiles || remainingExistingKeys.length > 0;

  useEffect(() => {
    if (!draftReady || step === Step.Complete) return;

    const hasAnyDraftData =
      !!title ||
      !!content ||
      !!selectValue ||
      !!selectedCategory ||
      step !== Step.Upload;

    if (!hasAnyDraftData) {
      window.localStorage.removeItem(draftKey);
      return;
    }

    const draft: PostDraft = {
      step,
      title: title ?? "",
      content: content ?? "",
      selectValue,
      selectedCategory,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    draftKey,
    draftReady,
    step,
    title,
    content,
    selectValue,
    selectedCategory,
  ]);

  const canSubmit =
    !!selectedCategory && trimmedTitle.length > 0 && hasAnyFiles && !isSubmitting;

  const openConfirmModal = () => {
    if (!canSubmit) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmUpload = async () => {
    try {
      setIsConfirmOpen(false);
      await handleUpload();
      window.localStorage.removeItem(draftKey);
      nextStep();
    } catch (error) {
      console.error("게시글 업로드 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "게시글 업로드에 실패했습니다.",
      );
    }
  };

  const resetPostPage = () => {
    window.localStorage.removeItem(draftKey);
    resetForm();
    clearFiles();
    setSelectValue("");
    setSelectedCategory("");
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
            title={isEditMode ? "게시글 수정" : "게시글 업로드"}
            rightButtonLabel={
              isSubmitting
                ? isEditMode
                  ? "수정하는 중.."
                  : "등록하는 중.."
                : isEditMode
                  ? "수정하기"
                  : "등록하기"
            }
            onRightButtonClick={openConfirmModal}
            isActive={canSubmit}
            onLeftButtonClick={() => router.push("/board")}
          />

          <div className="mb-5 px-6">
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
            <p className="mb-3 font-[Pretendard] text-xs">업로드할 파일</p>
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
        title={isEditMode ? "수정 최종 확인" : "업로드 최종 확인"}
        message={
          isEditMode
            ? `"${title ?? ""}" 게시글을 수정하시겠습니까?`
            : `"${title ?? ""}" 게시글을 업로드하시겠습니까?`
        }
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
                {isEditMode
                  ? "게시글이 수정되었습니다."
                  : "게시글이 업로드되었습니다!"}
              </p>
              <p className="text-sm">
                {isEditMode
                  ? "수정된 게시글은 게시판에서 바로 확인할 수 있어요."
                  : "업로드한 게시글은 게시판에서 바로 확인할 수 있어요."}
              </p>
            </div>
          </div>

          <div className="mx-6 mb-10 flex flex-col gap-3">
            <TextButton
              className="border border-primary text-primary"
              label="내 게시물 보기"
              variant="teritary"
              onClick={() => router.push("/archive")}
            />
            <TextButton label="다른 게시글 올리기" onClick={resetPostPage} />
          </div>
        </div>
      )}
    </>
  );
};

export default PostPage;
