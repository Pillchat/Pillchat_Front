export type DashboardAttempt = {
  attemptId: string;
  source: "CBT" | "HANDCRAFTED" | "AI";
  title: string;
  answeredCount: number;
  questionCount: number;
  subject?: string | null;
  topic?: string | null;
};

export type LearningWeek = {
  weekStart: string;
  days: { date: string; solvedCount: number; correctCount: number }[];
  solvedCount: number;
  correctCount: number;
};

export type LearningDashboard = {
  date: string;
  solvedCount: number;
  correctCount: number;
  studySeconds: number;
  latestAttempt: DashboardAttempt | null;
  weekly?: LearningWeek;
};

export function formatStudyTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (seconds > 0 && minutes === 0) return "1분 미만";
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}시간 ${remainder}분` : `${hours}시간`;
}

export function dashboardAttemptHref(attempt: DashboardAttempt) {
  const id = encodeURIComponent(attempt.attemptId);
  if (attempt.source === "AI") return `/learning/ai?session=${id}`;
  return `${attempt.source === "CBT" ? "/learning/cbt" : "/questionbank/handcrafted"}?attempt=${id}`;
}
