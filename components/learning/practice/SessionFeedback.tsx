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
