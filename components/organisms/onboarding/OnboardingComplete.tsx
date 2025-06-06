"use client";

import { useAtom } from "jotai";
import { TextButton } from "@/components/atoms";
import { FC } from "react";
import { useRouter } from "next/navigation";

export const OnboardingComplete: FC<{ role: string }> = ({ role }) => {
  const router = useRouter();
  //   const [name] = useAtom(nameAtom);

  return (
    <>
      <div className="text-center">
        <p className="text-[48px]">🙌</p>
        <p className="text-2xl font-semibold">이제 모든 준비가 끝났어요!</p>
      </div>
      <p className="text-center text-sm text-button-foreground">
        필챗으로{" "}
        {role === "student"
          ? "전공 공부를 더 수월하게 해보세요!"
          : "전공 공부를 어려워하는 학생들에게 도움을 주러갑시다!"}
      </p>
    </>
  );
};
