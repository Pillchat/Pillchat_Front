"use client";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/client/fetch";
type Job = {
  jobId: string;
  title: string;
  body: string;
  status: string;
  counts: Record<string, number>;
  audience: string;
  createdAt: string;
};
export default function PushHistory() {
  const [items, setItems] = useState<Job[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = async (next?: string) => {
    try {
      const page = await fetchAPI("/api/admin/push-jobs", "GET", {
        cursor: next,
        size: 20,
      });
      setItems((prev) => (next ? [...prev, ...page.items] : page.items));
      setCursor(page.hasNext ? page.nextCursor : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이력 조회 실패");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="space-y-4 p-5">
      {error && <p role="alert">{error}</p>}
      {!items.length && !error && <p>발송 이력이 없습니다.</p>}
      {items.map((job) => (
        <article key={job.jobId} className="space-y-2 rounded-xl border p-4">
          <h2 className="font-semibold">{job.title}</h2>
          <p>{job.body}</p>
          <p>
            {job.status} · {job.audience} · {job.createdAt}
          </p>
          <dl>
            {Object.entries(job.counts).map(([status, count]) => (
              <div className="flex gap-2" key={status}>
                <dt>{status}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
      {cursor && <button onClick={() => void load(cursor)}>더 보기</button>}
    </section>
  );
}
