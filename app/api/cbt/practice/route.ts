import { NextRequest, NextResponse } from "next/server";

import {
  getPrivateCbtPracticeSet,
  getPublicCbtPracticeSet,
  parseCbtSessionId,
} from "@/lib/server/cbtPracticeData";
import type {
  CbtAnswerSubmission,
  CbtGradeResult,
  CbtHighlightPoint,
  CbtHighlightRange,
  CbtHighlightStroke,
} from "@/types/cbt";

const MAX_HIGHLIGHT_STROKES = 32;
const MAX_POINTS_PER_STROKE = 256;
const MAX_POINTS_PER_QUESTION = 512;
const MAX_POINTS_PER_ATTEMPT = 20_000;

function sanitizeHighlightRanges(
  ranges: CbtHighlightRange[] | undefined,
  stemLength: number,
) {
  if (!Array.isArray(ranges)) return [];
  return ranges
    .filter(
      (range) =>
        Number.isInteger(range?.start) &&
        Number.isInteger(range?.end) &&
        range.start >= 0 &&
        range.start < range.end &&
        range.end <= stemLength,
    )
    .sort((a, b) => a.start - b.start)
    .reduce<CbtHighlightRange[]>((merged, range) => {
      const previous = merged.at(-1);
      if (previous && range.start < previous.end) {
        previous.end = Math.max(previous.end, range.end);
      } else {
        merged.push({ start: range.start, end: range.end });
      }
      return merged;
    }, []);
}

function sanitizeHighlightStrokes(
  strokes: unknown,
  attemptPointsRemaining: number,
): CbtHighlightStroke[] {
  if (!Array.isArray(strokes)) return [];
  const sanitized: CbtHighlightStroke[] = [];
  let remainingPoints = Math.min(
    MAX_POINTS_PER_QUESTION,
    Math.max(0, attemptPointsRemaining),
  );

  for (let index = 0; index < strokes.length; index += 1) {
    if (sanitized.length >= MAX_HIGHLIGHT_STROKES || remainingPoints === 0) {
      break;
    }
    const stroke = strokes[index];
    if (!stroke || typeof stroke !== "object") continue;
    const candidate = stroke as { id?: unknown; points?: unknown };
    if (!Array.isArray(candidate.points)) continue;

    const points: CbtHighlightPoint[] = [];
    for (const point of candidate.points) {
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1]) ||
        point[0] < 0 ||
        point[0] > 1 ||
        point[1] < 0 ||
        point[1] > 1
      ) {
        continue;
      }
      const normalized: CbtHighlightPoint = [
        Math.round(point[0] * 10_000) / 10_000,
        Math.round(point[1] * 10_000) / 10_000,
      ];
      const previous = points.at(-1);
      if (previous?.[0] === normalized[0] && previous[1] === normalized[1]) {
        continue;
      }
      points.push(normalized);
      if (
        points.length >= MAX_POINTS_PER_STROKE ||
        points.length >= remainingPoints
      ) {
        break;
      }
    }
    if (points.length === 0) continue;

    const id =
      typeof candidate.id === "string" &&
      /^[a-zA-Z0-9_-]{1,80}$/.test(candidate.id)
        ? candidate.id
        : `stroke-${index + 1}`;
    sanitized.push({ id, points });
    remainingPoints -= points.length;
  }

  return sanitized;
}

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
  let highlightPointsRemaining = MAX_POINTS_PER_ATTEMPT;
  const review = questions.map((question) => {
    const answer = body.answers?.[question.id];
    const selectedChoice = answer?.selectedChoice ?? null;
    const status =
      selectedChoice === null
        ? ("unanswered" as const)
        : selectedChoice === question.correctChoice
          ? ("correct" as const)
          : ("incorrect" as const);
    const highlightStrokes = sanitizeHighlightStrokes(
      answer?.highlightStrokes,
      highlightPointsRemaining,
    );
    highlightPointsRemaining -= highlightStrokes.reduce(
      (total, stroke) => total + stroke.points.length,
      0,
    );
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
      highlightRanges: sanitizeHighlightRanges(
        answer?.highlightRanges,
        question.stem.length,
      ),
      highlightStrokes,
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
