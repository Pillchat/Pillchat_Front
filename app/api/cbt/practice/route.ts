import { NextRequest, NextResponse } from "next/server";

import {
  getPrivateCbtPracticeSet,
  getPublicCbtPracticeSet,
  parseCbtSessionId,
} from "@/lib/server/cbtPracticeData";
import type { CbtAnswerSubmission, CbtGradeResult } from "@/types/cbt";

function sanitizeExcludedChoices(
  choices: unknown,
  selectedChoice: number | null,
) {
  if (!Array.isArray(choices)) return [];
  return Array.from(
    new Set(
      choices.filter(
        (choice): choice is number =>
          Number.isInteger(choice) &&
          choice >= 0 &&
          choice <= 4 &&
          choice !== selectedChoice,
      ),
    ),
  ).sort((a, b) => a - b);
}

export async function GET(request: NextRequest) {
  const sessionId = parseCbtSessionId(
    request.nextUrl.searchParams.get("session"),
  );
  if (!sessionId) {
    return NextResponse.json(
      { message: "올바른 교시를 선택해 주세요." },
      { status: 400 },
    );
  }
  return NextResponse.json(getPublicCbtPracticeSet(sessionId));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    attemptId?: string;
    sessionId?: string | number;
    answers?: Record<string, CbtAnswerSubmission>;
  };
  const sessionId = parseCbtSessionId(String(body.sessionId ?? ""));
  if (!sessionId || !body.attemptId || !body.answers) {
    return NextResponse.json(
      { message: "제출할 응시 정보가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { questions } = getPrivateCbtPracticeSet(sessionId);
  const review = questions.map((question) => {
    const answer = body.answers?.[question.id];
    const selectedChoice = answer?.selectedChoice ?? null;
    const status =
      selectedChoice === null
        ? ("unanswered" as const)
        : selectedChoice === question.correctChoice
          ? ("correct" as const)
          : ("incorrect" as const);
    return {
      ...question,
      selectedChoice,
      flagged: Boolean(answer?.flagged),
      unknown: Boolean(answer?.unknown),
      memo: answer?.memo ?? "",
      excludedChoices: sanitizeExcludedChoices(
        answer?.excludedChoices,
        selectedChoice,
      ),
      status,
    };
  });
  const correct = review.filter(
    (question) => question.status === "correct",
  ).length;
  const unanswered = review.filter(
    (question) => question.status === "unanswered",
  ).length;
  const subjectMap = new Map<
    string,
    {
      subject: (typeof review)[number]["subject"];
      total: number;
      correct: number;
    }
  >();
  for (const question of review) {
    const current = subjectMap.get(question.subject) ?? {
      subject: question.subject,
      total: 0,
      correct: 0,
    };
    current.total += 1;
    if (question.status === "correct") current.correct += 1;
    subjectMap.set(question.subject, current);
  }

  const result: CbtGradeResult = {
    attemptId: body.attemptId,
    submittedAt: new Date().toISOString(),
    total: review.length,
    correct,
    incorrect: review.length - correct - unanswered,
    unanswered,
    score: review.length ? Math.round((correct / review.length) * 100) : 0,
    scoresBySubject: Array.from(subjectMap.values()).map((item) => ({
      ...item,
      score: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    })),
    review,
  };
  return NextResponse.json(result);
}
