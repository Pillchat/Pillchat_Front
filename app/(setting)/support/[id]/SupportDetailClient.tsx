"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomHeader } from "@/components/molecules";

type Inquiry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  attachments: string[];
};

const STORAGE_KEY = "yakchat:support-inquiries";

const TEXT = {
  headerTitle: "나의 문의 내역",
  writer: "나",
  loading: "문의 내역을 불러오는 중...",
  notFound: "문의 내역을 찾을 수 없습니다.",
  attachment: "첨부파일",
  answer: "답변",
  noAnswer: "아직 답변이 없습니다.",
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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));

const SupportDetailClient = ({ inquiryId }: { inquiryId: string }) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setInquiries(readStoredInquiries());
    setIsReady(true);
  }, []);

  const inquiry = useMemo(
    () => inquiries.find((item) => item.id === inquiryId),
    [inquiries, inquiryId],
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CustomHeader title={TEXT.headerTitle} showIcon />

      {!isReady && (
        <div className="mx-6 my-5 h-96 animate-pulse rounded bg-gray-100">
          <span className="sr-only">{TEXT.loading}</span>
        </div>
      )}

      {isReady && !inquiry && (
        <div className="flex flex-1 items-center justify-center px-6 text-sm text-[#999999]">
          {TEXT.notFound}
        </div>
      )}

      {inquiry && (
        <>
          <div className="mx-6 flex flex-col gap-6 pb-10 pt-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-left text-xl font-semibold">
                  {inquiry.title}
                </div>
                <div className="flex flex-row justify-between text-sm text-muted-foreground">
                  <div className="flex flex-row items-center gap-3 align-middle">
                    <span className="text-foreground">{TEXT.writer}</span>
                    <span>{formatDateTime(inquiry.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="whitespace-pre-wrap text-foreground">
                  {inquiry.content}
                </div>

                {inquiry.attachments.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-[#E5E5E5]">
                    <div className="border-b border-[#E5E5E5] bg-[#F8F8F8] px-4 py-3 text-sm font-medium text-[#111111]">
                      {TEXT.attachment}
                    </div>
                    <div className="flex flex-col">
                      {inquiry.attachments.map((attachment) => (
                        <div
                          key={attachment}
                          className="border-b border-[#E5E5E5] px-4 py-3 text-sm text-[#666666] last:border-b-0"
                        >
                          {attachment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t-[12px] border-t-[#fdf6f5]">
            <div className="px-6 pb-6 pt-6">
              <div className="py-10 text-center text-sm text-[#999999]">
                {TEXT.noAnswer}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportDetailClient;
