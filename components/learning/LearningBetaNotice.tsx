import { Megaphone } from "lucide-react";

export function LearningBetaNotice() {
  return (
    <aside
      aria-label="베타테스트 안내"
      className="flex min-h-12 items-center gap-3 rounded-xl bg-brandSecondary px-4 py-3 text-sm"
    >
      <Megaphone
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-primary"
        strokeWidth={1.5}
      />
      <span>현재 이 기능은 베타테스트 중입니다.</span>
    </aside>
  );
}
