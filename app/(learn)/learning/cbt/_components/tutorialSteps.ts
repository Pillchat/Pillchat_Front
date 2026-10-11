export type CbtTutorialStep = {
  id:
    | "answer"
    | "check"
    | "unknown"
    | "memo"
    | "calculator"
    | "navigate"
    | "review"
    | "complete";
  title: string;
  description: string;
  target: string | null;
  actionLabel?: string;
};

export const CBT_TUTORIAL_STEPS: CbtTutorialStep[] = [
  {
    id: "answer",
    title: "답 선택하기",
    description:
      "선택지를 누르면 답안이 선택돼요. 예제에서 답 하나를 골라 보세요.",
    target: '[data-cbt-tutorial="answer"]',
  },
  {
    id: "check",
    title: "다시 볼 문제 표시하기",
    description:
      "시험 중 다시 볼 문제를 표시해요. ‘체크’를 누르면 문제 목록에서 모아 볼 수 있어요.",
    target: '[data-cbt-tutorial="check"]',
  },
  {
    id: "unknown",
    title: "모르는 문제 표시하기",
    description:
      "모름으로 표시한 문제는 시험 중 문제 목록에서 모아 확인할 수 있고, 제출 후 복습 화면에도 표시가 남아요. ‘모름’을 눌러 보세요.",
    target: '[data-cbt-tutorial="unknown"]',
  },
  {
    id: "memo",
    title: "메모 남기기",
    description:
      "메모에 풀이 과정이나 확인할 내용을 적을 수 있어요. ‘메모’를 열고 한 줄을 직접 입력해 보세요.",
    target: '[data-cbt-tutorial="memo"]',
  },
  {
    id: "calculator",
    title: "계산기 사용하기",
    description:
      "계산기로 풀이에 필요한 계산을 할 수 있어요. ‘계산기’를 열고 1 + 1을 계산해 보세요.",
    target: '[data-cbt-tutorial="calculator"]',
  },
  {
    id: "navigate",
    title: "다음 문제로 이동하기",
    description:
      "이전·다음 버튼으로 문항 사이를 이동할 수 있어요. ‘다음’을 눌러 다음 문제로 이동해 보세요.",
    target: '[data-cbt-tutorial="navigate"]',
  },
  {
    id: "review",
    title: "답안 정리 확인하기",
    description:
      "답안 제출을 열면 푼 문제와 체크·모름 표시를 확인할 수 있어요. ‘답안 제출’을 눌러 예제 답안을 정리해 보세요.",
    target: '[data-cbt-tutorial="review"]',
  },
  {
    id: "complete",
    title: "CBT 사용법을 익혔어요",
    description:
      "교시별 연습이나 전체 실전에서 직접 문제를 풀어 보세요. 튜토리얼의 답안과 메모는 저장되지 않아요.",
    target: null,
    actionLabel: "CBT로 돌아가기",
  },
];
