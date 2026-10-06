"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { SolidButton, TextareaWithLabel } from "@/components/atoms";
import { IconInputField } from "@/components/molecules";
import { BoardButton, BoardHeader } from "@/components/molecules/board";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AttachedItem = {
  id: string;
  name: string;
  type: "image" | "pdf";
  previewUrl?: string;
};

type Inquiry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  attachments: string[];
};

const STORAGE_KEY = "yakchat:support-inquiries";
const MAX_CONTENT_LENGTH = 1000;
const MAX_IMAGE_COUNT = 10;

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
  attachmentGuide: "이미지 파일 (JPG, PNG 등) 최대 10장 가능 또는 PDF 파일 1개",
  imageUpload: "이미지 업로드",
  fileUpload: "파일 업로드",
  remove: "제거",
  mixedAttachment: "PDF 파일은 이미지와 함께 첨부되었습니다.",
  submit: "제출하기",
  completeTitle: "제출 완료",
  completeMessage: "빠른 시일내에 확인하여 답변드리겠습니다.",
  confirm: "확인",
  emptyHistory: "아직 문의 내역이 없습니다.",
  received: "접수",
  attachmentCount: "첨부",
};

const readStoredInquiries = (): Inquiry[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const SupportPage = () => {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachedItems, setAttachedItems] = useState<AttachedItem[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  useEffect(() => {
    setInquiries(readStoredInquiries());
  }, []);

  useEffect(() => {
    return () => {
      attachedItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [attachedItems]);

  const imageCount = useMemo(
    () => attachedItems.filter((item) => item.type === "image").length,
    [attachedItems],
  );
  const hasPdf = useMemo(
    () => attachedItems.some((item) => item.type === "pdf"),
    [attachedItems],
  );
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const openImagePicker = () => imageInputRef.current?.click();
  const openPdfPicker = () => pdfInputRef.current?.click();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      ["image/jpeg", "image/png"].includes(file.type),
    );
    const slotsLeft = MAX_IMAGE_COUNT - imageCount;
    const nextItems = files.slice(0, slotsLeft).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: "image" as const,
      previewUrl: URL.createObjectURL(file),
    }));

    setAttachedItems((current) => [...current, ...nextItems]);
    event.target.value = "";
  };

  const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file?.type === "application/pdf") {
      setAttachedItems((current) => [
        ...current.filter((item) => item.type !== "pdf"),
        {
          id: crypto.randomUUID(),
          name: file.name,
          type: "pdf",
        },
      ]);
    }

    event.target.value = "";
  };

  const removeItem = (id: string) => {
    setAttachedItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const nextInquiry: Inquiry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      attachments: attachedItems.map((item) => item.name),
    };
    const nextInquiries = [nextInquiry, ...inquiries];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInquiries));
    setInquiries(nextInquiries);
    setTitle("");
    setContent("");
    setAttachedItems([]);
    setIsCompleteModalOpen(true);
  };

  const handleCompleteConfirm = () => {
    setIsCompleteModalOpen(false);
    router.push("/mypage");
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
              value={title}
              inputClassName="border-[#C4C4C4] focus-visible:border-[#C4C4C4] focus-visible:ring-[#C4C4C4]"
              onChange={(event) =>
                setTitle(
                  event.target.value
                    .replace(/^\s+/, "")
                    .replace(/\s{2,}/g, " ")
                    .slice(0, 30),
                )
              }
            />
          </div>

          <div className="mb-5 w-full px-6">
            <TextareaWithLabel
              label={TEXT.contentLabel}
              placeholder={TEXT.contentPlaceholder}
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

            {attachedItems.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {attachedItems.map((item) => (
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

            {hasPdf && imageCount > 0 && (
              <p className="mt-2 text-xs text-[#999999]">
                {TEXT.mixedAttachment}
              </p>
            )}
          </div>

          <div className="mt-auto px-6 pt-10">
            <SolidButton
              content={TEXT.submit}
              disabled={!canSubmit}
              onClick={handleSubmit}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
          {inquiries.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[#999999]">
              {TEXT.emptyHistory}
            </div>
          ) : (
            inquiries.map((inquiry, index) => (
              <div key={inquiry.id}>
                <article
                  className="cursor-pointer py-4"
                  onClick={() => router.push(`/support/${inquiry.id}`)}
                >
                  <div className="min-w-0">
                    <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold">
                      {inquiry.title}
                    </div>
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap pt-2 text-xs text-muted-foreground">
                      <span>{inquiry.content}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-border">
                    <div className="flex-1">
                      <span>
                        {new Intl.DateTimeFormat("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }).format(new Date(inquiry.createdAt))}
                      </span>
                    </div>
                  </div>
                </article>
                {index < inquiries.length - 1 && <Separator />}
              </div>
            ))
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
