"use client";
import { useEffect, useRef, useState } from "react";
import { fetchAPI } from "@/lib/client/fetch";
import { LearningCommands } from "@/lib/learning/api";
import { CustomHeader } from "@/components/molecules";
import { Button } from "@/components/ui/button";

type Answer = {
  questionId: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  action: string;
};
type Quiz = {
  sessionId: string;
  status: string;
  questions: {
    questionId: string;
    type: string;
    subject: string;
    content: string;
    choices: string[] | null;
  }[];
  answers: Answer[];
};
export default function AiSessionPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    correctCount: number;
    questionCount: number;
    scorePercent: number;
    answers: (Answer & { content: string })[];
  } | null>(null);
  const commands = useRef(new LearningCommands());
  const lock = useRef(false);
  const id = useRef("");
  const load = async () => {
    const value: Quiz = await fetchAPI(
      `/api/questionbank/quiz/${encodeURIComponent(id.current)}?resume=true`,
      "GET",
    );
    setQuiz(value);
    if (value.status === "FINISHED")
      setResult(
        await fetchAPI(
          `/api/questionbank/quiz/${encodeURIComponent(id.current)}`,
          "GET",
        ),
      );
  };
  useEffect(() => {
    id.current =
      new URLSearchParams(window.location.search).get("session") ?? "";
    if (!id.current) {
      setError("응시 정보가 없습니다.");
      return;
    }
    void load().catch((e) => setError(e.message));
  }, []);
  const act = async (action: "ANSWER" | "REVEAL" | "finish", retry = false) => {
    if (lock.current || !quiz) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (retry) await commands.current.retry();
      else
        await commands.current.send(
          `/api/questionbank/quiz/${id.current}`,
          "POST",
          action === "finish"
            ? { action }
            : {
                action,
                questionId: quiz.questions[index].questionId,
                ...(action === "ANSWER" ? { userAnswer: input } : {}),
              },
        );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청에 실패했습니다.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const q = quiz?.questions[index];
  const answer = quiz?.answers.find((a) => a.questionId === q?.questionId);
  const disabled = busy || !!commands.current.pending;
  return (
    <div className="min-h-dvh pb-20">
      <CustomHeader title="AI 문제 풀이" />
      <main className="space-y-4 p-5">
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {commands.current.pending && (
          <Button disabled={busy} onClick={() => void act("ANSWER", true)}>
            같은 답안 다시 전송
          </Button>
        )}
        {result ? (
          <>
            <h1 className="text-xl font-semibold">
              {result.scorePercent}점 · {result.correctCount}/
              {result.questionCount}
            </h1>
            {result.answers.map((a) => (
              <article
                key={a.questionId}
                className="space-y-2 rounded-xl border p-4"
              >
                <p>{a.content}</p>
                <p>정답: {a.correctAnswer}</p>
                <p>{a.explanation}</p>
              </article>
            ))}
          </>
        ) : q ? (
          <>
            <p>
              {index + 1}/{quiz!.questions.length} · {q.subject}
            </p>
            <h1 className="whitespace-pre-wrap text-lg font-semibold">
              {q.content}
            </h1>
            {q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" ? (
              (q.choices ?? []).map((choice) => (
                <button
                  className={`block w-full rounded-xl border p-4 text-left ${input === choice ? "border-brand bg-blue-50" : ""}`}
                  key={choice}
                  disabled={disabled || !!answer}
                  onClick={() => setInput(choice)}
                >
                  {choice}
                </button>
              ))
            ) : (
              <textarea
                aria-label="답안"
                maxLength={500}
                className="w-full rounded-xl border p-3"
                value={input}
                disabled={disabled || !!answer}
                onChange={(e) => setInput(e.target.value)}
              />
            )}
            {answer ? (
              <div className="rounded-xl bg-muted p-4">
                <p>제출 답안: {answer.userAnswer ?? "정답 보기"}</p>
                <p>정답: {answer.correctAnswer}</p>
                <p>{answer.explanation}</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  disabled={disabled || !input.trim()}
                  onClick={() => void act("ANSWER")}
                >
                  채점하기
                </Button>
                <Button
                  variant="outline"
                  disabled={disabled}
                  onClick={() => void act("REVEAL")}
                >
                  정답 보기
                </Button>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={disabled || index === 0}
                onClick={() => {
                  setIndex(index - 1);
                  setInput("");
                }}
              >
                이전
              </Button>
              <Button
                variant="outline"
                disabled={disabled || index + 1 === quiz!.questions.length}
                onClick={() => {
                  setIndex(index + 1);
                  setInput("");
                }}
              >
                다음
              </Button>
              <Button
                disabled={disabled}
                onClick={() => {
                  if (confirm("미응답 문제를 포함하여 응시를 종료할까요?"))
                    void act("finish");
                }}
              >
                종료 및 결과
              </Button>
            </div>
          </>
        ) : (
          !error && <p>응시 정보를 불러오는 중입니다.</p>
        )}
        <a className="block text-brand" href="/learning/review">
          복습 목록
        </a>
      </main>
    </div>
  );
}
