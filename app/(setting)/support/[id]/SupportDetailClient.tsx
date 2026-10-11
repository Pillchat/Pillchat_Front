"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { CustomHeader } from "@/components/molecules";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import {
  downloadSupportAttachment,
  readSupportInquiry,
  supportErrorMessage,
  supportStatusLabel,
  SupportAttachment,
} from "@/lib/client/support";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

export default function SupportDetailClient({
  inquiryId,
}: {
  inquiryId: string;
}) {
  const userId = useAuthIdentity();
  return (
    <SupportDetail
      key={`${userId}:${inquiryId}`}
      inquiryId={inquiryId}
      userId={userId}
    />
  );
}
function SupportDetail({
  inquiryId,
  userId,
}: {
  inquiryId: string;
  userId: string | null;
}) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["support-inquiry", userId, inquiryId],
    queryFn: () => readSupportInquiry(inquiryId),
    enabled: !!userId,
    retry: false,
    staleTime: 0,
  });
  const inquiry = query.data;
  const download = async (attachment: SupportAttachment) => {
    if (downloadingId) return;
    setDownloadError(null);
    setDownloadingId(attachment.id);
    try {
      await downloadSupportAttachment(inquiryId, attachment);
    } catch {
      setDownloadError(
        "첨부파일을 내려받지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setDownloadingId(null);
    }
  };
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <CustomHeader title="나의 문의 내역" showIcon />
      {!userId ? (
        <p className="px-6 py-10 text-center text-sm">
          로그인 후 문의 내역을 확인할 수 있습니다.
        </p>
      ) : query.isPending ? (
        <LoadingIndicator
          label="문의 내역을 불러오는 중..."
          className="mx-6 my-5 h-96"
        />
      ) : query.isError ? (
        <div role="alert" className="px-6 py-10 text-center text-sm">
          <p>{supportErrorMessage(query.error)}</p>
          <button
            type="button"
            className="mt-3 text-primary"
            onClick={() => void query.refetch()}
          >
            다시 불러오기
          </button>
        </div>
      ) : (
        inquiry && (
          <>
            <div className="mx-6 flex flex-col gap-6 pb-10 pt-5">
              <div>
                <span className="text-sm text-primary">
                  {supportStatusLabel(inquiry.status)}
                </span>
                <h1 className="mt-2 break-words text-xl font-semibold">
                  {inquiry.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  나 · {formatDateTime(inquiry.createdAt)}
                </p>
              </div>
              <p className="whitespace-pre-wrap break-words">
                {inquiry.content}
              </p>
              {inquiry.attachments.length > 0 && (
                <section className="overflow-hidden rounded-lg border border-border">
                  <h2 className="border-b bg-muted px-4 py-3 text-sm font-medium">
                    첨부파일
                  </h2>
                  {inquiry.attachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      type="button"
                      disabled={!!downloadingId}
                      onClick={() => void download(attachment)}
                      className="block w-full break-words border-b px-4 py-3 text-left text-sm text-primary last:border-b-0 disabled:opacity-50"
                    >
                      {attachment.name} ·{" "}
                      {downloadingId === attachment.id
                        ? "내려받는 중..."
                        : "다운로드"}
                    </button>
                  ))}
                  {downloadError && (
                    <p role="alert" className="px-4 py-3 text-sm text-red-600">
                      {downloadError}
                    </p>
                  )}
                </section>
              )}
            </div>
            <section className="border-t-[12px] border-t-[#fdf6f5] px-6 py-6">
              <h2 className="font-semibold">답변</h2>
              {inquiry.answer === null ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  아직 답변이 없습니다.
                </p>
              ) : (
                <article className="py-5">
                  <p className="text-sm text-muted-foreground">
                    {inquiry.answer.authorName} ·{" "}
                    {formatDateTime(inquiry.answer.answeredAt)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words">
                    {inquiry.answer.content}
                  </p>
                </article>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
