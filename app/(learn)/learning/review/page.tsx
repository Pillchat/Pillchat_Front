"use client";
import { useEffect, useRef, useState } from "react";
import { fetchAPI } from "@/lib/client/fetch";
import { LearningCommands } from "@/lib/learning/api";
import { CustomHeader } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/navigation";
type Collection = {
  collectionRef: string;
  source: string;
  title: string;
  total: number;
  wrong: number;
  bookmarked: number;
};
export default function ServerReviewPage() {
  const router = useRouter();
  const [source, setSource] = useState("HANDCRAFTED");
  const [items, setItems] = useState<Collection[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const commands = useRef(new LearningCommands());
  const lock = useRef(false);
  const load = async (next?: string) => {
    const page = await fetchAPI("/api/learning/review/collections", "GET", {
      source,
      cursor: next,
      limit: 20,
    });
    setItems((prev) => (next ? [...prev, ...page.items] : page.items));
    setCursor(page.nextCursor);
  };
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setError("");
    void load().catch((e) => setError(e.message));
  }, [source]);
  const start = async (collection?: Collection, mode?: string) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response: any = commands.current.pending
        ? await commands.current.retry()
        : await commands.current.send("/api/learning/review/attempts", "POST", {
            collectionRef: collection!.collectionRef,
            mode,
          });
      if (response.engine === "LEARNING") {
        const attempt = response.result.attempt;
        router.push(
          `${attempt.source === "CBT" ? "/learning/cbt" : "/questionbank/handcrafted"}?attempt=${encodeURIComponent(attempt.attemptId)}`,
        );
      } else if (response.engine === "LEGACY_AI")
        router.push(
          `/learning/ai?session=${encodeURIComponent(response.result.sessionId)}`,
        );
      else throw new Error("지원하지 않는 학습 엔진입니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "복습 시작에 실패했습니다.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="min-h-dvh pb-20">
      <CustomHeader title="학습 복습" />
      <main className="space-y-4 p-5">
        <div className="flex gap-2">
          {["HANDCRAFTED", "CBT", "AI"].map((s, i) => (
            <Button
              key={s}
              disabled={busy || !!commands.current.pending}
              variant={source === s ? "default" : "outline"}
              onClick={() => setSource(s)}
            >
              {["수제 문제", "CBT", "AI"][i]}
            </Button>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {commands.current.pending && (
          <Button disabled={busy} onClick={() => void start()}>
            같은 요청 다시 시도
          </Button>
        )}
        {!items.length && !error && <p>복습할 학습 기록이 없습니다.</p>}
        {items.map((item) => (
          <article
            key={item.collectionRef}
            className="space-y-3 rounded-xl border p-4"
          >
            <h2 className="font-semibold">{item.title}</h2>
            <p>
              전체 {item.total} · 오답 {item.wrong}
              {source !== "CBT" && ` · 북마크 ${item.bookmarked}`}
            </p>
            <div className="flex gap-2">
              {[
                "ALL",
                "WRONG",
                ...(source !== "CBT" ? ["BOOKMARKED"] : []),
              ].map((mode, i) => (
                <Button
                  key={mode}
                  variant="outline"
                  disabled={busy || !!commands.current.pending}
                  onClick={() => void start(item, mode)}
                >
                  {["전체 복습", "오답 복습", "북마크 복습"][i]}
                </Button>
              ))}
            </div>
          </article>
        ))}
        {cursor && (
          <Button
            onClick={() => void load(cursor).catch((e) => setError(e.message))}
          >
            더 보기
          </Button>
        )}
      </main>
    </div>
  );
}
