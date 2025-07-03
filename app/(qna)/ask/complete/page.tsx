"use client";

import { TextButton } from "@/components/atoms";
import { useRouter } from "next/navigation";
import { FC } from "react";

const CompletePage: FC = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-grow flex-col items-center justify-center gap-3">
        <div className="text-center">
          <p className="text-[48px]">🙌</p>
          <p className="text-2xl font-semibold">질문 등록이 완료되었습니다!</p>
        </div>
        <p className="text-sm text-foreground">
          내 질문은 아카이브 탭에서 확인할 수 있어요.
        </p>
      </div>
      <div className="mx-6 mb-10 flex flex-col gap-3">
        <TextButton
          label="새 질문 등록하기"
          onClick={() => {
            router.push("/ask");
          }}
        />
        <TextButton
          label="내 질문 보기"
          variant="outline"
          onClick={() => {
            router.push("/archive");
          }}
        />
        <TextButton
          label="질문 광장으로 이동하기"
          variant="outline"
          onClick={() => {
            router.push("/");
          }}
        />
      </div>
    </div>
  );
};

export default CompletePage;
