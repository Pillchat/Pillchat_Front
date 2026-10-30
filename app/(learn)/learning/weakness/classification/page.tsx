import {
  BookOpen,
  CircleCheck,
  CircleHelp,
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
    description: "틀린 문제를 다시 풀며 부족한 부분을 채워요.",
    icon: Target,
  },
  {
    label: "헷갈림 표시",
    destination: "약점공략",
    description: "맞혔어도 헷갈렸다면 약점으로 모아 복습해요.",
    icon: CircleHelp,
  },
  {
    label: "2회 연속 정답",
    destination: "극복한 문제",
    description: "서로 다른 날에 연속으로 두 번 맞히면 극복한 문제로 분류돼요.",
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
      <PracticeHeader title="학습 분류 기준" backHref={weaknessHref(filters)} />
      <main className="px-6 pb-8 pt-6">
        <h1 className="text-headline-medium">학습 분류 기준</h1>
        <p className="mt-2 text-body-medium text-muted-foreground">
          풀이 결과와 헷갈림 표시를 기준으로 학습할 곳을 안내해요.
        </p>
        <ol className="mt-6 divide-y divide-border">
          {rules.map(({ label, destination, description, icon: Icon }) => (
            <li key={label} className="flex gap-4 py-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-980">
                <Icon
                  aria-hidden="true"
                  className="h-6 w-6 text-primary"
                  strokeWidth={1.5}
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
            오늘 푼 문제는 당일 약점공략에 다시 표시되지 않아요. 2회 연속
            정답이면 약점공략에서 제외돼요.
          </WeaknessNotice>
        </div>
      </main>
    </div>
  );
}
