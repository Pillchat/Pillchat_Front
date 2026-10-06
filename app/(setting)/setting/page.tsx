"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { useState } from "react";

import { CustomHeader, SelectModal } from "@/components/molecules";
import { useRouter } from "@/lib/navigation";

import { useDelete, useLogout } from "../mypage/_hooks";

type ModalType = "logout" | "withdraw" | null;

interface SettingItemProps {
  icon: string;
  title: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingItem({
  icon,
  title,
  onClick,
  danger = false,
}: SettingItemProps) {
  const content = (
    <>
      <img src={icon} alt="" className="h-8 w-8 shrink-0" />
      <span
        className={`text-base font-semibold leading-6 ${
          danger ? "text-[#999]" : "text-[#222]"
        }`}
      >
        {title}
      </span>
    </>
  );

  if (!onClick) {
    return <div className="flex w-full items-center gap-3 py-3">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left"
    >
      {content}
    </button>
  );
}

export default function SettingPage() {
  const router = useRouter();
  const { onLogout } = useLogout();
  const { onDelete } = useDelete();
  const [openModal, setOpenModal] = useState<ModalType>(null);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-screen-sm bg-white">
      <CustomHeader title="전체 설정" />

      <main className="px-6 pb-10 pt-4">
        <section className="flex flex-col gap-1">
          <SettingItem
            icon={PUBLIC_ASSETS.icons.headset}
            title="고객센터"
            onClick={() => router.push("/support")}
          />
          <SettingItem
            icon={PUBLIC_ASSETS.icons.notice}
            title="공지사항"
            onClick={() => router.push("/notices")}
          />
          <SettingItem
            icon={PUBLIC_ASSETS.icons.privacyPolicy}
            title="개인정보 처리방침"
          />
          <SettingItem
            icon={PUBLIC_ASSETS.icons.terms}
            title="서비스 이용약관"
          />
        </section>

        <div className="my-5 h-px w-full bg-[#eeeeee]" />

        <section className="flex flex-col gap-1">
          <SettingItem
            icon={PUBLIC_ASSETS.icons.logout}
            title="로그아웃"
            onClick={() => setOpenModal("logout")}
          />
          <SettingItem
            icon={PUBLIC_ASSETS.icons.userRemove}
            title="계정탈퇴"
            danger
            onClick={() => setOpenModal("withdraw")}
          />
        </section>
      </main>

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
}
