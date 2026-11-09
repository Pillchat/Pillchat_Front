"use client";
import { useState } from "react";
import Link from "next/link";
import { CustomHeader } from "@/components/molecules";
import { useNoticesQuery } from "@/hooks/queries/useNoticesQuery";
export default function NoticesPage() {
  const [page, setPage] = useState(0);
  const query = useNoticesQuery(page);
  const data = query.data;
  return (
    <div className="min-h-dvh">
      <CustomHeader title="공지사항" />
      <main className="space-y-4 p-5">
        {query.isError && (
          <p role="alert">
            {query.error.message}{" "}
            <button
              type="button"
              className="text-primary underline"
              onClick={() => void query.refetch()}
            >
              다시 시도
            </button>
          </p>
        )}
        {query.isPending && <p role="status">불러오는 중입니다.</p>}
        {data?.content.length === 0 && <p>등록된 공지가 없습니다.</p>}
        {data?.content.map((n) => (
          <Link
            key={n.id}
            href={`/notices/${n.id}`}
            className="block rounded-xl border p-4"
          >
            <p>
              {n.pinned ? "[중요] " : ""}
              {n.title}
            </p>
            <time className="text-sm text-muted-foreground">
              {n.publishedAt?.slice(0, 10)}
            </time>
          </Link>
        ))}
        <div className="flex justify-between">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            이전
          </button>
          <button
            disabled={!data || data.last}
            onClick={() => setPage(page + 1)}
          >
            다음
          </button>
        </div>
      </main>
    </div>
  );
}
