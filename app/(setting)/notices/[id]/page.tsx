"use client";
import { use, useEffect, useState } from "react";
import { CustomHeader } from "@/components/molecules";
import { fetchAPI } from "@/lib/client/fetch";
export default function NoticeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [notice, setNotice] = useState<{
    title: string;
    content: string;
    publishedAt: string;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetchAPI(`/api/notices/${encodeURIComponent(id)}`, "GET")
      .then(setNotice)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <div className="min-h-dvh">
      <CustomHeader title="공지사항" />
      <article className="space-y-4 p-5">
        {error && <p role="alert">{error}</p>}
        {notice && (
          <>
            <h1 className="text-xl font-semibold">{notice.title}</h1>
            <time>{notice.publishedAt?.slice(0, 10)}</time>
            <p className="whitespace-pre-wrap">{notice.content}</p>
          </>
        )}
      </article>
    </div>
  );
}
