"use client";

import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { useNoticesQuery } from "@/hooks/queries/useNoticesQuery";

export default function HomeNotice({ enabled }: { enabled: boolean }) {
  const query = useNoticesQuery(0, 1, enabled);
  const notice = query.data?.content.find((item) => item.pinned);
  if (!enabled || (!notice && !query.isLoading && !query.isError)) return null;
  return (
    <section aria-label="홈 공지사항" className="mb-2 px-5 md:px-10">
      {notice ? (
        <Link
          href={`/notices/${encodeURIComponent(notice.id)}`}
          aria-label={`공지사항: ${notice.title}`}
          className="flex min-h-12 items-center gap-3 rounded-xl bg-brandSecondary px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Megaphone
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-primary"
            strokeWidth={1.5}
          />
          <span className="shrink-0 text-sm font-semibold text-primary">
            공지
          </span>
          <span className="min-w-0 flex-1 truncate border-l border-gray-300 pl-3 text-sm">
            {notice.title}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
          />
        </Link>
      ) : query.isError ? (
        <div
          role="alert"
          className="flex min-h-12 items-center justify-between gap-3 text-xs text-muted-foreground"
        >
          <span>공지를 불러오지 못했어요.</span>
          <button
            type="button"
            className="min-h-11 shrink-0 text-primary underline"
            onClick={() => void query.refetch()}
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div
          role="status"
          aria-label="공지 불러오는 중"
          className="h-12 animate-pulse rounded-xl bg-gray-50"
        />
      )}
    </section>
  );
}
