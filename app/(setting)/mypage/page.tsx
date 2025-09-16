"use client";

import { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SystemField } from "@/components/atoms";
import {
  MeaninglessHeader,
  UserInfoField,
  SelectModal,
} from "@/components/molecules";
import { useDelete, useLogout, useMyProfile } from "./_hooks";

const mypage: FC = () => {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<"logout" | "withdraw" | null>(
    null,
  );
  const { onDelete } = useDelete();
  const { onLogout } = useLogout();
  const { onMyProfile } = useMyProfile();

  useEffect(() => {
    onMyProfile();
  }, [onMyProfile]);

  return (
    <div className="flex min-h-screen flex-col items-center">
      <MeaninglessHeader />
      <UserInfoField
        onIconClick={() => {
          router.push("/editprofile");
        }}
      />

      <div className="mt-8 w-[90%]">
        <p className="text-sm text-muted-foreground">정보</p>
        <div className="mt-4 flex flex-col gap-6">
          <SystemField
            iconSrc="userUp.svg"
            title="승급 조건"
            description="다음 승급을 위한 조건을 알아보세요."
            onClick={() => router.push("/grade")}
          />

          <SystemField
            iconSrc="BellColor.svg"
            title="알림 설정"
            description="원하는 알림만 받도록 설정해보세요."
            onClick={() => router.push("/bellSetting")}
          />

          <SystemField
            iconSrc="userInfo.svg"
            title="맞춤형 정보 설정"
            description="내가 설정한 항목을 변경할 수 있어요."
            onClick={() => router.push("/onboarding")}
          />
        </div>

        <div id="line" className="mt-8 h-[1px] w-full bg-muted" />
      </div>

      <div className="mt-5 w-[90%]">
        <p className="text-sm text-muted-foreground">문의 및 건의</p>
        <div className="mt-4 flex flex-col gap-6">
          <SystemField iconSrc="HeadPhone.svg" title="고객 센터" />
        </div>

        <div id="line" className="mt-8 h-[1px] w-full bg-muted" />
      </div>

      <div className="mt-8 w-[90%]">
        <div className="flex flex-col gap-6">
          <SystemField
            iconSrc="Logout.svg"
            title="로그아웃"
            onClick={() => {
              setOpenModal("logout");
            }}
          />

          <SystemField
            iconSrc="UserRemove.svg"
            title="계정 탈퇴"
            textColor="text-border"
            onClick={() => {
              setOpenModal("withdraw");
            }}
          />
        </div>
      </div>

      <SelectModal
        isOpen={openModal === "logout"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => {
          onLogout();
          setOpenModal(null);
        }}
        title="로그아웃"
        message="정말로 로그아웃 하시겠습니까?"
      />

      <SelectModal
        isOpen={openModal === "withdraw"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => {
          onDelete();
          setOpenModal(null);
        }}
        title="계정탈퇴"
        message="정말로 계정을 탈퇴하시겠습니까? \n모든 정보가 사라지게 됩니다."
      />
    </div>
  );
};

export default mypage;
