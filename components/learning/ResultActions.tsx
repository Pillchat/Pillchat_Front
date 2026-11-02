"use client";
import Link from "next/link";
import type { ReviewSource } from "@/types/review";

export default function ResultActions({
  review,
  source,
  masteredAvailable = false,
}: {
  review: boolean;
  source: ReviewSource;
  masteredAvailable?: boolean;
}) {
  const primaryClass =
    "flex min-h-[58px] items-center justify-center rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white";
  return (
    <div className="grid grid-cols-2 gap-3">
      {review && !masteredAvailable ? (
        <button
          type="button"
          disabled
          className={
            "flex min-h-[58px] items-center justify-center rounded-xl bg-gray-100 px-4 py-3 text-center font-semibold text-gray-400"
          }
        >
          극복한 문제 보기
        </button>
      ) : (
        <Link
          href={
            review
              ? "/learning/weakness/mastered"
              : `/learning/weakness?range=wrong&sources=${source}&sort=due`
          }
          className={primaryClass}
        >
          {review ? "극복한 문제 보기" : "오답 복습하기"}
        </Link>
      )}
      <Link
        href={review ? "/learning/weakness" : "/questionbank"}
        className="flex min-h-[58px] items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-center font-semibold"
      >
        {review ? "약점공략 홈으로" : "문제 풀기로 돌아가기"}
      </Link>
    </div>
  );
}
