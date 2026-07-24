"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { LeftArrowButton } from "@/components/atoms";
import { ActionMenu, ActionMenuItem } from "@/components/molecules";
import { getCurrentUserId } from "@/lib/client/auth";
import { fetchAPI } from "@/lib/client/fetch";
import { useRouter } from "@/lib/navigation";
import { getFilePreviewUrl } from "@/lib/shared/filePreview";

type BadgeItem = {
  id: string;
  name: string;
  icon: string;
};

type UserProfile = {
  isPublic: boolean | null;
  nickname: string;
  profileImage: string;
  affiliation: string;
  followerCount: number;
  followingCount: number;
  questionCount: number;
  answerCount: number;
  attendanceStreak: number;
  badges: BadgeItem[];
};

const numberValue = (...values: unknown[]) => {
  const value = values.find(
    (candidate) => candidate !== undefined && candidate !== null,
  );

  if (Array.isArray(value)) return value.length;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const textValue = (...values: unknown[]) => {
  const value = values.find(
    (candidate) => candidate !== undefined && candidate !== null,
  );

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const item = value as { label?: string; value?: string; name?: string };
    return item.label ?? item.value ?? item.name ?? "";
  }

  return "";
};

const normalizeBadges = (payload: Record<string, unknown>): BadgeItem[] => {
  const rawBadges = payload.badges ?? payload.badgeList ?? payload.earnedBadges;

  if (!Array.isArray(rawBadges)) return [];

  return rawBadges.map((badge, index) => {
    if (badge && typeof badge === "object") {
      const item = badge as {
        id?: string | number;
        name?: string;
        title?: string;
        badgeName?: string;
        icon?: string;
        iconUrl?: string;
        image?: string;
      };

      return {
        id: String(item.id ?? `badge-${index}`),
        name: item.name ?? item.title ?? item.badgeName ?? "뱃지",
        icon: item.icon ?? item.iconUrl ?? item.image ?? "/Idk.svg",
      };
    }

    return {
      id: `badge-${index}`,
      name: String(badge),
      icon: "/Idk.svg",
    };
  });
};

const normalizeProfile = (result: unknown): UserProfile => {
  const response = result as { data?: unknown };
  const payload = (
    response?.data && typeof response.data === "object"
      ? response.data
      : result && typeof result === "object"
        ? result
        : {}
  ) as Record<string, unknown>;

  const userType = textValue(payload.userType);
  const isProfessional = userType === "PROFESSIONAL";
  const school = textValue(payload.school);
  const studentGrade = textValue(payload.studentGrade, payload.grade);
  const job = textValue(payload.job, payload.profession);
  const workplace = textValue(payload.workplace, payload.company);
  const affiliation = isProfessional
    ? [job, workplace].filter(Boolean).join(" / ")
    : [school, studentGrade].filter(Boolean).join(" / ");
  const imageFromList = Array.isArray(payload.images)
    ? payload.images
        .map((image) =>
          getFilePreviewUrl(image as Parameters<typeof getFilePreviewUrl>[0]),
        )
        .find(Boolean)
    : undefined;

  return {
    isPublic: payload.isPublic !== false,
    nickname:
      textValue(payload.nickname, payload.userNickname, payload.name) ||
      "사용자",
    profileImage:
      textValue(
        imageFromList,
        payload.profileImg,
        payload.profileImage,
        payload.imageUrl,
      ) || "/defaultProfile.svg",
    affiliation: affiliation || "소속 정보 없음",
    followerCount: numberValue(
      payload.followerCount,
      payload.followersCount,
      payload.followers,
    ),
    followingCount: numberValue(
      payload.followingCount,
      payload.followingsCount,
      payload.following,
    ),
    questionCount: numberValue(
      payload.questionCount,
      payload.questionsCount,
      payload.questions,
    ),
    answerCount: numberValue(
      payload.answerCount,
      payload.answersCount,
      payload.answers,
    ),
    attendanceStreak: numberValue(
      payload.attendanceStreak,
      payload.streakCount,
      payload.continuousAttendanceCount,
    ),
    badges: normalizeBadges(payload),
  };
};

const initialProfile: UserProfile = {
  isPublic: null,
  nickname: "사용자",
  profileImage: "/defaultProfile.svg",
  affiliation: "소속 정보 없음",
  followerCount: 0,
  followingCount: 0,
  questionCount: 0,
  answerCount: 0,
  attendanceStreak: 0,
  badges: [],
};

function ProfileHeader({ onReport }: { onReport: () => void }) {
  const router = useRouter();
  const menuItems: ActionMenuItem[] = [
    {
      id: "report",
      label: "신고",
      onClick: onReport,
    },
  ];

  return (
    <header className="sticky top-0 z-10 flex h-[60px] w-full items-center justify-between bg-white px-6">
      <LeftArrowButton onClick={() => router.back()} />
      <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-[#171717]">
        사용자 프로필
      </p>
      <ActionMenu
        items={menuItems}
        trigger={
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center"
            aria-label="더보기"
          >
            <img src="/More.svg" alt="" className="h-8 w-8" />
          </button>
        }
      />
    </header>
  );
}

function CountBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="block text-xs text-[#999]">{label}</span>
      <strong className="mt-1 block text-lg font-medium text-[#222]">
        {value.toLocaleString("ko-KR")}
      </strong>
    </div>
  );
}

function StudyStat({
  icon,
  value,
  label,
  bordered = false,
}: {
  icon: string;
  value: number;
  label: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-1 ${bordered ? "border-l border-[#eeeeee]" : ""}`}
    >
      <div className="flex items-center justify-center gap-2">
        <img src={icon} alt="" className="h-8 w-8" />
        <strong className="text-xl font-semibold text-[#222]">
          {value.toLocaleString("ko-KR")}개
        </strong>
      </div>
      <span className="text-sm font-medium text-[#999]">{label}</span>
    </div>
  );
}

export const UserProfilePage: FC<{ userId: string }> = ({ userId }) => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>();

  useEffect(() => {
    let ignore = false;
    setViewerUserId(getCurrentUserId());

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      setProfile(initialProfile);

      try {
        const result = await fetchAPI(`/api/profile/${userId}`, "GET");
        if (!ignore) setProfile(normalizeProfile(result));
      } catch (err) {
        console.error("사용자 프로필 조회 실패:", err);
        if (!ignore) setError("사용자 정보를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [userId]);

  const visibleBadges = useMemo(() => profile.badges.slice(0, 3), [profile]);
  const isOwnProfile =
    viewerUserId !== null &&
    viewerUserId !== undefined &&
    String(viewerUserId) === String(userId);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-screen-sm bg-white">
      <ProfileHeader
        onReport={() => router.push(`/reports?type=PROFILE&id=${userId}`)}
      />

      <main className="px-6 pb-10">
        {error ? (
          <div className="flex min-h-[28rem] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-[#777]">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        ) : isLoading || viewerUserId === undefined ? (
          <div
            className="flex min-h-[28rem] flex-col items-center justify-center gap-4"
            role="status"
            aria-label="사용자 프로필 불러오는 중"
          >
            <div className="h-[4.25rem] w-[4.25rem] animate-pulse rounded-full bg-[#f1ece9]" />
            <div className="h-6 w-28 animate-pulse rounded-full bg-[#f1ece9]" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-[#f5f1ee]" />
          </div>
        ) : profile.isPublic === false && !isOwnProfile ? (
          <section className="flex min-h-[28rem] flex-col items-center justify-center text-center">
            <img
              src={profile.profileImage}
              alt={`${profile.nickname} 프로필`}
              className="h-[4.25rem] w-[4.25rem] rounded-full object-cover"
            />
            <h1 className="mt-3 text-xl font-bold text-[#171717]">
              {profile.nickname}
            </h1>
            <span className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1ece9] text-[#6f625d]">
              <Lock aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[#171717]">
              비공개 프로필입니다
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#777]">
              사용자가 마이페이지를 비공개로 설정했습니다.
            </p>
          </section>
        ) : (
          <>
            <section className="flex flex-col items-center pt-8 text-center">
              <div className="relative h-[4.25rem] w-[4.25rem]">
                <img
                  src={profile.profileImage}
                  alt={`${profile.nickname} 프로필`}
                  className="h-full w-full rounded-full object-cover"
                />
                {profile.attendanceStreak > 0 && (
                  <span
                    className="absolute -bottom-0.5 -right-1 flex h-8 w-8 items-center justify-center"
                    aria-label={`${profile.attendanceStreak}일 연속 출석`}
                  >
                    <img
                      src="/BadgeIcon1.svg"
                      alt=""
                      className="absolute inset-0 h-full w-full"
                    />
                    <span className="relative -translate-x-[1px] text-[0.625rem] font-bold leading-none text-brand">
                      {profile.attendanceStreak}
                    </span>
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-xl font-bold text-[#171717]">
                {profile.nickname}
              </h1>
              <p className="mt-1 text-sm text-[#333]">{profile.affiliation}</p>

              <div className="mt-4 flex items-start justify-center gap-12">
                <CountBlock label="팔로워" value={profile.followerCount} />
                <CountBlock label="팔로잉" value={profile.followingCount} />
              </div>

              <button
                type="button"
                className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white"
              >
                팔로우
              </button>
            </section>

            <section className="mt-7">
              <h2 className="text-sm font-medium text-[#999]">학습 관리</h2>
              <div className="mt-4 flex h-[4.5rem] items-center">
                <StudyStat
                  icon="/Question.svg"
                  value={profile.questionCount}
                  label="질문 수"
                />
                <StudyStat
                  icon="/Answer.svg"
                  value={profile.answerCount}
                  label="답변 수"
                  bordered
                />
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-medium text-[#999]">획득한 뱃지</h2>
              {visibleBadges.length > 0 ? (
                <div className="mt-5 flex gap-6">
                  {visibleBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex min-w-0 flex-col items-center text-center"
                    >
                      <img
                        src={badge.icon}
                        alt=""
                        className="h-[4.25rem] w-[4.25rem]"
                      />
                      <span className="mt-2 text-sm font-semibold text-[#222]">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#999]">
                  아직 획득한 뱃지가 없습니다.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
