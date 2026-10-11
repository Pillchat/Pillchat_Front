"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import {
  SolidButton,
  TextButton,
  TextareaWithLabel,
  Toast,
} from "@/components/atoms";
import { IconInputField, SelectModal } from "@/components/molecules";
import { BoardHeader, BoardButton } from "@/components/molecules/board";
import { useQuery } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { useStep, useUploadForm, useUploadFiles } from "./_hooks";
import { useRouter } from "@/lib/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { archiveMaterialPayload } from "@/lib/client/materialMetadata";
import { fetchAPI } from "@/lib/client/fetch";
import { getMaterials, useFilesQuery, useMaterialQuery } from "@/hooks/queries";
import {
  type ArchiveLibraryState,
  getArchiveStorageUsageBytes,
  MAX_ARCHIVE_STORAGE_BYTES,
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
    fileSizes: files.map((file) => file.size),
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
  title: string;
  content: string;
  selectedCategoryId: string;
  selectedSubjectId: number | null;
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
  const shouldPreviewCapacityToast =
    searchParams.get("previewStorageToast") === "1";
  const isEditMode = !!editId;
  const currentUserId = getCurrentUserId();

  const { data: editMaterial } = useMaterialQuery(editId, {
    enabled: isEditMode && !!editId,
  });
  const { step, nextStep, setStep } = useStep();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [library, setLibrary] = useState<ArchiveLibraryState>(() =>
    readArchiveLibrary(currentUserId),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null,
  );
  const subjectQuery = useQuery({
    queryKey: ["material-upload-subjects", currentUserId],
    queryFn: async (): Promise<
      { subjectId: number; name: string; categoryName: string }[]
    > => {
      const raw = await fetchAPI(
        "/api/questionbank/ai-questions/subjects",
        "GET",
      );
      const data = raw.data ?? raw;
      if (!Array.isArray(data))
        throw new Error("과목 목록을 불러오지 못했습니다.");
      return data;
    },
  });
  const subjectGroups = (subjectQuery.data ?? []).reduce<
    Record<string, NonNullable<typeof subjectQuery.data>>
  >((groups, subject) => {
    (groups[subject.categoryName || "과목"] ??= []).push(subject);
    return groups;
  }, {});
  const [isCategoryCreatorOpen, setIsCategoryCreatorOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [capacityToast, setCapacityToast] = useState("");

  useEffect(() => {
    if (!shouldPreviewCapacityToast) return;
    setCapacityToast(
      "아카이브는 최대 5GB까지 저장할 수 있어요. 기존 자료를 삭제하거나 더 작은 파일을 선택해주세요.",
    );
  }, [shouldPreviewCapacityToast]);

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
    setSelectedCategoryId(library.materialFolderIds[String(editId)] ?? "");
  }, [editId, library.materialFolderIds]);

  const archiveUsageBytes = useMemo(
    () => getArchiveStorageUsageBytes(library),
    [library],
  );
  const remainingArchiveBytes = Math.max(
    MAX_ARCHIVE_STORAGE_BYTES - archiveUsageBytes,
    0,
  );
  const showCapacityToast = () => {
    setCapacityToast(
      "아카이브는 최대 5GB까지 저장할 수 있어요. 기존 자료를 삭제하거나 더 작은 파일을 선택해주세요.",
    );
  };

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
  } = useUploadFiles({
    maxNewBytes: remainingArchiveBytes,
    onSizeLimitExceeded: showCapacityToast,
  });

  const newFileBytes = useMemo(
    () =>
      imageFiles.reduce((total, file) => total + file.size, 0) +
      (pdfFile?.size ?? 0),
    [imageFiles, pdfFile],
  );

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

  const assignCategoryToMaterial = (
    materialId: string,
    materialSizeBytes: number,
  ) => {
    const currentLibrary = readArchiveLibrary(currentUserId);
    const nextAssignments = { ...currentLibrary.materialFolderIds };

    if (selectedCategoryId === "") {
      delete nextAssignments[materialId];
    } else {
      nextAssignments[materialId] = selectedCategoryId;
    }

    const nextLibrary = {
      ...currentLibrary,
      materialFolderIds: nextAssignments,
      materialSizeBytes: {
        ...currentLibrary.materialSizeBytes,
        [materialId]: materialSizeBytes,
      },
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
      if (
        !selectedSubjectId ||
        !subjectQuery.data?.some(
          (subject) => subject.subjectId === selectedSubjectId,
        )
      )
        throw new Error("과목을 선택해주세요.");
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
          subjectId: selectedSubjectId,
          title: data.title.trim(),
          content: data.content.trim(),
          urlKey: [...existingImageKeys, ...newImageKeys],
          pdfKey: newPdfKey ?? existingPdfKey,
        };

        await fetchAPI(`/api/materials/${editId}`, "PUT", payload);
        const previousSize = library.materialSizeBytes[String(editId)] ?? 0;
        const hasRetainedRemoteFiles = previewItems.some(
          (item) => item.source === "remote",
        );
        assignCategoryToMaterial(
          String(editId),
          (hasRetainedRemoteFiles ? previousSize : 0) + newFileBytes,
        );
        return;
      }

      // Persist the selected subject separately from the personal archive category.
      const { imageKeys, pdfKey } = await uploadMaterialFiles(
        imageFiles,
        pdfFile,
      );
      const result = await fetchAPI(
        "/api/materials",
        "POST",
        archiveMaterialPayload(
          data.title,
          data.content,
          imageKeys,
          pdfKey,
          selectedSubjectId,
        ),
      );
      const materialId =
        getCreatedMaterialId(result) ??
        (await findUploadedMaterialId(data.title.trim(), currentUserId));

      if (materialId) assignCategoryToMaterial(materialId, newFileBytes);
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

      setSelectedSubjectId(parsed.selectedSubjectId ?? null);
      setValue("title", parsed.title ?? "");
      setValue("content", parsed.content ?? "");
      setSelectedCategoryId(
        parsed.selectedCategoryId === "uncategorized"
          ? ""
          : (parsed.selectedCategoryId ?? ""),
      );

      if (parsed.step && parsed.step !== Step.Complete) {
        setStep(Step.Upload);
      }

      setHasDraftValues(!!parsed.title || !!parsed.content);
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

    setSelectedSubjectId(
      editMaterial.subjectId ?? editMaterial.subject?.id ?? null,
    );
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
      selectedCategoryId !== "" ||
      !!selectedSubjectId ||
      hasFiles;

    if (!hasAnyDraftData) {
      window.localStorage.removeItem(draftKey);
      return;
    }

    const draft: MaterialDraft = {
      step,
      title: title ?? "",
      content: content ?? "",
      selectedCategoryId,
      selectedSubjectId,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    draftKey,
    draftReady,
    step,
    title,
    content,
    selectedCategoryId,
    selectedSubjectId,
    hasFiles,
  ]);

  const canSubmit =
    !!title?.trim() &&
    hasFiles &&
    !!subjectQuery.data?.some(
      (subject) => subject.subjectId === selectedSubjectId,
    ) &&
    !isSubmitting;

  const openConfirmModal = () => {
    if (!canSubmit) return;
    if (archiveUsageBytes + newFileBytes > MAX_ARCHIVE_STORAGE_BYTES) {
      showCapacityToast();
      return;
    }
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
    setInitialized(false);
    setHasDraftValues(false);
    setSelectedCategoryId("");
    setSelectedSubjectId(null);
    setIsCategoryCreatorOpen(false);
    setNewCategoryName("");
    setDraftReady(false);
    setStep(Step.Upload);
  };

  return (
    <>
      {step === Step.Upload && (
        <div className="flex min-h-dvh flex-col bg-white">
          <BoardHeader
            title={isEditMode ? "학습자료 수정" : "학습자료 업로드"}
            onLeftButtonClick={() => router.push("/archive")}
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

            <section className="mb-5 px-6" aria-label="과목 선택">
              <h2 className="mb-3 text-base font-semibold">
                과목 선택{" "}
                <span className="text-sm text-destructive">(필수)</span>
              </h2>
              {!selectedSubjectId && (
                <p className="mb-3 text-sm text-muted-foreground">
                  자료에 맞는 과목을 선택해야 업로드할 수 있어요.
                </p>
              )}
              {subjectQuery.isPending && (
                <p role="status" className="text-sm text-muted-foreground">
                  과목을 불러오는 중...
                </p>
              )}
              {subjectQuery.isError && (
                <div role="alert" className="text-sm text-destructive">
                  과목 목록을 불러오지 못했습니다.
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => void subjectQuery.refetch()}
                  >
                    다시 불러오기
                  </button>
                </div>
              )}
              {Object.entries(subjectGroups).map(([category, subjects]) => (
                <div key={category} className="mb-4">
                  <p className="mb-2 text-sm text-muted-foreground">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <button
                        key={subject.subjectId}
                        type="button"
                        aria-pressed={selectedSubjectId === subject.subjectId}
                        disabled={isSubmitting}
                        onClick={() => setSelectedSubjectId(subject.subjectId)}
                        className={`rounded-full border px-4 py-2 text-sm ${selectedSubjectId === subject.subjectId ? "border-brand bg-brandSecondary font-medium text-brand" : "border-gray-200 text-muted-foreground"}`}
                      >
                        {subject.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>

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
                {library.folders.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategoryId(
                        selectedCategoryId === category.id ? "" : category.id,
                      )
                    }
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
                loading={isSubmitting}
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

      <Toast
        open={Boolean(capacityToast)}
        message={capacityToast}
        onClose={() => setCapacityToast("")}
        duration={shouldPreviewCapacityToast ? 15000 : undefined}
      />
    </>
  );
};

export default UploadPage;
