"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { BottomNavbar, MeaninglessHeader } from "@/components/molecules";
import { fetchAPI } from "@/lib/client/fetch";
import { useMyProfile } from "./_hooks";

const gradeLabels: Record<string, string> = {
  SAESSAK: "새싹",
  HANAL: "한알",
  DUEAL: "두알",
  GOSU: "고수",
  MYEONGYAK: "명약",
};

const gradeColors: Record<string, string> = {
  SAESSAK: "#4caf50",
  HANAL: "#ff49b9",
  DUEAL: "#e6ad00",
  GOSU: "#ff412e",
  MYEONGYAK: "#9f1004",
};

const SELECTED_BADGE_STORAGE_KEY = "yakchat:selected-badge-id";

const temporaryBadges = [
  { id: "badge-1", name: "질문 마스터", icon: "/BadgeIcon1.svg" },
  { id: "badge-2", name: "자료 장인", icon: "/BadgeIcon2.svg" },
  { id: "badge-3", name: "오답 수집가", icon: "/BadgeIcon3.svg" },
  { id: "badge-4", name: "병원 실습 완료", icon: "/BadgeIcon4.svg" },
  { id: "badge-5", name: "국시패스", icon: "/BadgeIcon5.svg" },
];

interface ActionItemProps {
  icon: string;
  label: string;
  onClick?: () => void;
  bordered?: boolean;
}

function ActionItem({ icon, label, onClick, bordered }: ActionItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-center text-sm font-medium text-[#222] ${bordered ? "border-l border-[#eeeeee]" : ""}`}
    >
      <img src={icon} alt="" className="h-8 w-8" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

interface InfoItemProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
}

function InfoItem({ icon, title, description, onClick }: InfoItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2 text-left"
    >
      <img src={icon} alt="" className="h-8 w-8 shrink-0" />
      <span className="min-w-0">
        <strong className="block text-base font-semibold leading-6 text-[#222]">
          {title}
        </strong>
        <span className="block text-sm leading-5 text-[#777]">
          {description}
        </span>
      </span>
    </button>
  );
}

function BalanceItem({
  icon,
  value,
  label,
  compact = false,
}: {
  icon: string;
  value: number;
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex w-full min-w-0 flex-1 flex-col items-center justify-center ${compact ? "gap-1 py-2" : "gap-2 py-4"}`}
    >
      <div className="flex w-full items-center justify-center gap-2">
        <img src={icon} alt="" className={compact ? "h-7 w-7" : "h-8 w-8"} />
        <strong
          className={`${compact ? "text-lg" : "text-xl"} font-semibold text-[#171717]`}
        >
          {value.toLocaleString("ko-KR")}
        </strong>
      </div>
      <span className="w-full text-center text-sm font-medium text-[#333]">
        {label}
      </span>
    </div>
  );
}

function PurchaseButton({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#fff6f5] px-2 text-sm font-medium text-[#222]"
    >
      <img src={icon} alt="" className="h-7 w-7" />
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function BenefitItem({
  icon,
  title,
  onClick,
}: {
  icon: string;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2 text-left"
    >
      <img src={icon} alt="" className="h-8 w-8 shrink-0" />
      <strong className="text-base font-semibold leading-6 text-[#222]">
        {title}
      </strong>
    </button>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { onMyProfile, isLoading, error, profile } = useMyProfile();
  const [selectedBadgeId, setSelectedBadgeId] = useState(temporaryBadges[0].id);

  useEffect(() => {
    onMyProfile();
  }, [onMyProfile]);

  useEffect(() => {
    const savedBadgeId = window.localStorage.getItem(
      SELECTED_BADGE_STORAGE_KEY,
    );
    if (
      savedBadgeId &&
      temporaryBadges.some((badge) => badge.id === savedBadgeId)
    ) {
      setSelectedBadgeId(savedBadgeId);
    }
  }, []);

  const isProfessional = profile.userType === "PROFESSIONAL";
  const displayName = profile.nickname || "닉네임";
  const profileImage = profile.profileImg || "/icons/defaultProfile.svg";
  const selectedBadge =
    temporaryBadges.find((badge) => badge.id === selectedBadgeId) ??
    temporaryBadges[0];
  const gradeLabel = profile.grade
    ? gradeLabels[profile.grade] || profile.grade
    : "";
  const detailLine = isProfessional
    ? [
        profile.job || "직업 정보 없음",
        profile.workplace || "근무지 정보 없음",
      ].join(" / ")
    : [
        profile.school || "학교 정보 없음",
        profile.studentGrade || "학년 정보 없음",
      ].join(" / ");

  const handleOnboardingClick = async () => {
    try {
      const result = await fetchAPI("/api/auth/inquiry-myprofile", "GET");
      const role =
        result?.data?.userType === "PROFESSIONAL" ? "professional" : "student";
      router.push(`/onboarding/${role}`);
    } catch {
      router.push("/onboarding");
    }
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-screen-sm bg-white pb-[8.25rem]">
      <MeaninglessHeader showActions />

      <main className="px-6 pb-4">
        {error ? (
          <div className="flex min-h-[28rem] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-[#777]">
              프로필 정보를 불러오지 못했습니다.
            </p>
            <button
              type="button"
              onClick={() => onMyProfile()}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <section className="flex flex-col items-center pt-3 text-center">
              <div className="relative h-[4.25rem] w-[4.25rem]">
                <img
                  src={profileImage}
                  alt={`${displayName} 프로필`}
                  className="h-full w-full rounded-full object-cover"
                />
                {selectedBadge && (
                  <span
                    className="absolute -bottom-0.5 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_0_0_2px_#fff]"
                    aria-label={`대표 뱃지: ${selectedBadge.name}`}
                  >
                    <img
                      src={selectedBadge.icon}
                      alt=""
                      className="h-full w-full"
                    />
                  </span>
                )}
              </div>

              <div className="mt-3 flex min-h-7 items-center justify-center gap-2">
                {isLoading ? (
                  <span className="h-5 w-28 animate-pulse rounded bg-[#eeeeee]" />
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-[#171717]">
                      {displayName}
                    </h1>
                    {isProfessional && gradeLabel && (
                      <span
                        className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                        style={{
                          backgroundColor:
                            gradeColors[profile.grade || ""] || "#666",
                        }}
                      >
                        {gradeLabel}
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="mt-1 text-sm text-[#333]">{detailLine}</p>

              <div className="mt-4 flex items-start justify-center gap-12">
                <div>
                  <span className="block text-xs text-[#999]">팔로워</span>
                  <strong className="mt-1 block text-lg font-medium text-[#222]">
                    {profile.followerCount.toLocaleString("ko-KR")}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs text-[#999]">팔로잉</span>
                  <strong className="mt-1 block text-lg font-medium text-[#222]">
                    {profile.followingCount.toLocaleString("ko-KR")}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/editprofile")}
                className="mt-5 h-11 w-full rounded-2xl bg-[#fff6f5] text-sm font-semibold text-brand"
              >
                프로필 편집
              </button>
            </section>

            <section className="mt-8">
              <h2 className="text-sm text-[#999]">내 자료 관리</h2>
              <div className="mt-2 flex">
                <ActionItem
                  icon={isProfessional ? "/Answer.svg" : "/QA.svg"}
                  label={isProfessional ? "답변 관리" : "질문 및 답변 관리"}
                  onClick={() => router.push("/archive")}
                />
                <ActionItem
                  icon="/Post.svg"
                  label="게시물 관리"
                  bordered
                  onClick={() => router.push("/board")}
                />
                <ActionItem
                  icon="/Materials.svg"
                  label="학습 자료 관리"
                  bordered
                  onClick={() => router.push("/archive")}
                />
              </div>
            </section>

            <section className="mt-7">
              <h2 className="text-sm text-[#999]">팜머니 관리</h2>
              {isProfessional ? (
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-[#fff6f5]"
                  >
                    <img src="/Store.svg" alt="" className="h-8 w-8" />
                    <span className="text-sm font-semibold text-[#222]">
                      팜머니 상점
                    </span>
                  </button>
                  <div className="flex h-20 flex-col items-center justify-center rounded-2xl bg-[#fff6f5]">
                    <BalanceItem
                      icon="/FarmMoney.svg"
                      value={profile.farmMoney}
                      label="보유 팜머니"
                      compact
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-2 flex rounded-2xl bg-[#fff6f5]">
                    <BalanceItem
                      icon="/Ticket.svg"
                      value={profile.ticketCount}
                      label="보유 질문티켓"
                    />
                    <BalanceItem
                      icon="/FarmMoney.svg"
                      value={profile.farmMoney}
                      label="보유 팜머니"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <PurchaseButton icon="/Store.svg">
                      팜머니 상점
                    </PurchaseButton>
                    <PurchaseButton icon="/Purchase.svg">
                      팜머니 / 질문권 구입
                    </PurchaseButton>
                  </div>
                </>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-sm text-[#999]">정보</h2>
              <div className="mt-2 flex flex-col gap-1">
                <InfoItem
                  icon="/Badge.svg"
                  title="뱃지 설정"
                  description="대표 뱃지를 설정해보세요."
                  onClick={() => router.push("/grade")}
                />
                {!isProfessional && (
                  <InfoItem
                    icon="/userUp.svg"
                    title="승급 조건"
                    description="다음 승급을 위한 조건을 알아보세요."
                    onClick={() => router.push("/gradeInfo")}
                  />
                )}
                <InfoItem
                  icon="/Coupon.svg"
                  title="내 쿠폰"
                  description="쿠폰을 사용하여 알뜰한 약챗 소비를 해보세요."
                  onClick={() => router.push("/coupon")}
                />
                <InfoItem
                  icon="/BellColor.svg"
                  title="알림 설정"
                  description="원하는 알림만 받도록 설정해보세요."
                  onClick={() => router.push("/bellSetting")}
                />
                <InfoItem
                  icon="/userInfo.svg"
                  title="맞춤형 정보 설정"
                  description="내가 설정한 항목을 변경할 수 있어요."
                  onClick={handleOnboardingClick}
                />
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-sm text-[#999]">혜택</h2>
              <div className="mt-2 flex flex-col gap-1">
                <BenefitItem
                  icon="/Attendance.svg"
                  title="출석체크하고 5 팜머니 받기"
                  onClick={() => router.push("/attendance")}
                />
                <BenefitItem
                  icon="/Invite.svg"
                  title="친구 초대하고 50 팜머니 받기"
                  onClick={() => router.push("/invite")}
                />
              </div>
              <div className="mt-5 h-px w-full bg-[#eeeeee]" />
            </section>
          </>
        )}
      </main>

      <BottomNavbar className="md:max-w-screen-sm" />
    </div>
  );
}
