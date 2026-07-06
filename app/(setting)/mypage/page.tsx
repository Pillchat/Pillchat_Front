"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, GraduationCap, Lock, Pencil } from "lucide-react";

import { BottomNavbar } from "@/components/molecules";
import { useRouter } from "@/lib/navigation";
import { useMyProfile } from "./_hooks";

const gradeLabels: Record<string, string> = {
  SAESSAK: "새싹",
  HANAL: "한알",
  DUEAL: "두알",
  GOSU: "고수",
  MYEONGYAK: "명약",
};

type ProfileTab = "posts" | "comments" | "badges";

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "내가 쓴 글" },
  { id: "comments", label: "내가 쓴 댓글" },
  { id: "badges", label: "배지" },
];

const postItems = [
  {
    meta: "자유게시판 · 06/22 05:09",
    title: "현장실습 2번 떨어졌다 ㅠㅠㅠ",
  },
  {
    meta: "암기 꿀팁 · 어제",
    title: "베타차단제 한 줄 암기법 ㄷㄷ",
  },
  {
    meta: "자유게시판 · 3일 전",
    title: "약물학 교수님 시험 스타일 정리해드림",
  },
];

const commentItems = [
  {
    meta: "자유게시판 · 오늘",
    title: "저도 같은 부분에서 헷갈렸어요",
  },
  {
    meta: "암기 꿀팁 · 어제",
    title: "이 암기법 진짜 도움 됩니다",
  },
  {
    meta: "실습 후기 · 2일 전",
    title: "병원별 분위기 차이가 꽤 크더라구요",
  },
];

const badgeItems = [
  {
    meta: "학습 배지",
    title: "7일 연속 학습 달성",
  },
  {
    meta: "커뮤니티 배지",
    title: "첫 게시글 작성",
  },
  {
    meta: "시험 대비 배지",
    title: "CBT 복습 완료",
  },
];

function PillAvatar({ src, alt }: { src?: string | null; alt: string }) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [src]);

  if (src && !hasImageError) {
    return (
      <div className="h-full w-full rounded-full bg-[#ffe3d7]">
        <img
          src={src}
          alt={alt}
          onError={() => setHasImageError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-full bg-[#ffe3d7]">
      <div className="absolute left-1/2 top-1/2 h-[2.35rem] w-[4.85rem] -translate-x-1/2 -translate-y-1/2 -rotate-45 overflow-hidden rounded-full bg-[#f1b454] shadow-[0_7px_14px_rgba(198,74,40,0.22)]">
        <div className="absolute right-0 top-0 h-full w-[52%] rounded-r-full bg-gradient-to-br from-[#b82563] to-[#e54a78]" />
        <div className="absolute right-[0.55rem] top-[0.55rem] h-3 w-3 rounded-full bg-white/80" />
      </div>
    </div>
  );
}

function ContentList({ items }: { items: typeof postItems }) {
  return (
    <div className="px-6 pt-[1.625rem]">
      {items.map((item, index) => (
        <article
          key={`${item.meta}-${item.title}`}
          className={`flex h-[70px] flex-col justify-center ${
            index === 0 ? "pt-0" : "border-t border-[#ebe6e3]"
          }`}
        >
          <p className="text-[0.8125rem] font-normal leading-[18px] text-[#6f625d]">
            {item.meta}
          </p>
          <h2 className="mt-1 text-[1rem] font-bold leading-[22px] text-[#050505]">
            {item.title}
          </h2>
        </article>
      ))}
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { onMyProfile, isLoading, error, profile } = useMyProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  useEffect(() => {
    onMyProfile();
  }, [onMyProfile]);

  const displayName = profile.nickname || "약학마스터";
  const profileImage = profile.profileImg || null;
  const badgeLabel =
    profile.grade && profile.grade !== "NONE"
      ? gradeLabels[profile.grade] || profile.grade
      : "약물학 A+";
  const followerCount = profile.followerCount || 6;
  const followingCount = profile.followingCount || 52;

  const currentItems = useMemo(() => {
    if (activeTab === "comments") return commentItems;
    if (activeTab === "badges") return badgeItems;
    return postItems;
  }, [activeTab]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[393px] bg-white pb-[5.25rem] text-[#111]">
      <header className="flex h-[60px] items-center justify-between px-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="-ml-1 flex h-10 w-10 items-center justify-start text-[#111] active:scale-95"
        >
          <ChevronLeft
            aria-hidden="true"
            className="h-7 w-7"
            strokeWidth={2.35}
          />
        </button>
        <button
          type="button"
          onClick={() => router.push("/setting")}
          className="text-[1rem] font-normal leading-6 text-[#4d3f39] active:scale-95"
        >
          설정
        </button>
      </header>

      {error ? (
        <main className="flex min-h-[34rem] flex-col items-center justify-center px-6 text-center">
          <p className="text-[0.9375rem] font-medium text-[#6f625d]">
            프로필 정보를 불러오지 못했습니다.
          </p>
          <button
            type="button"
            onClick={() => onMyProfile()}
            className="mt-4 h-11 rounded-full bg-[#e85a35] px-6 text-[0.9375rem] font-bold text-white"
          >
            다시 시도
          </button>
        </main>
      ) : (
        <main>
          <section className="flex h-[268px] flex-col items-center pb-[16px] pl-[16px] pr-[24px] pt-[8px] text-center">
            <div className="relative h-[96px] w-[96px] shrink-0">
              <PillAvatar src={profileImage} alt={`${displayName} 프로필`} />
              <button
                type="button"
                onClick={() => router.push("/editprofile")}
                aria-label="프로필 이미지 편집"
                className="absolute bottom-[0.125rem] right-[-0.125rem] flex h-8 w-8 items-center justify-center rounded-full border-[0.1875rem] border-white bg-[#e85a35] text-white shadow-[0_2px_7px_rgba(232,90,53,0.28)] active:scale-95"
              >
                <Pencil
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              </button>
            </div>

            <div className="mt-[17px] flex min-h-[36px] w-full items-center justify-center gap-2">
              {isLoading ? (
                <div className="h-8 w-40 animate-pulse rounded-full bg-[#f1ece9]" />
              ) : (
                <>
                  <h1 className="max-w-[12rem] truncate text-[1.875rem] font-semibold leading-9 text-[#050505]">
                    {displayName}
                  </h1>
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#fff0ea] px-3.5 text-[0.9375rem] font-bold text-[#c63821]">
                    <GraduationCap
                      aria-hidden="true"
                      className="h-4 w-4 text-[#273044]"
                      strokeWidth={2}
                    />
                    {badgeLabel}
                  </span>
                </>
              )}
            </div>

            <div className="mt-[8px] flex items-center justify-center text-[1.125rem] leading-7 text-[#5c4c46]">
              <span>
                팔로워{" "}
                <strong className="font-bold text-[#050505]">
                  {followerCount.toLocaleString("ko-KR")}
                </strong>
              </span>
              <span className="mx-[1.375rem] h-[1.0625rem] w-px bg-[#e6ded9]" />
              <span>
                팔로잉{" "}
                <strong className="font-bold text-[#050505]">
                  {followingCount.toLocaleString("ko-KR")}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => router.push("/editprofile")}
              className="mt-[14px] h-[44px] w-full rounded-full bg-[#f5f1ee] text-[1.0625rem] font-bold text-[#050505] active:scale-[0.99]"
            >
              프로필 편집
            </button>
          </section>

          <section className="h-[44px] border-b border-[#ebe6e3]">
            <div className="grid h-full grid-cols-3 px-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center justify-center text-[1.0625rem] font-semibold leading-6 ${
                      isActive ? "text-[#050505]" : "text-[#5f524d]"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#19110f]" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-h-[24.5rem]">
            <div className="flex justify-end px-6 pt-[0.875rem]">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-2 rounded-full bg-[#fff0ea] px-4 text-[0.9375rem] font-bold text-[#c63821] active:scale-95"
              >
                <Lock
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={1.9}
                />
                공개
              </button>
            </div>
            <ContentList items={currentItems} />
          </section>
        </main>
      )}

      <BottomNavbar className="max-w-[393px]" />
    </div>
  );
}
