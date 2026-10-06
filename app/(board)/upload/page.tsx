"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { SolidButton, TextButton, TextareaWithLabel } from "@/components/atoms";
import { IconInputField, SelectModal } from "@/components/molecules";
import { BoardHeader, BoardButton } from "@/components/molecules/board";
import { Controller } from "react-hook-form";
import { useStep, useUploadForm, useUploadFiles } from "./_hooks";
import { useRouter } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CheckCircle from "@/public/icons/check-circle.svg";
import { fetchAPI } from "@/lib/client/fetch";
import { uploadMaterial } from "@/lib/client/upload";
import {
  getMaterials,
  useFilesQuery,
  useMaterialQuery,
  useSubjectQuery,
  useSubjectsQuery,
} from "@/hooks/queries";
import {
  type ArchiveLibraryState,
  readArchiveLibrary,
  subscribeArchiveLibrary,
  writeArchiveLibrary,
} from "@/lib/client/archiveLibrary";
import { getCurrentUserId } from "@/lib/client/auth";
import { Plus, Tag, X } from "lucide-react";

enum Step {
  Guide = 1,
  Upload,
  Complete,
}

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

const getPresignedUrl = (value: any) =>
  value?.preSignedUrl ?? value?.presignedUrl ?? value?.uploadUrl ?? "";

const getUploadedKey = (value: any) =>
  value?.key ?? value?.urlKey ?? value?.fileKey ?? "";

const getFileNameFromKey = (key: string) => key.split("/").pop() ?? key;

const resolveMaterialKey = (value: any, materialId: string | number) => {
  const raw =
    typeof value === "string"
      ? value
      : (value?.urlKey ?? value?.key ?? value?.fileKey ?? value?.name ?? "");

  if (!raw) return "";
  return raw.includes("/") ? raw : `material/${materialId}/${raw}`;
};

const requestMaterialUploadTargets = async (files: File[]) => {
  const queryString = buildQueryParams({
    files: files.map((file) => file.name),
    type: "material",
  });

  const response = await fetchAPI(`/api/files?${queryString}`, "POST");

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : response
        ? [response]
        : [];

  if (!items.length) {
    throw new Error("업로드용 URL 발급에 실패했습니다.");
  }

  return items;
};

const uploadFileToPresignedUrl = async (file: File, target: any) => {
  const preSignedUrl = getPresignedUrl(target);
  const key = getUploadedKey(target);

  if (!preSignedUrl || !key) {
    throw new Error("파일 업로드 응답 형식이 올바르지 않습니다.");
  }

  const response = await fetch(preSignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`${file.name} 업로드에 실패했습니다.`);
  }

  return key;
};

const uploadMaterialFiles = async (
  imageFiles: File[],
  pdfFile: File | null,
) => {
  const files = [...imageFiles, ...(pdfFile ? [pdfFile] : [])];

  if (files.length === 0) {
    return {
      imageKeys: [] as string[],
      pdfKey: null as string | null,
    };
  }

  const targets = await requestMaterialUploadTargets(files);

  if (targets.length < files.length) {
    throw new Error("업로드용 URL 개수가 파일 개수와 맞지 않습니다.");
  }

  const uploadedKeys = await Promise.all(
    files.map((file, index) => uploadFileToPresignedUrl(file, targets[index])),
  );

  return {
    imageKeys: uploadedKeys.slice(0, imageFiles.length),
    pdfKey: pdfFile ? uploadedKeys[uploadedKeys.length - 1] : null,
  };
};

type MaterialDraft = {
  step: Step;
  checked: boolean;
  title: string;
  content: string;
  selectedCategoryId: string;
  updatedAt: number;
};

const getMaterialDraftKey = (editId: string | null) =>
  editId
    ? `material-upload-draft:edit:${editId}`
    : "material-upload-draft:create";

const getCreatedMaterialId = (value: any): string | null => {
  const candidates = [
    value?.id,
    value?.materialId,
    value?.data?.id,
    value?.data?.materialId,
    value?.result?.id,
    value?.result?.materialId,
  ];
  const id = candidates.find(
    (candidate) => candidate !== undefined && candidate !== null,
  );
  return id === undefined ? null : String(id);
};

const findUploadedMaterialId = async (
  title: string,
  currentUserId: string | null,
) => {
  const response = await getMaterials();
  const raw = response?.data ?? response;
  if (!Array.isArray(raw)) return null;

  const match = raw
    .filter(
      (item) =>
        item?.title === title && Number(item?.userId) === Number(currentUserId),
    )
    .sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime || Number(b?.id ?? 0) - Number(a?.id ?? 0);
    })[0];

  return match?.id === undefined || match?.id === null
    ? null
    : String(match.id);
};

const UploadPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const currentUserId = getCurrentUserId();

  const { data: editMaterial } = useMaterialQuery(editId, {
    enabled: isEditMode && !!editId,
  });
  const { data: subjectsResponse } = useSubjectsQuery();
  const fallbackSubjectCode = useMemo(() => {
    const items = subjectsResponse?.sections.flatMap(
      (section) => section.items,
    );
    return (
      items?.find((item) => item.label.includes("기타"))?.code ??
      items?.[0]?.code
    );
  }, [subjectsResponse]);
  const { data: fallbackSubject } = useSubjectQuery(fallbackSubjectCode);
  const legacySubjectId = editMaterial?.subjectId ?? fallbackSubject?.id;

  const { step, nextStep, prevStep, setStep } = useStep();
  const [checked, setChecked] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [library, setLibrary] = useState<ArchiveLibraryState>(() =>
    readArchiveLibrary(currentUserId),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("uncategorized");
  const [isCategoryCreatorOpen, setIsCategoryCreatorOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const draftKey = useMemo(() => getMaterialDraftKey(editId), [editId]);
  const [draftReady, setDraftReady] = useState(false);
  const [hasDraftValues, setHasDraftValues] = useState(false);

  const didRestoreDraftRef = useRef(false);
  const didApplyEditDataRef = useRef(false);
  const didApplyEditCategoryRef = useRef(false);

  useEffect(() => {
    const syncLibrary = () => setLibrary(readArchiveLibrary(currentUserId));
    syncLibrary();
    return subscribeArchiveLibrary(syncLibrary);
  }, [currentUserId]);

  useEffect(() => {
    if (!editId || didApplyEditCategoryRef.current) return;
    didApplyEditCategoryRef.current = true;
    setSelectedCategoryId(
      library.materialFolderIds[String(editId)] ?? "uncategorized",
    );
  }, [editId, library.materialFolderIds]);

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
    setInitialFiles,
  } = useUploadFiles();

  const saveLibrary = (next: ArchiveLibraryState) => {
    setLibrary(next);
    writeArchiveLibrary(next, currentUserId);
  };

  const addCategory = () => {
    const name = newCategoryName.trim().slice(0, 20);
    if (!name) return;

    const existing = library.folders.find((folder) => folder.name === name);
    if (existing) {
      setSelectedCategoryId(existing.id);
      setNewCategoryName("");
      setIsCategoryCreatorOpen(false);
      return;
    }

    const category = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: Date.now(),
    };
    saveLibrary({ ...library, folders: [...library.folders, category] });
    setSelectedCategoryId(category.id);
    setNewCategoryName("");
    setIsCategoryCreatorOpen(false);
  };

  const assignCategoryToMaterial = (materialId: string) => {
    const currentLibrary = readArchiveLibrary(currentUserId);
    const nextAssignments = { ...currentLibrary.materialFolderIds };

    if (selectedCategoryId === "uncategorized") {
      delete nextAssignments[materialId];
    } else {
      nextAssignments[materialId] = selectedCategoryId;
    }

    const nextLibrary = {
      ...currentLibrary,
      materialFolderIds: nextAssignments,
    };
    setLibrary(nextLibrary);
    writeArchiveLibrary(nextLibrary, currentUserId);
  };

  const {
    control,
    errors,
    title,
    content,
    handleContentChange,
    handleUpload,
    resetForm,
    isSubmitting,
    setValue,
  } = useUploadForm({
    onSubmit: async (data) => {
      if (!legacySubjectId) {
        throw new Error(
          "업로드 정보를 준비하고 있습니다. 잠시 후 다시 시도해주세요.",
        );
      }

      if (isEditMode) {
        // 수정 모드: 기존 presigned URL 방식 유지 (V2 수정 엔드포인트 미지원)
        const existingImageKeys = previewItems
          .filter(
            (item: any) => item.source === "remote" && item.type === "image",
          )
          .map((item: any) => item.key)
          .filter(Boolean);

        const existingPdfKey =
          previewItems.find(
            (item: any) => item.source === "remote" && item.type === "pdf",
          )?.key ?? null;

        const { imageKeys: newImageKeys, pdfKey: newPdfKey } =
          await uploadMaterialFiles(imageFiles, pdfFile);

        const payload = {
          title: data.title.trim(),
          content: data.content.trim(),
          subjectId: Number(legacySubjectId),
          urlKey: [...existingImageKeys, ...newImageKeys],
          pdfKey: newPdfKey ?? existingPdfKey,
        };

        await fetchAPI(`/api/materials/${editId}`, "PUT", payload);
        assignCategoryToMaterial(String(editId));
        return;
      }

      // 생성 모드: V2 multipart API (파일 + 데이터 한번에)
      const result = await uploadMaterial({
        title: data.title.trim(),
        content: data.content.trim(),
        subjectId: Number(legacySubjectId),
        files: imageFiles.length > 0 ? imageFiles : undefined,
        pdf: pdfFile || undefined,
      });
      const materialId =
        getCreatedMaterialId(result) ??
        (await findUploadedMaterialId(data.title.trim(), currentUserId));

      if (materialId) assignCategoryToMaterial(materialId);
    },
  });

  useEffect(() => {
    if (didRestoreDraftRef.current) return;

    didRestoreDraftRef.current = true;

    const savedDraft = window.localStorage.getItem(draftKey);

    if (!savedDraft) {
      setDraftReady(true);
      return;
    }

    try {
      const parsed: Partial<MaterialDraft> = JSON.parse(savedDraft);

      setValue("title", parsed.title ?? "");
      setValue("content", parsed.content ?? "");
      setSelectedCategoryId(parsed.selectedCategoryId ?? "uncategorized");

      if (parsed.step && parsed.step !== Step.Complete) {
        setStep(parsed.step);
      }

      setHasDraftValues(
        !!parsed.title || !!parsed.content,
      );
    } catch (error) {
      console.error("학습자료 임시저장 복원 실패:", error);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey, setStep, setValue]);

  const editFileKeys = useMemo(() => {
    if (!editMaterial?.id) return [];

    const imageKeys = Array.isArray(editMaterial?.images)
      ? editMaterial.images
          .map((value: any) => resolveMaterialKey(value, editMaterial.id))
          .filter(Boolean)
      : [];

    const pdfKeys = editMaterial?.pdfKey
      ? [resolveMaterialKey(editMaterial.pdfKey, editMaterial.id)].filter(
          Boolean,
        )
      : [];

    return [...new Set([...imageKeys, ...pdfKeys])];
  }, [editMaterial]);

  const { data: editFilesData } = useFilesQuery({
    keys: isEditMode ? editFileKeys : [],
  });

  const editFileUrlMap = useMemo(() => {
    if (!Array.isArray(editFilesData)) return {};

    return editFileKeys.reduce<Record<string, string>>((acc, key, index) => {
      const file = editFilesData[index];
      if (file?.preSignedUrl) {
        acc[key] = file.preSignedUrl;
      }
      return acc;
    }, {});
  }, [editFilesData, editFileKeys]);

  useEffect(() => {
    if (!draftReady || !isEditMode || !editMaterial || initialized) return;
    if (hasDraftValues) return;
    if (didApplyEditDataRef.current) return;

    const hasRemoteUrls =
      editFileKeys.length === 0 ||
      editFileKeys.every((key) => !!editFileUrlMap[key]);

    if (!hasRemoteUrls) return;

    didApplyEditDataRef.current = true;

    setValue("title", editMaterial.title ?? "");
    setValue("content", editMaterial.content ?? "");

    const initialImages = Array.isArray(editMaterial.images)
      ? editMaterial.images
          .map((image: any) => {
            const key = resolveMaterialKey(image, editMaterial.id);
            const previewUrl = editFileUrlMap[key];
            if (!key || !previewUrl) return null;

            return {
              id: `remote-image-${image.id ?? key}`,
              type: "image",
              name: getFileNameFromKey(key),
              previewUrl,
              key,
              source: "remote",
            };
          })
          .filter(Boolean)
      : [];

    const pdfKey = editMaterial?.pdfKey
      ? resolveMaterialKey(editMaterial.pdfKey, editMaterial.id)
      : "";

    const initialPdf =
      pdfKey && editFileUrlMap[pdfKey]
        ? [
            {
              id: `remote-pdf-${pdfKey}`,
              type: "pdf",
              name: getFileNameFromKey(pdfKey),
              previewUrl: editFileUrlMap[pdfKey],
              key: pdfKey,
              source: "remote",
            },
          ]
        : [];

    setInitialFiles([...initialImages, ...initialPdf]);
    setInitialized(true);
  }, [
    draftReady,
    isEditMode,
    editMaterial,
    initialized,
    hasDraftValues,
    editFileKeys,
    editFileUrlMap,
    setValue,
  ]);

  useEffect(() => {
    if (!draftReady || step === Step.Complete) return;

    const hasAnyDraftData =
      !!title ||
      !!content ||
      selectedCategoryId !== "uncategorized" ||
      checked ||
      step !== Step.Guide;

    if (!hasAnyDraftData) {
      window.localStorage.removeItem(draftKey);
      return;
    }

    const draft: MaterialDraft = {
      step,
      checked,
      title: title ?? "",
      content: content ?? "",
      selectedCategoryId,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draftKey, draftReady, step, checked, title, content, selectedCategoryId]);

  useEffect(() => {
    if (step !== Step.Guide) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [step]);

  const canSubmit =
    !!title?.trim() && !!legacySubjectId && hasFiles && !isSubmitting;

  const openConfirmModal = () => {
    if (!canSubmit) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmUpload = async () => {
    try {
      setIsConfirmOpen(false);
      await handleUpload();
      window.localStorage.removeItem(draftKey);
      didApplyEditDataRef.current = false;
      didRestoreDraftRef.current = false;
      nextStep();
    } catch (error) {
      console.error("학습자료 업로드 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "학습자료 업로드에 실패했습니다.",
      );
    }
  };

  const resetUploadPage = () => {
    window.localStorage.removeItem(draftKey);
    didApplyEditDataRef.current = false;
    didApplyEditCategoryRef.current = false;
    didRestoreDraftRef.current = false;
    resetForm();
    clearFiles();
    setChecked(false);
    setInitialized(false);
    setHasDraftValues(false);
    setSelectedCategoryId("uncategorized");
    setIsCategoryCreatorOpen(false);
    setNewCategoryName("");
    setDraftReady(false);
    setStep(Step.Guide);
  };

  return (
    <>
      {step === Step.Guide && (
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-[#F2F2F2] bg-white">
            <BoardHeader
              title={isEditMode ? "학습자료 수정" : "학습자료 업로드"}
              onLeftButtonClick={() => router.push("/archive")}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-5">
            <div className="shrink-0 px-1">
              <p className="text-headline-large">
                학습자료 업로드 전, 다음 안내사항을 반드시 읽고 확인해주세요.
              </p>
            </div>

            <div className="mt-6 flex min-h-0 flex-1 flex-col justify-between gap-6">
              <div className="space-y-5 px-1">
                <div>
                  <p className="mb-2 text-title-large">
                    1. 저작권 관련 책임 안내
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-body-medium">
                    <li>
                      사용자가 업로드하는 모든 자료는 대한민국 「저작권법」
                      제2조 및 제4조에 따라 보호받는 저작물에 해당할 수
                      있습니다.
                    </li>
                    <li>
                      특히 출시 문제, 국가고시(약사국시) 문제, 학원 또는 대학
                      족보 등 저작권자가 따로 있는 자료를 무단으로 업로드하는
                      경우, 저작권 침해로 간주되며 법적 책임이 따를 수 있습니다.
                    </li>
                    <li>
                      본 플랫폼은 사용자가 업로드한 자료에 대한 저작권 침해
                      여부를 사전 심사하지 않으며, 모든 법적 책임은 자료를
                      업로드한 사용자 본인에게 있습니다.
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-title-large">2. 책임 동의 안내</p>
                  <ul className="list-disc space-y-2 pl-5 text-body-medium">
                    <li>
                      본인은 자료를 직접 작성했거나, 저작권 문제가 없는 자료임을
                      확인합니다.
                    </li>
                    <li>
                      위 사항을 충분히 인지하였으며, 이를 위반하여 발생하는
                      민형사상 법적 책임은 전적으로 본인에게 있음에 동의합니다.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="shrink-0 border-t border-[#F2F2F2] px-1 pt-5">
                <div
                  className="flex cursor-pointer items-center justify-center gap-2"
                  onClick={() => setChecked((prev) => !prev)}
                >
                  <CheckCircle
                    className="h-[22px] w-[22px]"
                    style={{ color: checked ? "#FF412E" : "#C4C4C4" }}
                  />
                  <p className="text-title-small">위 내용에 동의합니다.</p>
                </div>

                <div className="mt-4">
                  <SolidButton
                    disabled={!checked}
                    onClick={nextStep}
                    content="다음"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === Step.Upload && (
        <div className="flex min-h-dvh flex-col bg-white">
          <BoardHeader
            title={isEditMode ? "학습자료 수정" : "학습자료 업로드"}
            onLeftButtonClick={prevStep}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-8">
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
                    inputClassName="border-[#C4C4C4] focus-visible:border-[#C4C4C4] focus-visible:ring-[#C4C4C4]"
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
                    className="max-h-[50dvh] border-[#C4C4C4] focus-visible:border-[#C4C4C4] focus-visible:ring-[#C4C4C4]"
                    onChange={(e) => handleContentChange(e.target.value)}
                    onBlur={field.onBlur}
                    errorMessage={errors.content?.message}
                    showMaxLengthError
                  />
                )}
              />
            </div>

            <section className="mb-5 px-6" aria-label="자료 카테고리">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-label-medium text-foreground">카테고리</p>
                  <p className="mt-1 text-body-small text-muted-foreground">
                    직접 만든 카테고리로 자료를 정리할 수 있어요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryCreatorOpen((open) => !open)}
                  className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-primary px-3 text-label-small text-primary"
                >
                  {isCategoryCreatorOpen ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {isCategoryCreatorOpen ? "닫기" : "새 카테고리"}
                </button>
              </div>

              {isCategoryCreatorOpen && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCategory();
                      }
                    }}
                    maxLength={20}
                    placeholder="카테고리 이름"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-[#C4C4C4] px-3 text-base outline-none focus:border-primary md:text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    disabled={!newCategoryName.trim()}
                    className="h-10 rounded-lg bg-primary px-4 text-label-medium text-primary-foreground disabled:opacity-40"
                  >
                    추가
                  </button>
                </div>
              )}

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("uncategorized")}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-label-small ${
                    selectedCategoryId === "uncategorized"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  미분류
                </button>
                {library.folders.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-label-small ${
                      selectedCategoryId === category.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-white text-muted-foreground"
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {category.name}
                  </button>
                ))}
              </div>
            </section>

            <div className="px-6">
              <p className="mb-3 text-label-medium">업로드 할 파일</p>
              <p className="mb-1 text-body-small text-[#999]">
                이미지 파일 (JPG, PNG 등) 최대 10장 또는 PDF 파일 1개 가능
              </p>

              <div className="grid w-full grid-cols-2 gap-4">
                <BoardButton
                  imageSrc={PUBLIC_ASSETS.icons.image}
                  className="max-w-[168.5px]"
                  text="이미지 업로드"
                  onClick={openImagePicker}
                  type="button"
                />
                <BoardButton
                  imageSrc={PUBLIC_ASSETS.icons.file}
                  className="max-w-[168.5px]"
                  text="파일 업로드"
                  onClick={openPdfPicker}
                  type="button"
                />
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
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
                <div className="mt-5 pb-2">
                  <div className="grid max-h-[60dvh] grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {previewItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="relative aspect-square overflow-hidden border border-[#C4C4C4] bg-[#F8F8F8]"
                      >
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center"
                        >
                          <img
                            src={PUBLIC_ASSETS.icons.removeCircleWhite}
                            alt="제거"
                          />
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
                            <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-label-small text-white">
                              PDF
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 truncate bg-black/55 px-2 py-1 text-label-small text-white">
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

            <div className="mt-6 px-6 pb-4">
              <SolidButton
                disabled={!canSubmit}
                onClick={openConfirmModal}
                content={
                  isSubmitting
                    ? isEditMode
                      ? "수정 중..."
                      : "업로드 중..."
                    : isEditMode
                      ? "수정하기"
                      : "업로드하기"
                }
              />
            </div>
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
            ? `‘${title ?? ""}’ 학습자료를 수정하시겠습니까?`
            : `‘${title ?? ""}’ 학습자료를 업로드 하시겠습니까?`
        }
      />

      {step === Step.Complete && (
        <div className="flex min-h-dvh flex-col">
          <div className="flex flex-grow flex-col items-center justify-center gap-3">
            <div className="flex flex-col items-center justify-center text-center">
              <img
                src={PUBLIC_ASSETS.icons.checkCircleOutline}
                alt="완료"
                width={72}
                className="mb-2"
              />
              <p className="text-headline-large">
                {isEditMode
                  ? "학습자료가 수정되었습니다!"
                  : "학습자료가 업로드되었습니다!"}
              </p>
            </div>
            <p className="text-body-medium">
              내가 올린 학습자료는 아카이브에서 확인할 수 있어요.
            </p>
          </div>
          <div className="mx-6 mb-10 flex flex-col gap-3">
            <TextButton
              className="border border-primary text-primary"
              label="내 학습자료 보기"
              variant="teritary"
              onClick={() => router.push("/archive")}
            />
            <TextButton
              label="다른 학습자료 올리기"
              onClick={() => resetUploadPage()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UploadPage;
