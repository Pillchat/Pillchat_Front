import "server-only";

import type {
  CbtExamQuestion,
  CbtPracticeSet,
  CbtSessionId,
  CbtSessionSummary,
  CbtSubject,
} from "@/types/cbt";

type PrivateQuestion = CbtExamQuestion & {
  correctChoice: number;
  explanation: string;
  conceptTags: string[];
};

const SESSION_SUMMARIES: Record<CbtSessionId, CbtSessionSummary> = {
  tutorial: {
    id: "tutorial",
    title: "조작 튜토리얼",
    subjectsLabel: "선택·체크·모름·메모 연습",
    questionCount: 5,
    durationSec: 15 * 60,
    subjectBreakdown: [{ subject: "조작 튜토리얼", count: 5 }],
  },
  1: {
    id: 1,
    title: "1교시",
    subjectsLabel: "생명약학",
    questionCount: 100,
    durationSec: 90 * 60,
    subjectBreakdown: [{ subject: "생명약학", count: 100 }],
  },
  2: {
    id: 2,
    title: "2교시",
    subjectsLabel: "산업약학",
    questionCount: 90,
    durationSec: 85 * 60,
    subjectBreakdown: [{ subject: "산업약학", count: 90 }],
  },
  3: {
    id: 3,
    title: "3교시",
    subjectsLabel: "임상·실무약학1",
    questionCount: 77,
    durationSec: 75 * 60,
    subjectBreakdown: [{ subject: "임상·실무약학1", count: 77 }],
  },
  4: {
    id: 4,
    title: "4교시",
    subjectsLabel: "임상·실무약학2 · 보건·의약관계법규",
    questionCount: 83,
    durationSec: 75 * 60,
    subjectBreakdown: [
      { subject: "임상·실무약학2", count: 63 },
      { subject: "보건·의약관계법규", count: 20 },
    ],
  },
};

const TOPICS: Record<CbtSubject, string[]> = {
  생명약학: ["생화학", "미생물학", "생리학", "병태생리학", "면역학"],
  산업약학: ["물리약학", "약제학", "생약학", "의약품분석학", "의약화학"],
  "임상·실무약학1": ["약물치료학", "임상약동학", "TDM", "복약지도"],
  "임상·실무약학2": ["약국실무", "처방검토", "DUR", "의약품정보"],
  "보건·의약관계법규": ["약사법", "마약류관리법", "국민건강보험법"],
  "조작 튜토리얼": [
    "선택지 선택",
    "문제 체크",
    "모름 표시",
    "메모",
    "답안 제출",
  ],
};

const getSubjectForQuestion = (
  summary: CbtSessionSummary,
  questionIndex: number,
) => {
  let cursor = questionIndex;
  for (const item of summary.subjectBreakdown) {
    if (cursor < item.count) return item.subject;
    cursor -= item.count;
  }
  return summary.subjectBreakdown[0].subject;
};

const buildQuestion = (
  sessionId: CbtSessionId,
  questionIndex: number,
): PrivateQuestion => {
  const summary = SESSION_SUMMARIES[sessionId];
  const subject = getSubjectForQuestion(summary, questionIndex);
  const topics = TOPICS[subject];
  const topic = topics[questionIndex % topics.length];
  const correctChoice = questionIndex % 5;
  const choices = Array.from({ length: 5 }, (_, choiceIndex) =>
    choiceIndex === correctChoice
      ? `${topic}의 핵심 원리와 적용 조건을 정확히 설명한다.`
      : `${topic}의 범위 또는 전제를 다르게 해석한 설명 ${choiceIndex + 1}이다.`,
  );

  return {
    id: `${sessionId === "tutorial" ? "T" : `S${sessionId}`}-${String(
      questionIndex + 1,
    ).padStart(3, "0")}`,
    subject,
    topic,
    type:
      sessionId === "tutorial" && questionIndex === 3
        ? "case"
        : sessionId === "tutorial" && questionIndex === 4
          ? "multimedia"
          : "single",
    number: questionIndex + 1,
    stem:
      sessionId === "tutorial"
        ? `[조작 연습] ${topic} 기능을 사용한 뒤 가장 알맞은 선택지를 골라 보세요.`
        : `[필챗 모의 문항] 다음 중 ${topic}에 대한 설명으로 가장 적절한 것은?`,
    choices,
    media:
      sessionId === "tutorial" && questionIndex === 4
        ? [
            {
              id: "tutorial-table",
              kind: "table",
              title: "검사 결과 자료",
              description:
                "혈중 농도 8.4 mg/L · 목표 범위 5–10 mg/L · 채혈 시점 투약 30분 전",
            },
          ]
        : [],
    caseGroupId:
      sessionId === "tutorial" && questionIndex === 3
        ? "tutorial-case-1"
        : null,
    correctChoice,
    explanation: `${topic}에서는 핵심 정의와 적용 조건을 함께 확인해야 합니다. 정답 선택지는 두 조건을 모두 충족합니다.`,
    conceptTags: [subject, topic],
  };
};

export const parseCbtSessionId = (
  value: string | null,
): CbtSessionId | null => {
  if (value === "tutorial") return value;
  const parsed = Number(value);
  return parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4
    ? parsed
    : null;
};

export const getPrivateCbtPracticeSet = (sessionId: CbtSessionId) => {
  const session = SESSION_SUMMARIES[sessionId];
  const questions = Array.from({ length: session.questionCount }, (_, index) =>
    buildQuestion(sessionId, index),
  );
  return { session, questions };
};

export const getPublicCbtPracticeSet = (
  sessionId: CbtSessionId,
): CbtPracticeSet => {
  const { session, questions } = getPrivateCbtPracticeSet(sessionId);
  return {
    templateId: `pillchat-cbt-2026-${sessionId}`,
    title:
      sessionId === "tutorial"
        ? "CBT 조작 튜토리얼"
        : `약사국시 CBT ${session.title} 연습`,
    session,
    questions: questions.map(
      ({
        correctChoice: _correctChoice,
        explanation: _explanation,
        conceptTags: _tags,
        ...question
      }) => question,
    ),
    disclaimerVersion: "2026-07-12",
  };
};
