import LearningHistoryPage from "@/components/learning/LearningHistoryPage";
import { Suspense } from "react";
import { LearningHistoryAccess } from "@/components/learning/LearningHistoryAccess";
export default function HistoryPage() {
  return (
    <Suspense
      fallback={<p className="px-6 py-6">학습 기록을 불러오는 중이에요.</p>}
    >
      <LearningHistoryAccess view="all">
        <LearningHistoryPage view="all" />
      </LearningHistoryAccess>
    </Suspense>
  );
}
