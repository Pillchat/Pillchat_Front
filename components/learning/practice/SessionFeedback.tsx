"use client";
import type { LearningSession } from "@/hooks/useLearningSession";
export function SessionFeedback({ session }: { session: LearningSession }) {
  if (!session.error && !session.pending) return null;
  return (
    <div
      className="mx-auto my-3 max-w-3xl rounded-xl bg-red-50 p-4 text-sm text-red-700"
      role="alert"
    >
      {session.error}
      {session.pending ? (
        <button
          type="button"
          disabled={session.busy}
          onClick={() => void session.retry()}
          className="ml-3 font-bold underline"
        >
          같은 요청 다시 시도
        </button>
      ) : (
        <button
          type="button"
          disabled={session.busy}
          onClick={() => void session.reconnect()}
          className="ml-3 font-bold underline"
        >
          다시 불러오기
        </button>
      )}
    </div>
  );
}
export function AttemptHistory({ session }: { session: LearningSession }) {
  if (!session.history.length) return null;
  return (
    <section className="mt-6 space-y-2">
      <h2 className="text-sm font-bold">최근 학습</h2>
      {session.history.map((item) => (
        <button
          type="button"
          key={item.attemptId}
          disabled={session.disabled}
          onClick={() => void session.resume(item.attemptId)}
          className="block w-full rounded-xl border border-primary/20 bg-brandSecondary px-4 py-4 text-left"
        >
          <span className="block text-sm font-bold text-primary">
            {item.state === "COMPLETED" ? "완료한 학습 확인" : "이어서 풀기"}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {item.title}
          </span>
        </button>
      ))}
      {session.cursor && (
        <button
          type="button"
          disabled={session.disabled}
          className="py-3 text-sm text-primary"
          onClick={() => void session.moreHistory()}
        >
          더 보기
        </button>
      )}
    </section>
  );
}
