"use client";

import { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SystemField } from "@/components/atoms";
import {
  MeaninglessHeader,
  UserInfoField,
  SelectModal,
  BottomNavbar,
} from "@/components/molecules";
import { useDelete, useLogout, useMyProfile } from "./_hooks";
import { isCurrentUserAdmin, getCurrentUserInfo } from "@/lib/functions";

const mypage: FC = () => {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<"logout" | "withdraw" | null>(
    null,
  );
  const { onDelete } = useDelete();
  const { onLogout } = useLogout();
  const { onMyProfile, isLoading, error } = useMyProfile();
  const isAdmin = isCurrentUserAdmin();

  useEffect(() => {
    const userInfo = getCurrentUserInfo();
    console.log("JWT payload:", userInfo);
    console.log("isAdmin:", isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    onMyProfile();
  }, [onMyProfile]);

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="mx-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-800">오류 발생</h2>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto pb-[7rem]">
      <div className="flex w-full flex-col items-center">
        <MeaninglessHeader />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <span className="ml-2">프로필 정보를 불러오는 중...</span>
          </div>
        ) : (
          <UserInfoField
            onIconClick={() => {
              router.push("/editprofile");
            }}
          />
        )}

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

          <div className="mt-8 h-[1px] w-full bg-muted" />
        </div>

        {isAdmin && (
          <div className="mt-5 w-[90%]">
            <p className="text-sm text-muted-foreground">관리자</p>
            <div className="mt-4 flex flex-col gap-6">
              <SystemField
                iconSrc="BellColor.svg"
                title="푸시 알림 관리"
                description="푸시 알림 발송 및 이력을 관리할 수 있어요."
                onClick={() => router.push("/admin")}
              />
            </div>
            <div className="mt-8 h-[1px] w-full bg-muted" />
          </div>
        )}

        <div className="mt-5 w-[90%]">
          <p className="text-sm text-muted-foreground">문의 및 건의</p>
          <div className="mt-4 flex flex-col gap-6">
            <SystemField
              iconSrc="HeadPhone.svg"
              title="고객 센터"
              onClick={() => (location.href = "https://pf.kakao.com/_axcExbn")}
            />
          </div>

          <div className="mt-8 h-[1px] w-full bg-muted" />
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
      </div>

      <BottomNavbar />

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
        message={
          "정말로 계정을 탈퇴하시겠습니까?\n모든 정보가 사라지게 됩니다."
        }
        checkBox
        checkMessage={"위 내용을 충분히 이해하였으며,\n계정 탈퇴에 동의합니다."}
      />
    </div>
  );
};

export default mypage;