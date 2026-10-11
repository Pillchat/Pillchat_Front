"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { SolidButton, TextareaWithLabel } from "@/components/atoms";
import { IconInputField } from "@/components/molecules";
import { BoardButton, BoardHeader } from "@/components/molecules/board";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import {
  SupportSubmission,
  readSupportInquiries,
  supportErrorMessage,
  supportStatusLabel,
  validateSupportFiles,
} from "@/lib/client/support";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AttachedItem = {
  id: string;
  name: string;
  type: "image" | "pdf";
  previewUrl?: string;
  file: File;
};

const MAX_CONTENT_LENGTH = 1000;

const TEXT = {
  pageTitle: "문의하기",
  formTabPrefix: "1:1",
  formTab: "문의하기",
  historyTab: "나의 문의 내역",
  titleLabel: "제목",
  titlePlaceholder: "제목을 입력해주세요.",
  contentLabel: "문의 내용",
  contentPlaceholder: "문의 내용을 입력해주세요.",
  attachmentLabel: "첨부파일",
  attachmentGuide:
    "JPG·PNG 최대 10장 또는 PDF 1개 · 이미지 각 10MB, PDF·합계 30MB",
  imageUpload: "이미지 업로드",
  fileUpload: "파일 업로드",
  remove: "제거",
  submit: "제출하기",
  completeTitle: "제출 완료",
  completeMessage: "빠른 시일내에 확인하여 답변드리겠습니다.",
  confirm: "확인",
  emptyHistory: "아직 문의 내역이 없습니다.",
};

const SupportPage = () => {
  const userId = useAuthIdentity();
  return <SupportForm key={userId ?? "guest"} userId={userId} />;
};

const SupportForm = ({ userId }: { userId: string | null }) => {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachedItems, setAttachedItems] = useState<AttachedItem[]>([]);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLock = useRef(false);
  const requestRef = useRef<{
    signature: string;
    submission: SupportSubmission;
  } | null>(null);
  const previews = useRef(new Set<string>());
  const history = useInfiniteQuery({
    queryKey: ["support-inquiries", userId],
    queryFn: ({ pageParam }) => readSupportInquiries(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: !!userId && activeTab === "history",
    retry: false,
    staleTime: 0,
  });
  const inquiries = history.data?.pages.flatMap((page) => page.items) ?? [];
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const inputLocked =
    isSubmitting || !!requestRef.current?.submission.uncertain;
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const openImagePicker = () => {
    if (!inputLocked) imageInputRef.current?.click();
  };
  const openPdfPicker = () => {
    if (!inputLocked) pdfInputRef.current?.click();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (inputLocked) return;
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (
      files.some((file) => !["image/jpeg", "image/png"].includes(file.type))
    ) {
      setError("JPG 또는 PNG 이미지를 선택해주세요.");
      return;
    }
    const message = validateSupportFiles([
      ...attachedItems.map((item) => item.file),
      ...files,
    ]);
    if (message) {
      setError(message);
      return;
    }
    const nextItems = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previews.current.add(previewUrl);
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: "image" as const,
        previewUrl,
        file,
      };
    });
    setAttachedItems((current) => [...current, ...nextItems]);
    setError(null);
  };

  const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (inputLocked) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("PDF 파일을 선택해주세요.");
      return;
    }
    const remaining = attachedItems.filter((item) => item.type !== "pdf");
    const message = validateSupportFiles([
      ...remaining.map((item) => item.file),
      file,
    ]);
    if (message) {
      setError(message);
      return;
    }
    setAttachedItems([
      ...remaining,
      { id: crypto.randomUUID(), name: file.name, type: "pdf", file },
    ]);
    setError(null);
  };

  const removeItem = (id: string) => {
    if (inputLocked) return;
    setAttachedItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        previews.current.delete(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitLock.current) return;
    if (!userId) {
      setError("로그인 후 문의를 제출해주세요.");
      return;
    }
    submitLock.current = true;
    setIsSubmitting(true);
    setError(null);
    const signature = JSON.stringify([
      title.trim(),
      content.trim(),
      attachedItems.map((item) => item.id),
    ]);
    if (requestRef.current?.signature !== signature)
      requestRef.current = {
        signature,
        submission: new SupportSubmission({
          title,
          content,
          files: attachedItems.map((item) => item.file),
        }),
      };
    try {
      await requestRef.current.submission.submit();
      void queryClient.invalidateQueries({
        queryKey: ["support-inquiries", userId],
      });
      setTitle("");
      setContent("");
      previews.current.forEach((url) => URL.revokeObjectURL(url));
      previews.current.clear();
      setAttachedItems([]);
      requestRef.current = null;
      setIsCompleteModalOpen(true);
    } catch (error) {
      setError(supportErrorMessage(error, true));
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCompleteConfirm = () => {
    setIsCompleteModalOpen(false);
    setActiveTab("history");
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col bg-white">
      <BoardHeader
        title={TEXT.pageTitle}
        showIcon
        onRightButtonClick={() => router.push("/")}
      />

      <div className="grid h-[34px] shrink-0 grid-cols-2 border-b border-[#C4C4C4]">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={cn(
            "relative flex items-center justify-center text-[18px] font-semibold leading-[34px]",
            activeTab === "form" ? "text-primary" : "text-[#666666]",
          )}
        >
          <span>{TEXT.formTabPrefix}</span>
          <span className="ml-1">{TEXT.formTab}</span>
          {activeTab === "form" && (
            <span className="absolute bottom-0 h-0.5 w-[124px] bg-primary" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "relative flex items-center justify-center text-[18px] font-semibold leading-[34px]",
            activeTab === "history" ? "text-primary" : "text-[#666666]",
          )}
        >
          {TEXT.historyTab}
          {activeTab === "history" && (
            <span className="absolute bottom-0 h-0.5 w-[144px] bg-primary" />
          )}
        </button>
      </div>

      {activeTab === "form" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-8">
          <div className="mb-5 w-full px-6 pt-5">
            <IconInputField
              content={TEXT.titleLabel}
              placeholder={TEXT.titlePlaceholder}
              disabled={inputLocked}
              value={title}
              inputClassName="border-[#C4C4C4] focus-visible:border-[#C4C4C4] focus-visible:ring-[#C4C4C4]"
              onChange={(event) =>
                setTitle(
                  event.target.value
                    .replace(/^\s+/, "")
                    .replace(/\s{2,}/g, " ")
                    .slice(0, 200),
                )
              }
            />
          </div>

          <div className="mb-5 w-full px-6">
            <TextareaWithLabel
              label={TEXT.contentLabel}
              placeholder={TEXT.contentPlaceholder}
              disabled={inputLocked}
              value={content}
              maxLength={MAX_CONTENT_LENGTH}
              className="max-h-[50dvh] border-[#C4C4C4] focus-visible:border-[#C4C4C4] focus-visible:ring-[#C4C4C4]"
              onChange={(event) => setContent(event.target.value)}
              showMaxLengthError
            />
          </div>

          <div className="px-6">
            <p className="mb-3 text-xs">{TEXT.attachmentLabel}</p>
            <p className="mb-1 text-xs text-[#999]">{TEXT.attachmentGuide}</p>

            <div className="grid w-full grid-cols-2 gap-4">
              <BoardButton
                imageSrc={PUBLIC_ASSETS.icons.image}
                text={TEXT.imageUpload}
                onClick={openImagePicker}
                type="button"
              />
              <BoardButton
                imageSrc={PUBLIC_ASSETS.icons.file}
                text={TEXT.fileUpload}
                onClick={openPdfPicker}
                type="button"
              />
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png"
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

            {attachedItems.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {attachedItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square overflow-hidden border border-[#C4C4C4] bg-[#F8F8F8]"
                  >
                    <button
                      type="button"
                      disabled={inputLocked}
                      onClick={() => removeItem(item.id)}
                      className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center"
                    >
                      <img
                        src={PUBLIC_ASSETS.icons.removeCircleGray}
                        alt={TEXT.remove}
                      />
                    </button>

                    {item.type === "image" ? (
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
                        <img
                          src={PUBLIC_ASSETS.icons.file}
                          alt=""
                          className="h-8 w-8"
                        />
                        <span className="line-clamp-2 text-xs text-[#666666]">
                          {item.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto px-6 pt-10">
            {error && (
              <p role="alert" className="mb-3 text-sm text-red-600">
                {error}
              </p>
            )}
            {!userId && (
              <p className="mb-3 text-sm text-muted-foreground">
                로그인 후 문의를 제출할 수 있습니다.
              </p>
            )}
            <SolidButton
              content={
                isSubmitting
                  ? "제출 중..."
                  : requestRef.current?.submission.uncertain
                    ? "같은 문의 다시 제출"
                    : TEXT.submit
              }
              disabled={!canSubmit || isSubmitting || !userId}
              onClick={handleSubmit}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
          {!userId ? (
            <p className="py-10 text-center text-sm">
              로그인 후 문의 내역을 확인할 수 있습니다.
            </p>
          ) : history.isPending ? (
            <p role="status" className="py-10 text-center text-sm">
              문의 내역을 불러오는 중...
            </p>
          ) : history.isError ? (
            <div role="alert" className="py-10 text-center text-sm">
              <p>{supportErrorMessage(history.error)}</p>
              <button
                type="button"
                className="mt-3 text-primary"
                onClick={() => void history.refetch()}
              >
                다시 불러오기
              </button>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[#999999]">
              {TEXT.emptyHistory}
            </div>
          ) : (
            inquiries.map((inquiry, index) => (
              <div key={inquiry.id}>
                <button
                  type="button"
                  className="w-full py-4 text-left"
                  onClick={() =>
                    router.push(`/support/${encodeURIComponent(inquiry.id)}`)
                  }
                >
                  <div className="min-w-0">
                    <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold">
                      {inquiry.title}
                    </div>
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap pt-2 text-xs text-muted-foreground">
                      <span>{inquiry.content}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{supportStatusLabel(inquiry.status)}</span>
                    <div className="flex-1">
                      <span>
                        {new Intl.DateTimeFormat("ko-KR", {
                          timeZone: "Asia/Seoul",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }).format(new Date(inquiry.createdAt))}
                      </span>
                    </div>
                  </div>
                </button>
                {index < inquiries.length - 1 && <Separator />}
              </div>
            ))
          )}
          {userId && history.hasNextPage && !history.isError && (
            <button
              type="button"
              disabled={history.isFetchingNextPage}
              className="py-4 text-sm text-primary"
              onClick={() => void history.fetchNextPage()}
            >
              {history.isFetchingNextPage ? "불러오는 중..." : "더 보기"}
            </button>
          )}
        </div>
      )}

      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-80 max-w-[90%] overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="p-6 text-center">
              <h2 className="mb-2 text-lg font-semibold">
                {TEXT.completeTitle}
              </h2>
              <p className="whitespace-pre-line text-gray-600">
                {TEXT.completeMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompleteConfirm}
              className="w-full border-t border-gray-200 py-3 text-center font-semibold text-brand hover:bg-gray-50"
            >
              {TEXT.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
