"use client";
import Link from "next/link";

export default function ResultActions({
  review,
  masteredAvailable = false,
  wrongCount = 0,
  onReviewWrong,
}: {
  review: boolean;
  masteredAvailable?: boolean;
  wrongCount?: number;
  onReviewWrong?: () => void;
}) {
  const primaryClass =
    "flex min-h-[58px] items-center justify-center rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white";
  const secondaryClass =
    "flex min-h-[58px] items-center justify-center rounded-xl bg-accent px-4 py-3 text-center font-semibold text-primary";
  if (!review) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {wrongCount > 0 && onReviewWrong ? (
          <button
            type="button"
            onClick={onReviewWrong}
            className={primaryClass}
          >
            이번 세트 오답 해설
          </button>
        ) : (
          <Link href="/questionbank" className={primaryClass}>
            새 문제 풀기
          </Link>
        )}
        <Link href="/learning/weakness" className={secondaryClass}>
          전체 약점공략
        </Link>
      </div>
    );
  }
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
        <Link href={"/learning/weakness/mastered"} className={primaryClass}>
          극복한 문제 보기
        </Link>
      )}
      <Link href="/learning/weakness" className={secondaryClass}>
        약점공략 홈으로
      </Link>
    </div>
  );
}
