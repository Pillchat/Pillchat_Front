import Link from "next/link";

export default function ProfileLearningStatus({
  profile,
}: {
  profile: {
    school: string | null;
    studentGrade: string | null;
  };
}) {
  if (profile.school?.trim() && profile.studentGrade?.trim()) return null;
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
    </div>
  );
}
