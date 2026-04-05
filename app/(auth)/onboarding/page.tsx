"use client";

import { useAtom } from "jotai";
import { TextButton } from "@/components/atoms";
import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI, getCurrentUserInfo } from "@/lib/functions";
import { SelectModal } from "@/components/molecules";
import { useLogout } from "@/app/(setting)/mypage/_hooks/useLogout";

const OnboardingPage: FC = () => {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<"logout" | null>(null);
  const { onLogout } = useLogout();
  const userInfo = getCurrentUserInfo();
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
            환영해요. {userInfo?.username}님!
            <br />
          </p>
        </div>
        <p className="text-sm text-primary">
          필챗을 더 잘 활용하기위한 추가 정보도 입력해보세요!
        </p>
      </div>
      <div className="mx-6 mb-10 flex flex-col gap-3">
        <TextButton label="추가 정보 입력하기" onClick={goOnboarding} />
        <TextButton
          className="border border-[#666666]"
          label="로그인 화면으로 가기"
          variant="teritary"
          onClick={() => {
            setOpenModal("logout");
          }}
        />
      </div>

      <SelectModal
        isOpen={openModal === "logout"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => {
          onLogout();
          setOpenModal(null);
        }}
        title="로그인 화면으로 가기"
        message="로그인 화면으로 가기 선택 시 로그아웃됩니다."
      />
    </div>
  );
};

export default OnboardingPage;
