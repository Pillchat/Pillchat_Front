"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useReviewStudentVerificationMutation } from "@/hooks/mutations/useStudentVerificationMutation";
import {
  formatVerificationDate,
  type StudentVerification,
} from "@/lib/client/studentVerification";

export function StudentVerificationRequest({
  request,
}: {
  request: StudentVerification;
}) {
  const review = useReviewStudentVerificationMutation();
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const lock = useRef(false);
  const decide = async (decision: "APPROVED" | "REJECTED") => {
    if (lock.current || !imageReady || review.isSuccess) return;
    lock.current = true;
    try {
      await review.mutateAsync({ id: request.id, decision });
    } catch {
      /* The list refreshes after a conflict or uncertain response. */
    } finally {
      lock.current = false;
    }
  };
  return (
    <article
      aria-label={request.userName + "의 인증 요청"}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1 min-[481px]:flex-row min-[481px]:items-center min-[481px]:justify-between min-[481px]:gap-3">
        <h2 className="break-words text-headline-medium">{request.userName}</h2>
        <time
          dateTime={request.submittedAt}
          className="shrink-0 text-body-medium tabular-nums text-gray-800"
        >
          {formatVerificationDate(request.submittedAt)}
        </time>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={request.imageUrl}
        alt={request.userName + "이 첨부한 학생증"}
        className="h-auto w-full rounded-xl border border-gray-100"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setImageReady(true);
          setImageError(false);
        }}
        onError={() => {
          setImageReady(false);
          setImageError(true);
        }}
      />
      {imageError && (
        <p role="alert" className="text-body-medium text-destructive">
          학생증 이미지를 불러오지 못했어요. 페이지를 새로고침해주세요.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="text-xl font-bold text-gray-800"
          disabled={!imageReady || review.isPending || review.isSuccess}
          onClick={() => void decide("REJECTED")}
        >
          거부
        </Button>
        <Button
          className="text-xl font-bold"
          disabled={!imageReady || review.isPending || review.isSuccess}
          onClick={() => void decide("APPROVED")}
        >
          승인
        </Button>
      </div>
      {review.isError && (
        <p role="alert" className="text-body-medium text-destructive">
          {review.error.message}
        </p>
      )}
    </article>
  );
}
