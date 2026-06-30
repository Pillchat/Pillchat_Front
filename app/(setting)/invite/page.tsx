"use client";

import { ReactNode } from "react";

import { CustomHeader } from "@/components/molecules";

function HeroHuman() {
  return (
    <div className="relative">
      <img src="/Human.svg" alt="" className="h-[140px] w-[100px]" />
      <img
        src="/HeartBubble.svg"
        alt=""
        className="absolute -right-10 -top-0 h-[52px] w-[52px]"
      />
    </div>
  );
}

function FriendHuman() {
  return (
    <div className="relative">
      <img src="/Human.svg" alt="" className="h-[92px] w-[84px]" />
      <img
        src="/glasses.svg"
        alt=""
        className="absolute left-1/2 top-[20px] h-4 w-9 -translate-x-1/2"
      />
    </div>
  );
}

function HistoryCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[110px] flex-1 flex-col items-center justify-center rounded-xl border border-[#c4c4c4] bg-white px-6 py-5">
      <span className="text-sm font-medium text-[#111]">{label}</span>
      <strong className="mt-3 text-xl font-bold text-[#111]">{children}</strong>
    </div>
  );
}

export default function InvitePage() {
  const invitedFriendCount = 0;
  const earnedFarmMoney = 0;

  const handleCopyInviteLink = async () => {
    if (typeof window === "undefined") return;

    await window.navigator.clipboard?.writeText(window.location.origin);
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-screen-sm bg-white">
      <CustomHeader title="친구 초대" />

      <main>
        <section className="flex flex-col items-center px-6 pt-[52px] text-center">
          <div>
            <h1 className="whitespace-pre-line text-2xl font-bold leading-9 text-[#111]">
              {"약챗에 친구를\n초대해보세요!"}
            </h1>
            <p className="mt-2 text-base font-medium text-[#111]">
              초대하면 친구도 나도 혜택을 받아요.
            </p>
          </div>

          <div className="mt-6">
            <HeroHuman />
          </div>
        </section>

        <section className="mt-[68px] bg-[#fff6f5] px-6 pb-16 pt-8 text-center">
          <span className="inline-flex h-8 items-center rounded-full bg-[#ffd8d4] px-5 text-sm font-semibold text-primary">
            혜택
          </span>

          <p className="mt-3 whitespace-pre-line text-base font-semibold leading-7 text-[#111]">
            {"친구 1명 가입하면 "}
            <span className="text-primary">150 팜머니 지급</span>
            {"\n가입한 "}
            <span className="text-primary">친구의 첫 구매 15% 할인</span>
          </p>

          <div className="mt-5 flex items-start justify-center gap-16">
            <div className="flex flex-col items-center">
              <strong className="mb-3 text-2xl font-bold text-[#111]">
                나
              </strong>
              <img src="/Human.svg" alt="" className="h-[92px] w-[84px]" />
              <div className="mt-2 flex items-center gap-2">
                <img src="/FarmMoney.svg" alt="" className="h-8 w-8" />
                <span className="text-xl font-medium text-primary">150</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <strong className="mb-3 text-2xl font-bold text-[#111]">
                친구
              </strong>
              <FriendHuman />
              <div className="relative mt-2 h-8 w-[132px]">
                <img
                  src="/SaleTicket.svg"
                  alt=""
                  className="absolute inset-0 h-full w-full"
                />
                <span className="relative flex h-full items-center justify-center pl-3 text-sm font-medium text-primary">
                  첫 구매 15% 할인권
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-10 pt-12">
          <h2 className="text-center text-xl font-bold text-[#111]">
            나의 초대 내역
          </h2>

          <div className="mt-3 flex gap-2">
            <HistoryCard label="초대한 친구">
              {invitedFriendCount}명
            </HistoryCard>
            <HistoryCard label="받은 팜머니">
              <span className="flex items-center gap-1 text-primary">
                <img src="/FarmMoney.svg" alt="" className="h-8 w-8" />
                {earnedFarmMoney.toLocaleString("ko-KR")}
              </span>
            </HistoryCard>
          </div>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="mt-8 h-16 w-full rounded-xl bg-primary text-lg font-medium text-white"
          >
            초대링크 복사하기
          </button>
        </section>
      </main>
    </div>
  );
}
