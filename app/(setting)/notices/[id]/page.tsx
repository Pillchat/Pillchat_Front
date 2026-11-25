"use client";
import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/molecules/AppShell";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { NoticeArticle } from "@/components/notices/NoticeArticle";
import { useNoticeQuery } from "@/hooks/queries/useNoticesQuery";
export default function NoticeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const query = useNoticeQuery(id);
  return (
    <AppShell bottomNav={false} bottomSpacing="none">
      <CustomHeader title="공지사항" titleAlign="left" />
      {query.isPending ? (
        <LoadingIndicator label="공지 불러오는 중…" className="py-16" />
      ) : query.isError ? (
        <div role="alert" className="space-y-3 px-6 py-10 text-sm">
          <p>{query.error.message}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="min-h-11 text-primary underline"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <NoticeArticle {...query.data} />
      )}
      <div className="mx-6 mt-2 border-t border-gray-200 py-3 md:mx-10">
        <Link
          href="/notices"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          목록으로
        </Link>
      </div>
    </AppShell>
  );
}
