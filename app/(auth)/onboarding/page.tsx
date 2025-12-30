"use client";

import { useAtom } from "jotai";
import { TextButton } from "@/components/atoms";
import { FC } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/functions";

const OnboardingPage: FC = () => {
  const router = useRouter();
  //   const [name] = useAtom(nameAtom);

  const goOnboarding = async () => {
    const result = await fetchAPI("/api/auth/inquiry-myprofile", "GET");
    const userType = result?.data?.userType;

    const role = userType === "PROFESSIONAL" ? "professional" : "student";
    router.push(`/onboarding/${role}/step1`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-grow flex-col items-center justify-center gap-3">
        <div className="text-center">
          <p className="text-[48px]">🙌</p>
          <p className="text-2xl font-semibold">
            환영해요. {"name"}님!
            <br />
            회원가입이 완료되었어요!
          </p>
        </div>
        <p className="text-sm text-primary">
          필챗을 더 잘 활용하기위한 추가 정보도 입력해보세요!
        </p>
      </div>
      <div className="mb-10 flex flex-col gap-3">
        <TextButton label="추가 정보 입력하기" onClick={goOnboarding} />
        <TextButton
          label="로그인 화면으로 가기"
          variant="teritary"
          onClick={() => {
            router.push("/login");
          }}
        />
      </div>
    </div>
  );
};

export default OnboardingPage;
