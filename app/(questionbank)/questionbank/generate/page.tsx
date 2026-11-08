"use client";

import { Sparkles } from "lucide-react";
import FileIcon from "@/public/icons/file.svg";
import { AppShell } from "@/components/molecules/AppShell";
import { PracticeHeader } from "@/components/molecules/PracticeHeader";
import EntryButton from "../_components/EntryButton";
import { useRouter } from "@/lib/navigation";

export default function GeneratePage() {
  const router = useRouter();

  return (
    <AppShell bottomNav={false} bottomSpacing="none">
      <PracticeHeader
        title="AI 문제 생성"
        backHref="/questionbank"
        separator={false}
      />
      <main className="space-y-6 px-6 pb-8 pt-5">
        <div>
          <h1 className="text-headline-medium">
            어떤 내용으로 문제를 만들까요?
          </h1>
          <p className="mt-2 text-body-medium text-muted-foreground">
            공부할 주제를 정하거나 PDF 학습자료를 올려 주세요.
          </p>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary-980 px-4">
            <EntryButton
              icon={
                <Sparkles
                  aria-hidden="true"
                  className="h-8 w-8 text-primary"
                  size={32}
                  strokeWidth={2}
                  absoluteStrokeWidth
                />
              }
              title="주제로 만들기"
              subtitle="과목을 고르고 세부 주제를 직접 입력해요"
              onClick={() => router.push("/questionbank/premium")}
            />
          </div>
          <div className="rounded-2xl bg-gray-50 px-4">
            <EntryButton
              icon={<FileIcon aria-hidden="true" className="h-6 w-6" />}
              title="PDF로 만들기"
              subtitle="강의자료나 정리한 PDF로 문제를 만들어요"
              onClick={() => router.push("/questionbank/generate/pdf")}
            />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
