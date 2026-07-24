"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Globe2, GraduationCap, Lock, Pencil } from "lucide-react";

import { Toast } from "@/components/atoms";
import { BottomNavbar } from "@/components/molecules";
import { useUpdateProfileVisibilityMutation } from "@/hooks/mutations";
import { useRouter } from "@/lib/navigation";
import { useMyPageContent, useMyProfile } from "./_hooks";
import type { MyBadge, MyComment, MyPageContentTab, MyPost } from "./_hooks";

const gradeLabels: Record<string, string> = {
  SAESSAK: "새싹",
  HANAL: "한알",
  DUEAL: "두알",
  GOSU: "고수",
  MYEONGYAK: "명약",
};

type ProfileTab = MyPageContentTab;

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "내가 쓴 글" },
  { id: "comments", label: "내가 쓴 댓글" },
  { id: "badges", label: "배지" },
];

const categoryLabels: Record<string, string> = {
  FREE: "자유게시판",
  TIP: "암기 꿀팁",
  REVIEW: "실습 후기",
};

const formatCreatedAt = (value: string) => {
  if (!value) return "날짜 없음";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

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

function ContentList({
  items,
  onSelect,
}: {
  items: MyPost[];
  onSelect: (id: number) => void;
}) {
  return (
    <div className="px-6 pt-[1.625rem]">
      {items.map((item, index) => (
        <article
          key={item.id}
          className={`h-[70px] ${
            index === 0 ? "pt-0" : "border-t border-[#ebe6e3]"
          }`}
        >
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex h-full w-full flex-col justify-center text-left active:opacity-70"
          >
            <p className="text-[0.8125rem] font-normal leading-[18px] text-[#6f625d]">
              {item.categoryName || categoryLabels[item.category] || "게시판"} ·{" "}
              {formatCreatedAt(item.createdAt)}
            </p>
            <h2 className="mt-1 truncate text-[1rem] font-medium leading-[22px] text-[#050505]">
              {item.title}
            </h2>
          </button>
        </article>
      ))}
    </div>
  );
}

function CommentList({
  items,
  onSelect,
}: {
  items: MyComment[];
  onSelect: (boardId: number) => void;
}) {
  return (
    <div className="px-6 pt-[1.625rem]">
      {items.map((item, index) => (
        <article
          key={item.id}
          className={`${index === 0 ? "" : "border-t border-[#ebe6e3]"} py-4`}
        >
          <button
            type="button"
            onClick={() => onSelect(item.boardId)}
            className="w-full text-left active:opacity-70"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[0.8125rem] leading-[18px] text-[#6f625d]">
                {item.boardTitle}
              </p>
              <span className="shrink-0 text-[0.75rem] text-[#8d817c]">
                {formatCreatedAt(item.createdAt)}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[0.9375rem] font-medium leading-[22px] text-[#050505]">
              {item.content}
            </p>
            <p className="mt-2 text-[0.75rem] text-[#9b5040]">
              좋아요 {item.likeCount.toLocaleString("ko-KR")}
            </p>
          </button>
        </article>
      ))}
    </div>
  );
}

function BadgePanel({ badge }: { badge: MyBadge }) {
  const currentGrade = gradeLabels[badge.grade] || badge.grade || "등급 없음";
  const nextGrade = badge.nextGrade
    ? gradeLabels[badge.nextGrade] || badge.nextGrade
    : null;
  const rate = Math.min(1, Math.max(0, badge.rate));
  const ratePercent = Math.round(rate * 100);
  const isHighestGrade = !nextGrade || badge.target <= 0;
  const stats = [
    { label: "질문", value: badge.questionCount },
    { label: "답변", value: badge.answerCount },
    { label: "채택", value: badge.acceptedCount },
    { label: "받은 좋아요", value: badge.likeCount },
  ];

  return (
    <div className="px-6 pb-8 pt-[1.625rem]">
      <div className="rounded-[1.25rem] bg-[#fff5f1] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.8125rem] font-medium text-[#8d5548]">
              현재 배지
            </p>
            <h2 className="mt-1 text-[1.5rem] font-bold text-[#c63821]">
              {currentGrade}
            </h2>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#e85a35] shadow-[0_4px_16px_rgba(198,56,33,0.12)]">
            <GraduationCap
              aria-hidden="true"
              className="h-7 w-7"
              strokeWidth={1.9}
            />
          </div>
        </div>

        {isHighestGrade ? (
          <p className="mt-5 text-[0.875rem] font-medium leading-6 text-[#6f625d]">
            최고 등급을 달성했습니다.
          </p>
        ) : (
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3 text-[0.8125rem]">
              <p className="font-medium text-[#6f625d]">
                다음 배지{" "}
                <strong className="text-[#3f332f]">{nextGrade}</strong>
              </p>
              <span className="font-bold text-[#c63821]">{ratePercent}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f0d7cf]">
              <div
                className="h-full rounded-full bg-[#e85a35] transition-[width]"
                style={{ width: `${ratePercent}%` }}
              />
            </div>
            <p className="mt-2 text-right text-[0.75rem] text-[#8d817c]">
              {badge.progress.toLocaleString("ko-KR")} /{" "}
              {badge.target.toLocaleString("ko-KR")}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#ebe6e3] bg-white px-4 py-4"
          >
            <p className="text-[0.8125rem] text-[#6f625d]">{stat.label}</p>
            <p className="mt-1 text-[1.25rem] font-bold text-[#19110f]">
              {stat.value.toLocaleString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentLoading({ label }: { label: string }) {
  return (
    <div className="space-y-4 px-6 pt-[1.625rem]" aria-label={label}>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-[54px] animate-pulse rounded-lg bg-[#f5f1ee]"
        />
      ))}
    </div>
  );
}

function ContentStatus({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center px-6 text-center">
      <p className="text-[0.9375rem] leading-6 text-[#6f625d]">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 h-10 rounded-full bg-[#fff0ea] px-5 text-[0.875rem] font-bold text-[#c63821]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const { onMyProfile, setProfileVisibility, isLoading, error, profile } =
    useMyProfile();
  const {
    posts,
    postsLoading,
    postsError,
    refetchPosts,
    comments,
    commentsLoading,
    commentsError,
    refetchComments,
    badge,
    badgeLoading,
    badgeError,
    refetchBadge,
  } = useMyPageContent(activeTab);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastKey((current) => current + 1);
    setToastOpen(true);
  };

  const visibilityMutation = useUpdateProfileVisibilityMutation({
    onSuccess: ({ isPublic }) => {
      setProfileVisibility(isPublic);
      showToast(
        isPublic
          ? "마이페이지가 공개되었습니다."
          : "마이페이지가 비공개되었습니다.",
      );
    },
    onError: (mutationError) => {
      showToast(
        mutationError.message || "마이페이지 공개 설정을 변경하지 못했습니다.",
      );
    },
  });

  useEffect(() => {
    onMyProfile();
  }, [onMyProfile]);

  const displayName = profile.nickname || "이름";
  const profileImage = profile.profileImg || null;
  const badgeLabel =
    profile.grade && profile.grade !== "NONE"
      ? gradeLabels[profile.grade] || profile.grade
      : "등급 없음";
  const followerCount = profile.followerCount;
  const followingCount = profile.followingCount;

  const handleVisibilityToggle = () => {
    if (profile.isPublic === null || visibilityMutation.isPending) return;
    visibilityMutation.mutate({ isPublic: !profile.isPublic });
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[393px] bg-white pb-[6.5rem] text-[#111]">
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
                  <h1 className="max-w-[12rem] truncate text-[1.875rem] font-medium leading-9 text-[#050505]">
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
                role="switch"
                aria-checked={profile.isPublic === true}
                aria-busy={visibilityMutation.isPending}
                disabled={
                  profile.isPublic === null || visibilityMutation.isPending
                }
                onClick={handleVisibilityToggle}
                className={`inline-flex h-8 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-bold active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                  profile.isPublic === false
                    ? "bg-[#f1ece9] text-[#5f524d]"
                    : "bg-[#fff0ea] text-[#c63821]"
                }`}
              >
                {profile.isPublic === false ? (
                  <Lock
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.9}
                  />
                ) : (
                  <Globe2
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.9}
                  />
                )}
                {profile.isPublic === null
                  ? "확인 중"
                  : profile.isPublic
                    ? "공개"
                    : "비공개"}
              </button>
            </div>
            {activeTab === "posts" &&
              (postsLoading ? (
                <ContentLoading label="내가 쓴 글 불러오는 중" />
              ) : postsError ? (
                <ContentStatus
                  message="내가 쓴 글을 불러오지 못했습니다."
                  actionLabel="다시 시도"
                  onAction={refetchPosts}
                />
              ) : posts.length === 0 ? (
                <ContentStatus message="아직 작성한 글이 없습니다." />
              ) : (
                <ContentList
                  items={posts}
                  onSelect={(id) => router.push(`/board/${id}`)}
                />
              ))}
            {activeTab === "comments" &&
              (commentsLoading ? (
                <ContentLoading label="내가 쓴 댓글 불러오는 중" />
              ) : commentsError ? (
                <ContentStatus
                  message="내가 쓴 댓글을 불러오지 못했습니다."
                  actionLabel="다시 시도"
                  onAction={refetchComments}
                />
              ) : comments.length === 0 ? (
                <ContentStatus message="아직 작성한 댓글이 없습니다." />
              ) : (
                <CommentList
                  items={comments}
                  onSelect={(boardId) => router.push(`/board/${boardId}`)}
                />
              ))}
            {activeTab === "badges" &&
              (badgeLoading ? (
                <ContentLoading label="배지 정보 불러오는 중" />
              ) : badgeError ? (
                <ContentStatus
                  message="배지 정보를 불러오지 못했습니다."
                  actionLabel="다시 시도"
                  onAction={refetchBadge}
                />
              ) : badge ? (
                <BadgePanel badge={badge} />
              ) : (
                <ContentStatus message="배지 정보가 없습니다." />
              ))}
          </section>
        </main>
      )}

      <BottomNavbar className="max-w-[393px]" />
      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        toastKey={toastKey}
      />
    </div>
  );
}
