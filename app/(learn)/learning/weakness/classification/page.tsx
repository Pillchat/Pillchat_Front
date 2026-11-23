import {
  BookOpen,
  CircleCheck,
  Bookmark,
  FileQuestion,
  Target,
} from "lucide-react";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import { readWeaknessFilters, weaknessHref } from "@/lib/learning/weakness";
import { WeaknessNotice } from "../_components/WeaknessParts";

const rules = [
  {
    label: "미풀이 문제",
    destination: "문제 풀기",
    description: "아직 풀지 않은 문제는 새로운 학습에서 만나요.",
    icon: FileQuestion,
  },
  {
    label: "맞힌 문제",
    destination: "전체 학습 기록",
    description: "정답으로 푼 문제도 학습 기록에서 확인할 수 있어요.",
    icon: BookOpen,
  },
  {
    label: "틀린 문제",
    destination: "약점공략",
    description: "오답을 제출하면 다음 날 복습을 예약해요.",
    icon: Target,
  },
  {
    label: "북마크한 문제",
    destination: "약점공략",
    description:
      "정답 후 북마크하면 다음 날 복습해요. 진행 중인 일정은 그대로 유지해요.",
    icon: Bookmark,
  },
  {
    label: "복습 완료",
    destination: "극복한 문제",
    description: "마지막 30일 간격의 복습에서 맞히면 극복한 문제로 분류돼요.",
    icon: CircleCheck,
  },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = readWeaknessFilters(await searchParams);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <PracticeHeader
        title="학습 분류 기준"
        backHref={weaknessHref(filters)}
        separator={false}
      />
      <main className="px-6 pb-8 pt-6">
        <h1 className="text-headline-medium">학습 분류 기준</h1>
        <p className="mt-2 text-body-medium text-muted-foreground">
          풀이 결과와 북마크에 따라 복습 일정이 정해져요.
        </p>
        <ol className="mt-6 space-y-3">
          {rules.map(({ label, destination, description, icon: Icon }) => (
            <li key={label} className="flex gap-4 rounded-xl bg-gray-50 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-980">
                <Icon
                  aria-hidden="true"
                  className="h-6 w-6 text-primary"
                  strokeWidth={2}
                />
              </span>
              <div className="min-w-0">
                <h2 className="text-title-large">{label}</h2>
                <p className="mt-1 text-title-small text-primary">
                  → {destination}
                </p>
                <p className="mt-2 text-body-medium text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <WeaknessNotice title="학습 분류를 위한 안내예요">
            첫 복습은 다음 날이에요. 예정된 복습을 맞힐 때마다 실제 제출일에서
            3일, 7일, 14일, 30일 뒤로 간격이 늘어나요.
          </WeaknessNotice>
        </div>
      </main>
    </div>
  );
}
