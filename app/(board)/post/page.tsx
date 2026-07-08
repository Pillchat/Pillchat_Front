"use client";

import { TextButton } from "@/components/atoms";
import { SelectModal } from "@/components/molecules";
import { Controller } from "react-hook-form";
import {
  Step,
  useStep,
  usePostForm,
  usePostFiles,
  uploadBoardFiles,
} from "./_hooks";
import { useRouter } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { fetchAPI } from "@/lib/client/fetch";
import { uploadBoard } from "@/lib/client/upload";
import { getCurrentUserId } from "@/lib/client/auth";
import {
  buildFileUrlMap,
  getFileKey,
  isPdfFileKey,
} from "@/lib/shared/filePreview";
import { useBoardQuery, useFilesQuery } from "@/hooks/queries";
import {
  Camera,
  Check,
  CheckSquare,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";

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
  selectedCategory: string;
  isAnonymous: boolean;
  updatedAt: number;
};

const BOARD_TARGETS = {
  free: {
    label: "자유",
    category: "FREE",
    path: "/board",
  },
  tips: {
    label: "꿀팁",
    category: "TIP",
    path: "/tips",
  },
  reviews: {
    label: "후기",
    category: "REVIEW",
    path: "/reviews",
  },
} as const;

type BoardTargetKey = keyof typeof BOARD_TARGETS;

const resolveBoardTargetKey = (value: string | null): BoardTargetKey => {
  if (value === "tips" || value === "reviews" || value === "free") {
    return value;
  }

  return "free";
};

const getPostDraftKey = (editId: string | null, target: BoardTargetKey) =>
  editId
    ? `board-post-draft:edit:${editId}`
    : `board-post-draft:create:${target}`;

const normalizeBoardId = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    const id = String(value).trim();
    return id ? id : null;
  }

  return null;
};

const getCreatedBoardId = (payload: any): string | null => {
  const directId = normalizeBoardId(payload);
  if (directId) return directId;

  const candidates = [
    payload?.id,
    payload?.boardId,
    payload?.postId,
    payload?.board?.id,
    payload?.data?.id,
    payload?.data?.boardId,
    payload?.data?.postId,
    payload?.data?.board?.id,
    payload?.result?.id,
    payload?.result?.boardId,
  ];

  for (const candidate of candidates) {
    const id = normalizeBoardId(candidate);
    if (id) return id;
  }

  return null;
};

const getBoardList = (payload: any) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;

  return [];
};

const findUploadedBoardId = async ({
  title,
  content,
  category,
}: {
  title: string;
  content: string;
  category: string;
}) => {
  try {
    const currentUserId = getCurrentUserId();
    const response = await fetchAPI("/api/boards", "GET", { category });
    const boards = getBoardList(response)
      .filter((item: any) => {
        const idMatches =
          !currentUserId || Number(item?.userId) === Number(currentUserId);

        return idMatches && item?.title === title && item?.content === content;
      })
      .sort((left: any, right: any) => {
        const leftTime = new Date(left?.createdAt ?? 0).getTime();
        const rightTime = new Date(right?.createdAt ?? 0).getTime();
        return rightTime - leftTime;
      });

    return getCreatedBoardId(boards[0]);
  } catch (error) {
    console.error("방금 작성한 게시글 ID 조회 실패:", error);
    return null;
  }
};

const CommunityRuleSummary = () => {
  return (
    <section className="pt-12 text-[#5F5550]">
      <div className="mb-7 flex justify-end">
        <button
          type="button"
          className="flex h-12 items-center gap-2 rounded-full border border-[#E7E0DC] bg-white px-5 text-base font-semibold text-[#5F5550] shadow-[0_1px_3px_rgba(17,17,17,0.03)]"
        >
          커뮤니티 이용규칙 전체 보기
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 text-[1.0625rem] font-medium leading-8">
        <p>
          PillChat은 누구나 기분 좋게 참여할 수 있는 커뮤니티를 만들기 위해
          커뮤니티 이용규칙을 제정하여 운영하고 있습니다. 위반 시 게시물이
          삭제되고 서비스 이용이 일정 기간 제한될 수 있습니다.
        </p>
        <p>
          아래는 이 게시판에 해당하는 핵심 내용에 대한 요약 사항이며, 게시물
          작성 전 커뮤니티 이용규칙 전문을 반드시 확인하시기 바랍니다.
        </p>
      </div>

      <div className="mt-7 space-y-7 text-[1.0625rem] leading-8">
        <div>
          <h2 className="font-extrabold text-foreground">
            ※ 정치·사회 관련 행위 금지
          </h2>
          <ul className="mt-4 space-y-2 font-medium text-[#5F5550]">
            <li>
              - 국가기관, 정치 관련 단체, 언론, 시민단체에 대한 언급 혹은 이와
              관련한 행위
            </li>
            <li>
              - 정책·외교 또는 정치·정파에 대한 의견, 주장 및 이념, 가치관을
              드러내는 행위
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-extrabold text-foreground">
            ※ 홍보 및 판매 관련 행위 금지
          </h2>
          <ul className="mt-4 space-y-2 font-medium text-[#5F5550]">
            <li>
              - 영리 여부와 관계없이 사업체·기관·단체·개인에게 직간접적으로
              영향을 줄 수 있는 게시물 작성 행위
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

const PostPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const boardTargetKey = resolveBoardTargetKey(searchParams.get("board"));
  const boardTarget = BOARD_TARGETS[boardTargetKey];

  const { step, nextStep, setStep } = useStep();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    boardTarget.category,
  );
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [createdBoardId, setCreatedBoardId] = useState<string | null>(editId);

  const draftKey = useMemo(
    () => getPostDraftKey(editId, boardTargetKey),
    [editId, boardTargetKey],
  );
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
      const targetCategory = selectedCategory || boardTarget.category;

      if (!trimmedTitle) {
        throw new Error("제목을 입력해주세요.");
      }

      if (!trimmedContent) {
        throw new Error("내용이 필요합니다.");
      }

      if (isEditMode) {
        // 수정 모드: 기존 presigned URL 방식 유지 (V2 수정 엔드포인트 미지원)
        const uploadedKeys = await uploadBoardFiles(imageFiles, pdfFile);

        const queryString = buildQueryParams({
          title: trimmedTitle,
          content: trimmedContent,
          category: targetCategory,
          isAnonymous: String(isAnonymous),
          keys: [...remainingExistingKeys, ...uploadedKeys],
        });

        await fetchAPI(`/api/boards/${editId}?${queryString}`, "PUT");
        setCreatedBoardId(editId);
        return;
      }

      // 생성 모드: V2 multipart API (파일 + 데이터 한번에)
      const uploadResult = await uploadBoard({
        title: trimmedTitle,
        content: trimmedContent,
        category: targetCategory,
        isAnonymous,
        images: imageFiles.length > 0 ? imageFiles : undefined,
        pdf: pdfFile || undefined,
      });

      const nextBoardId =
        getCreatedBoardId(uploadResult) ??
        (await findUploadedBoardId({
          title: trimmedTitle,
          content: trimmedContent,
          category: targetCategory,
        }));

      setCreatedBoardId(nextBoardId);
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
      setSelectedCategory(parsed.selectedCategory ?? boardTarget.category);
      setIsAnonymous(parsed.isAnonymous ?? true);

      if (parsed.step && parsed.step !== Step.Complete) {
        setStep(parsed.step);
      }

      setHasDraftValues(
        !!parsed.title || !!parsed.content || !!parsed.selectedCategory,
      );
    } catch (error) {
      console.error("게시글 임시저장 복원 실패:", error);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey, setStep, setFormValues, boardTarget.category]);

  const { data: boardData } = useBoardQuery(editId, undefined, {
    enabled: isEditMode,
  });

  const existingFileKeys = useMemo(() => {
    if (!Array.isArray(boardData?.images)) return [];

    return boardData.images
      .map((file: any) => getFileKey(file))
      .filter(Boolean);
  }, [boardData?.images]);

  const { data: filesData } = useFilesQuery({
    keys: existingFileKeys,
  });

  const existingFileUrlMap = useMemo(
    () => buildFileUrlMap(existingFileKeys, filesData),
    [existingFileKeys, filesData],
  );

  useEffect(() => {
    if (!draftReady || !isEditMode || !boardData || hasDraftValues) return;
    if (didApplyEditDataRef.current) return;

    didApplyEditDataRef.current = true;

    setFormValues({
      title: boardData.title ?? "",
      content: boardData.content ?? "",
    });
    setSelectedCategory(boardData.category ?? boardTarget.category);
    setIsAnonymous(boardData.isAnonymous ?? true);
  }, [
    draftReady,
    isEditMode,
    boardData,
    hasDraftValues,
    setFormValues,
    boardTarget.category,
  ]);

  useEffect(() => {
    if (isEditMode) return;

    setSelectedCategory(boardTarget.category);
  }, [boardTarget.category, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !boardData?.images || !Array.isArray(filesData)) return;

    const items = boardData.images
      .map((file: any, index: number) => {
        const key = getFileKey(file);
        const previewUrl = existingFileUrlMap[key];

        if (!key || !previewUrl) return null;

        return {
          id: `existing-${file.id ?? key ?? index}`,
          type: isPdfFileKey(key) ? ("pdf" as const) : ("image" as const),
          name: key.split("/").pop() ?? key,
          previewUrl,
          source: "existing" as const,
          urlKey: key,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    setExistingPreviewItems(items);
  }, [isEditMode, boardData, existingFileUrlMap, setExistingPreviewItems]);

  const trimmedTitle = title?.trim() ?? "";
  const trimmedContent = content?.trim() ?? "";

  useEffect(() => {
    if (!draftReady || step === Step.Complete) return;

    const hasAnyDraftData =
      !!title || !!content || !!selectedCategory || step !== Step.Upload;

    if (!hasAnyDraftData) {
      window.localStorage.removeItem(draftKey);
      return;
    }

    const draft: PostDraft = {
      step,
      title: title ?? "",
      content: content ?? "",
      selectedCategory,
      isAnonymous,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    draftKey,
    draftReady,
    step,
    title,
    content,
    selectedCategory,
    isAnonymous,
  ]);

  const canSubmit =
    trimmedTitle.length > 0 &&
    trimmedContent.length > 0 &&
    !!selectedCategory &&
    !isSubmitting;

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
    setSelectedCategory(boardTarget.category);
    setIsAnonymous(true);
    setCreatedBoardId(null);
    setStep(Step.Upload);
  };

  const viewPostId = createdBoardId ?? editId;
  const handleViewPost = () => {
    if (viewPostId) {
      router.push(`/board/${viewPostId}`);
      return;
    }

    router.push("/archive");
  };

  return (
    <>
      {step === Step.Upload && (
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col bg-white">
          <header className="sticky top-0 z-40 flex h-[4.5rem] shrink-0 items-center justify-between bg-white px-6">
            <button
              type="button"
              onClick={() => router.push(boardTarget.path)}
              aria-label="글쓰기 닫기"
              className="flex h-11 w-11 items-center justify-start text-foreground active:scale-[0.98]"
            >
              <X aria-hidden="true" className="h-8 w-8" strokeWidth={2.4} />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-extrabold text-foreground">
              {isEditMode ? "글 수정" : "글 쓰기"}
            </h1>

            <button
              type="button"
              onClick={openConfirmModal}
              disabled={!canSubmit}
              className="h-11 px-1 text-base font-extrabold text-[#5f5550] disabled:text-[#9F9A96]"
            >
              {isSubmitting ? (isEditMode ? "수정 중" : "등록 중") : "완료"}
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-28 pt-5">
            <Controller
              name="title"
              control={control}
              rules={{
                required: "제목을 입력해주세요.",
              }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="제목을 입력해주세요."
                    className="h-14 w-full border-0 border-b border-[#E8E1DD] bg-transparent px-0 pb-5 text-[1.75rem] font-extrabold leading-none text-foreground outline-none placeholder:text-[#A7A2A0] focus:border-[#D9D2CE]"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .replace(/^\s+/, "")
                          .replace(/\s{2,}/g, " ")
                          .slice(0, 30),
                      )
                    }
                  />
                  {errors.title?.message && (
                    <p className="mt-2 text-sm font-medium text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <div className="mt-5">
                  <textarea
                    value={field.value ?? ""}
                    placeholder={`학교 친구들과 자유롭게 얘기해보세요.\n#수강신청 #취업`}
                    className="min-h-[12.5rem] w-full resize-none border-0 bg-transparent p-0 text-xl font-medium leading-8 text-foreground outline-none placeholder:text-[#AAA4A1]"
                    onChange={(e) => handleContentChange(e.target.value)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                  {errors.content?.message && (
                    <p className="mt-2 text-sm font-medium text-destructive">
                      {errors.content.message}
                    </p>
                  )}
                </div>
              )}
            />

            {previewItems.length > 0 && (
              <div className="mb-8 mt-4 grid grid-cols-3 gap-3">
                {previewItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-[#E8E1DD] bg-[#F8F6F5]"
                  >
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`${item.name} 제거`}
                      className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>

                    {item.type === "image" ? (
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-3 text-center text-[#6D625E]">
                        <FileText aria-hidden="true" className="h-9 w-9" />
                        <span className="mt-2 line-clamp-2 text-xs font-bold">
                          {item.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <CommunityRuleSummary />

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
          </div>

          <footer className="fixed bottom-0 left-1/2 z-40 flex h-[4.625rem] w-full max-w-app -translate-x-1/2 items-center justify-between border-t border-[#EEE8E5] bg-white px-6">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={openImagePicker}
                aria-label="이미지 첨부"
                className="flex h-11 w-11 items-center justify-center text-[#756B67] active:scale-[0.98]"
              >
                <Camera aria-hidden="true" className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={openPdfPicker}
                aria-label="파일 첨부"
                className="flex h-11 w-11 items-center justify-center text-[#756B67] active:scale-[0.98]"
              >
                <CheckSquare aria-hidden="true" className="h-8 w-8" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAnonymous((value) => !value)}
              aria-pressed={isAnonymous}
              className="flex h-11 items-center gap-2 text-lg font-extrabold text-primary active:scale-[0.98]"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 ${
                  isAnonymous
                    ? "border-primary bg-primary text-white"
                    : "border-[#D8D0CC] bg-white text-transparent"
                }`}
              >
                <Check aria-hidden="true" className="h-5 w-5" strokeWidth={3} />
              </span>
              익명
            </button>
          </footer>
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
                src="/icons/UncheckedIcon.svg"
                alt="완료"
                width={72}
                className="mb-2"
              />
              <p className="text-headline-large">
                {isEditMode
                  ? "게시글이 수정되었습니다."
                  : "게시글이 업로드되었습니다!"}
              </p>
              <p className="text-body-medium">
                {isEditMode
                  ? "수정된 게시글은 게시판에서 바로 확인할 수 있어요."
                  : `업로드한 게시글은 ${boardTarget.label} 게시판에서 바로 확인할 수 있어요.`}
              </p>
            </div>
          </div>

          <div className="mx-6 mb-10 flex flex-col gap-3">
            <TextButton
              className="border border-primary text-primary"
              label="내 게시물 보기"
              variant="teritary"
              onClick={handleViewPost}
            />
            <TextButton label="다른 게시글 올리기" onClick={resetPostPage} />
          </div>
        </div>
      )}
    </>
  );
};

export default PostPage;
