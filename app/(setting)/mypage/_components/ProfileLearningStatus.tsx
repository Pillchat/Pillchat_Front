import Link from "next/link";
import type { AttendanceSnapshot } from "@/lib/client/attendance";

export default function ProfileLearningStatus({
  profile,
}: {
  profile: {
    school: string | null;
    studentGrade: string | null;
    nextPromotion?: AttendanceSnapshot["nextPromotion"];
  };
}) {
  const next = profile.nextPromotion;
  return (
    <div className="mt-4 w-[90%] space-y-3">
      {(!profile.school?.trim() || !profile.studentGrade?.trim()) && (
        <Link
          href="/onboarding"
          className="block rounded-xl bg-primary-980 p-4 text-body-medium"
        >
          학교·학년 정보를 등록하고 맞춤형 학습을 준비해요.
          <span className="mt-2 block font-semibold text-primary">
            정보 등록하기
          </span>
        </Link>
      )}
      {next && (
        <Link
          href="/gradeInfo"
          className="block rounded-xl border border-border p-4 text-body-medium"
        >
          <strong className="block text-title-large">다음 등급까지</strong>
          <span className="mt-2 block text-muted-foreground">
            {next.nextGrade
              ? `${next.target <= 20 ? "누적" : "연속"} 출석 ${next.target}일 · ${Math.max(0, next.target - next.progress)}일 남았어요`
              : "최고 등급을 달성했어요!"}
          </span>
        </Link>
      )}
    </div>
  );
}
