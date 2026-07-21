"use client";

import { Tags, X } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppShell, CustomHeader } from "@/components/molecules";
import {
  useCreateMarketItemMutation,
  useUpdateMarketItemMutation,
} from "@/hooks/mutations";
import {
  useMarketDetailQuery,
  useSubjectQuery,
  useSubjectsQuery,
} from "@/hooks/queries";
import { getCurrentUserId } from "@/lib/client/auth";
import { deleteFile, uploadLargeFile } from "@/lib/client/upload";
import { useRouter } from "@/lib/navigation";
import type {
  MarketGrade,
  MarketItemCreateRequest,
  MarketItemType,
  MarketItemUpdateRequest,
} from "@/types";

import { MarketFileField } from "./MarketFileField";
import { MarketSubjectPicker } from "./MarketSubjectPicker";

const ITEM_TYPES = [
  { value: "WORKBOOK", label: "문제집" },
  { value: "VARIANT", label: "변형 자료" },
  { value: "VIDEO", label: "영상" },
  { value: "ETC", label: "기타" },
] as const satisfies ReadonlyArray<{
  value: MarketItemType;
  label: string;
}>;

const GRADES = [
  { value: "GRADE_1", label: "1학년" },
  { value: "GRADE_2", label: "2학년" },
  { value: "GRADE_3", label: "3학년" },
  { value: "GRADE_4", label: "4학년" },
  { value: "GRADE_5", label: "5학년" },
  { value: "GRADE_6", label: "6학년" },
] as const satisfies ReadonlyArray<{ value: MarketGrade; label: string }>;

const SUGGESTED_TAGS = [
  "약물학",
  "유기화학",
  "약제학",
  "병태생리",
  "생화학",
  "약리학",
] as const;

const DOCUMENT_ACCEPT =
  ".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm";
const SAMPLE_ACCEPT = `${DOCUMENT_ACCEPT},${VIDEO_ACCEPT},image/*`;
const MAX_PRICE = 2_147_483_647;

type MarketItemFormProps =
  | { mode: "create"; marketId?: never }
  | { mode: "edit"; marketId: string };

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";

const getFileExtension = (file: File) =>
  file.name.split(".").pop()?.toLowerCase() ?? "";

const isAllowedMaterialFile = (file: File, itemType: MarketItemType) => {
  const extension = getFileExtension(file);

  if (itemType === "VIDEO") {
    return file.type
      ? file.type.startsWith("video/")
      : ["mp4", "mov", "webm"].includes(extension);
  }

  return file.type
    ? [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ].includes(file.type)
    : ["pdf", "ppt", "pptx"].includes(extension);
};

export function MarketItemForm({ mode, marketId }: MarketItemFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const numericMarketId = marketId ? Number(marketId) : undefined;

  const subjectsQuery = useSubjectsQuery();
  const detailQuery = useMarketDetailQuery(marketId, {
    enabled: isEditMode && Boolean(marketId),
  });
  const createMutation = useCreateMarketItemMutation();
  const updateMutation = useUpdateMarketItemMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [itemType, setItemType] = useState<MarketItemType>("WORKBOOK");
  const [subjectCode, setSubjectCode] = useState("");
  const [grade, setGrade] = useState<MarketGrade>("GRADE_1");
  const [price, setPrice] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const initializedMarketIdRef = useRef<string | null>(null);
  const initializedSubjectMarketIdRef = useRef<string | null>(null);
  const subjectSelectId = useId();

  const detail = detailQuery.data;
  const subjectQuery = useSubjectQuery(subjectCode);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!isEditMode || !marketId || !detail) return;
    if (initializedMarketIdRef.current === marketId) return;

    initializedMarketIdRef.current = marketId;
    setTitle(detail.title ?? "");
    setContent(detail.content ?? "");
    setItemType(detail.itemType);
    setGrade(detail.grade);
    setPrice(String(detail.price));
    setSelectedTags(detail.tags ?? []);
  }, [detail, isEditMode, marketId]);

  const subjectSections = useMemo(() => {
    return (subjectsQuery.data?.sections ?? [])
      .map((section) => ({
        title: section.sectionTitle,
        items: section.items
          .map((item) => {
            return {
              code: item.code,
              label: item.label,
            };
          })
          .filter((item) => item.code.trim().length > 0),
      }))
      .filter((section) => section.items.length > 0);
  }, [subjectsQuery.data]);

  useEffect(() => {
    if (!isEditMode || !marketId || !detail) return;
    if (initializedSubjectMarketIdRef.current === marketId) return;

    const matchedSubject = subjectSections
      .flatMap((section) => section.items)
      .find((item) => item.label === detail.subjectName);

    if (!matchedSubject) return;

    initializedSubjectMarketIdRef.current = marketId;
    setSubjectCode(matchedSubject.code);
  }, [detail, isEditMode, marketId, subjectSections]);

  const priceNumber = Number(price);
  const hasValidPrice =
    price !== "" &&
    Number.isInteger(priceNumber) &&
    priceNumber >= 0 &&
    priceNumber <= MAX_PRICE;
  const hasValidTags = selectedTags.length >= 3;
  const hasValidMaterialFile = Boolean(
    materialFile && isAllowedMaterialFile(materialFile, itemType),
  );
  const materialAccept = itemType === "VIDEO" ? VIDEO_ACCEPT : DOCUMENT_ACCEPT;
  const materialDescription =
    itemType === "VIDEO"
      ? "MP4, MOV, WebM 영상 파일을 선택해주세요."
      : "PDF, PPT, PPTX 문서 파일을 선택해주세요.";
  const resolvedSubjectId = Number(subjectQuery.data?.id);
  const hasValidSubject =
    Number.isSafeInteger(resolvedSubjectId) && resolvedSubjectId > 0;
  const formValid =
    title.trim().length > 0 &&
    hasValidPrice &&
    hasValidTags &&
    hasValidSubject &&
    hasValidMaterialFile;
  const isBusy =
    uploadingLabel !== null ||
    createMutation.isPending ||
    updateMutation.isPending;
  const canEdit =
    !isEditMode ||
    (currentUserId !== null &&
      detail !== undefined &&
      String(detail.sellerId) === currentUserId);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) return;
    setSelectedTags((current) =>
      current.includes(tag) ? current : [...current, tag],
    );
    setCustomTag("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || isComposing) return;
    event.preventDefault();
    addCustomTag();
  };

  const getValidationMessage = () => {
    if (!title.trim()) return "제목을 입력해주세요.";
    if (!hasValidSubject) return "과목을 선택해주세요.";
    if (!hasValidPrice) {
      return `가격은 0원부터 ${MAX_PRICE.toLocaleString("ko-KR")}원 사이의 정수로 입력해주세요.`;
    }
    if (!hasValidTags) return "태그를 3개 이상 선택해주세요.";
    if (!materialFile) {
      return isEditMode
        ? "수정 시 판매 자료 파일을 다시 첨부해주세요."
        : "판매할 자료 파일을 첨부해주세요.";
    }
    if (!hasValidMaterialFile) {
      return itemType === "VIDEO"
        ? "영상 자료는 MP4, MOV, WebM 파일만 등록할 수 있습니다."
        : "문서 자료는 PDF, PPT, PPTX 파일만 등록할 수 있습니다.";
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;

    const validationMessage = getValidationMessage();
    if (validationMessage) {
      setSubmitError(validationMessage);
      return;
    }

    if (isEditMode && !Number.isSafeInteger(numericMarketId)) {
      setSubmitError("수정할 자료 ID가 올바르지 않습니다.");
      return;
    }

    const uploadedFileIds: number[] = [];
    let mutationStarted = false;

    const uploadFile = async (file: File, label: string) => {
      setUploadingLabel(label);
      const completed = await uploadLargeFile(file, "MARKET");
      uploadedFileIds.push(completed.fileId);
      return completed.fileId;
    };

    try {
      setSubmitError(null);

      const materialFileId = await uploadFile(
        materialFile as File,
        "판매 자료를 업로드하는 중...",
      );
      const sampleFileId = sampleFile
        ? await uploadFile(sampleFile, "맛보기 파일을 업로드하는 중...")
        : undefined;
      const coverFileId = coverFile
        ? await uploadFile(coverFile, "커버 이미지를 업로드하는 중...")
        : undefined;

      setUploadingLabel(
        isEditMode ? "자료 정보를 수정하는 중..." : "자료를 등록하는 중...",
      );

      const commonRequest = {
        title: title.trim(),
        content: content.trim(),
        itemType,
        subjectId: resolvedSubjectId,
        grade,
        price: priceNumber,
        materialFileId,
        tags: selectedTags,
        ...(sampleFileId ? { sampleFileId } : {}),
        ...(coverFileId ? { coverFileId } : {}),
      };

      if (isEditMode) {
        const body: MarketItemUpdateRequest = commonRequest;
        mutationStarted = true;
        const updated = await updateMutation.mutateAsync({
          id: numericMarketId as number,
          body,
        });
        router.replace(`/market/${updated.id ?? numericMarketId}`);
      } else {
        const body: MarketItemCreateRequest = commonRequest;
        mutationStarted = true;
        const created = await createMutation.mutateAsync(body);
        router.replace(created.id ? `/market/${created.id}` : "/market");
      }
    } catch (error) {
      // 등록/수정 요청이 서버에 도달한 뒤에는 응답 유실 여부를 알 수 없다.
      // 이때 파일을 지우면 이미 저장된 마켓 자료가 깨질 수 있으므로 보존한다.
      if (!mutationStarted && uploadedFileIds.length > 0) {
        await Promise.allSettled(
          uploadedFileIds.map((fileId) => deleteFile(fileId)),
        );
      }
      setSubmitError(getErrorMessage(error));
    } finally {
      setUploadingLabel(null);
    }
  };

  if (isEditMode && (detailQuery.isLoading || !authChecked)) {
    return (
      <AppShell>
        <CustomHeader title="자료 수정" />
        <main className="px-6 py-8" aria-label="자료 정보를 불러오는 중">
          <div className="h-12 animate-pulse rounded-xl bg-primary-980" />
          <div className="mt-5 h-28 animate-pulse rounded-xl bg-primary-980" />
          <div className="mt-5 h-48 animate-pulse rounded-xl bg-primary-980" />
        </main>
      </AppShell>
    );
  }

  if (isEditMode && (detailQuery.isError || !detail)) {
    return (
      <AppShell>
        <CustomHeader title="자료 수정" />
        <main className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
          <p className="text-title-small text-foreground">
            자료 정보를 불러오지 못했습니다.
          </p>
          <button
            type="button"
            onClick={() => void detailQuery.refetch()}
            className="mt-3 text-label-medium text-primary"
          >
            다시 시도
          </button>
        </main>
      </AppShell>
    );
  }

  if (isEditMode && !canEdit) {
    return (
      <AppShell>
        <CustomHeader title="자료 수정" />
        <main className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
          <p className="text-title-small text-foreground">
            판매자 본인만 이 자료를 수정할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => router.replace(`/market/${marketId}`)}
            className="mt-3 text-label-medium text-primary"
          >
            상세로 돌아가기
          </button>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CustomHeader title={isEditMode ? "자료 수정" : "자료 등록"} />

      <main className="px-6 pb-8 pt-4">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-title-small text-foreground">
              제목 <span className="text-primary">*</span>
            </span>
            <input
              value={title}
              disabled={isBusy}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 rounded-xl border border-input bg-card px-4 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring disabled:bg-gray-100"
              placeholder="자료 제목을 입력해주세요"
              required
            />
          </label>

          <fieldset disabled={isBusy}>
            <legend className="text-title-small text-foreground">
              분류 <span className="text-primary">*</span>
            </legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {ITEM_TYPES.map((item) => (
                <label
                  key={item.value}
                  className={`flex h-10 items-center justify-center rounded-xl text-label-medium ${
                    itemType === item.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="itemType"
                    value={item.value}
                    checked={itemType === item.value}
                    onChange={() => setItemType(item.value)}
                    className="sr-only"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <label
              htmlFor={subjectSelectId}
              className="text-title-small text-foreground"
            >
              과목 <span className="text-primary">*</span>
            </label>
            <MarketSubjectPicker
              id={subjectSelectId}
              value={subjectCode}
              sections={subjectSections}
              isLoading={subjectsQuery.isLoading}
              disabled={isBusy}
              invalid={
                subjectsQuery.isError ||
                Boolean(subjectCode && subjectQuery.isError)
              }
              onSelect={setSubjectCode}
            />
            {subjectsQuery.isError && (
              <span className="flex items-center justify-between gap-2 text-label-small text-primary">
                과목을 불러오지 못했습니다.
                <button
                  type="button"
                  onClick={() => void subjectsQuery.refetch()}
                  className="shrink-0 font-semibold"
                >
                  다시 시도
                </button>
              </span>
            )}
            {subjectCode && subjectQuery.isLoading && (
              <span className="text-label-small text-muted-foreground">
                과목 ID를 확인하는 중...
              </span>
            )}
            {subjectCode && subjectQuery.isError && (
              <span className="flex items-center justify-between gap-2 text-label-small text-primary">
                선택한 과목 정보를 불러오지 못했습니다.
                <button
                  type="button"
                  onClick={() => void subjectQuery.refetch()}
                  className="shrink-0 font-semibold"
                >
                  다시 시도
                </button>
              </span>
            )}
          </div>

          <fieldset disabled={isBusy}>
            <legend className="text-title-small text-foreground">
              학년 <span className="text-primary">*</span>
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {GRADES.map((item) => (
                <label
                  key={item.value}
                  className={`flex h-10 items-center justify-center rounded-xl text-label-medium ${
                    grade === item.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="grade"
                    value={item.value}
                    checked={grade === item.value}
                    onChange={() => setGrade(item.value)}
                    className="sr-only"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2">
            <span className="text-title-small text-foreground">
              가격(원) <span className="text-primary">*</span>
            </span>
            <input
              type="number"
              min={0}
              max={MAX_PRICE}
              step={1}
              value={price}
              disabled={isBusy}
              onChange={(event) => setPrice(event.target.value)}
              className="h-12 rounded-xl border border-input bg-card px-4 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring disabled:bg-gray-100"
              placeholder="0원은 무료 자료로 등록됩니다"
              required
            />
          </label>

          {isEditMode && (
            <div className="rounded-xl bg-primary-980 px-4 py-3 text-body-small text-muted-foreground">
              기존 판매 파일 ID는 상세 응답에 포함되지 않아, 수정할 때 판매 자료
              파일을 다시 첨부해야 합니다. 커버와 맛보기는 새 파일을 선택하지
              않으면 해당 파일 ID를 수정 요청에서 생략합니다.
            </div>
          )}

          <MarketFileField
            label="판매 자료"
            description={materialDescription}
            accept={materialAccept}
            file={materialFile}
            onChange={setMaterialFile}
            required
            disabled={isBusy}
          />

          <div className="grid grid-cols-2 gap-4">
            <MarketFileField
              label="커버 이미지"
              description="선택 사항"
              accept="image/*"
              file={coverFile}
              onChange={setCoverFile}
              kind="image"
              disabled={isBusy}
              existingLabel={
                isEditMode && detail?.coverImageUrl
                  ? "기존 커버 있음"
                  : undefined
              }
            />
            <MarketFileField
              label="맛보기 파일"
              description="선택 사항"
              accept={SAMPLE_ACCEPT}
              file={sampleFile}
              onChange={setSampleFile}
              disabled={isBusy}
              existingLabel={
                isEditMode && detail?.hasSample ? "기존 맛보기 있음" : undefined
              }
            />
          </div>

          <section>
            <div className="flex items-center gap-2 text-title-small text-foreground">
              <Tags
                aria-hidden="true"
                className="h-4 w-4 text-brand"
                strokeWidth={1.5}
              />
              태그
            </div>
            <p className="mt-1 text-label-small text-muted-foreground">
              태그를 3개 이상 선택해주세요.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  disabled={isBusy}
                  aria-pressed={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                  className={`h-8 rounded-full border px-3 text-label-medium disabled:opacity-60 ${
                    selectedTags.includes(tag)
                      ? "border-brand bg-primary-980 text-brand"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={customTag}
                disabled={isBusy}
                onChange={(event) => setCustomTag(event.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={handleTagKeyDown}
                className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring disabled:bg-gray-100"
                placeholder="태그 직접 입력"
              />
              <button
                type="button"
                disabled={isBusy || customTag.trim().length === 0}
                onClick={addCustomTag}
                className="h-10 rounded-xl border border-border px-3 text-label-medium text-foreground active:scale-[0.98] disabled:opacity-40"
              >
                추가
              </button>
            </div>
            {selectedTags.length > 0 && (
              <div
                className="mt-3 flex flex-wrap gap-2"
                aria-label="선택된 태그"
              >
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    disabled={isBusy}
                    onClick={() => toggleTag(tag)}
                    className="flex h-8 items-center gap-1 rounded-full bg-primary-980 px-3 text-label-medium text-brand disabled:opacity-60"
                    aria-label={`${tag} 태그 삭제`}
                  >
                    {tag}
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}
            {!hasValidTags && (
              <p className="mt-2 text-label-small text-primary" role="alert">
                태그를 {3 - selectedTags.length}개 더 선택해주세요.
              </p>
            )}
          </section>

          <label className="flex flex-col gap-2">
            <span className="text-title-small text-foreground">본문 설명</span>
            <textarea
              value={content}
              disabled={isBusy}
              maxLength={500}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-32 rounded-xl border border-input bg-card px-4 py-3 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring disabled:bg-gray-100"
              placeholder="자료 구성과 활용 방법을 설명해주세요."
            />
            <span className="self-end text-body-small text-muted-foreground">
              {content.length}/500
            </span>
          </label>

          {submitError && (
            <p
              className="rounded-xl bg-primary-980 px-4 py-3 text-body-small text-primary"
              role="alert"
            >
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={!formValid || isBusy || subjectsQuery.isError}
            className="h-[3.625rem] rounded-xl bg-primary text-label-large text-primary-foreground active:scale-[0.98] disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-500"
          >
            {uploadingLabel ?? (isEditMode ? "자료 수정하기" : "자료 등록하기")}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
