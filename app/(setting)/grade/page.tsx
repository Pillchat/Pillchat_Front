"use client";

import { CustomHeader } from "@/components/molecules";

export default function BadgeSettingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col bg-white">
      <CustomHeader title="뱃지 설정" />

      <main className="flex flex-1 items-center justify-center px-6 pb-32 pt-12">
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-title-small text-foreground">
            등록된 뱃지가 없습니다.
          </p>
          <p className="mt-2 text-body-small text-muted-foreground">
            뱃지 API가 연결되면 이 화면에 표시됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
