"use client";

import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { type FC, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  GalleryVerticalEnd,
  Monitor,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { BottomNavbar, AlarmHeader } from "@/components/molecules";
import { AttendanceSummary } from "@/components/molecules/AttendanceSummary";
import { Toast } from "@/components/atoms";
import EntryButton from "@/app/(questionbank)/questionbank/_components/EntryButton";
import { useRouter } from "@/lib/navigation";
import { getValidAccessToken } from "@/lib/client/fetch";
import {
  ATTENDANCE_STORAGE_KEY,
  checkInAttendance,
  readAttendance,
  type AttendanceSnapshot,
} from "@/lib/client/attendance";
import {
  calculateDday,
  formatDday,
  getNextJanuaryFourthFridayDate,
} from "@/lib/shared/dday";

type DDayItem = {
  id: string;
  label: string;
  date: string;
  source?: "api" | "custom";
  description?: string;
  rawDate?: string;
  fetchedAt?: string;
};

type NewDdayDraft = {
  id: string;
  title: string;
  date: string;
  isConfirmed: boolean;
  ddayId?: string;
};

type NationalExamPayload = {
  fetchedAt: string;
  exam: {
    id: string;
    label: string;
    date: string;
    dDay: number | null;
    rawDate?: string;
    examName?: string;
    profession?: string;
    round?: number | null;
    year?: number | null;
  };
};

const DDAY_STORAGE_KEY = "yakchat:national-exam-date";
const DDAY_LIST_STORAGE_KEY = "yakchat:ddays";
const DDAY_ACTIVE_STORAGE_KEY = "yakchat:active-dday-id";
const NATIONAL_EXAM_CACHE_STORAGE_KEY = "yakchat:khp-national-exam-cache";
const NATIONAL_EXAM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NATIONAL_EXAM_RETRY_COOLDOWN_MS = 60 * 60 * 1000;
const PREVIOUS_DEFAULT_NATIONAL_EXAM_DATES = ["2027-01-15"];
const MAX_DDAY_TITLE_LENGTH = 10;

const DEFAULT_DDAYS: DDayItem[] = [
  {
    id: "guksi",
    label: "약사 국시",
    date: getNextJanuaryFourthFridayDate(),
  },
];

const createNewDdayDraft = (): NewDdayDraft => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  date: "",
  isConfirmed: false,
});

const trimTrailingNewDdayDrafts = (drafts: NewDdayDraft[]) => {
  let lastIndex = drafts.length - 1;

  while (
    lastIndex > 0 &&
    !drafts[lastIndex].title &&
    !drafts[lastIndex].date &&
    !drafts[lastIndex].isConfirmed
  ) {
    lastIndex -= 1;
  }

  return drafts.slice(0, lastIndex + 1);
};

const formatExamDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) return "시험일 미설정";

  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(
    2,
    "0",
  )}`;
};

const isUpcomingDate = (dateValue: string) => {
  const days = calculateDday(dateValue);
  return days !== null && days >= 0;
};

const buildNationalExamDday = (payload: NationalExamPayload): DDayItem => ({
  id: "guksi",
  label: payload.exam.label || "약사 국시",
  date: payload.exam.date,
  source: "api",
  description:
    payload.exam.examName ||
    [payload.exam.profession, payload.exam.round && `${payload.exam.round}회`]
      .filter(Boolean)
      .join(" "),
  rawDate: payload.exam.rawDate,
  fetchedAt: payload.fetchedAt,
});

const upsertNationalExamDday = (items: DDayItem[], exam: DDayItem) => [
  exam,
  ...items.filter((item) => item.id !== "guksi"),
];

const sanitizeNationalExamDday = (items: DDayItem[]) => {
  const nationalExam = items.find((item) => item.id === "guksi");
  const defaultNationalExam = DEFAULT_DDAYS[0];

  if (!nationalExam) {
    return upsertNationalExamDday(items, defaultNationalExam);
  }

  if (isUpcomingDate(nationalExam.date)) {
    if (
      !nationalExam.source &&
      PREVIOUS_DEFAULT_NATIONAL_EXAM_DATES.includes(nationalExam.date)
    ) {
      return upsertNationalExamDday(items, defaultNationalExam);
    }

    return items;
  }

  return upsertNationalExamDday(items, defaultNationalExam);
};

const readNationalExamCache = () => {
  try {
    const raw = window.localStorage.getItem(NATIONAL_EXAM_CACHE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      cachedAt?: number;
      failedAt?: number;
      payload?: NationalExamPayload;
    };

    if (!parsed.cachedAt && !parsed.failedAt) return null;

    const payload =
      parsed.payload?.exam?.date && isUpcomingDate(parsed.payload.exam.date)
        ? parsed.payload
        : null;

    return {
      payload,
      isFresh:
        !!payload &&
        !!parsed.cachedAt &&
        Date.now() - parsed.cachedAt < NATIONAL_EXAM_CACHE_TTL_MS,
      isRetryBlocked:
        !!parsed.failedAt &&
        Date.now() - parsed.failedAt < NATIONAL_EXAM_RETRY_COOLDOWN_MS,
    };
  } catch {
    return null;
  }
};

const writeNationalExamCache = (payload: NationalExamPayload) => {
  window.localStorage.setItem(
    NATIONAL_EXAM_CACHE_STORAGE_KEY,
    JSON.stringify({
      cachedAt: Date.now(),
      failedAt: null,
      payload,
    }),
  );
};

const markNationalExamCacheRefreshFailed = () => {
  try {
    const raw = window.localStorage.getItem(NATIONAL_EXAM_CACHE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    window.localStorage.setItem(
      NATIONAL_EXAM_CACHE_STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        failedAt: Date.now(),
      }),
    );
  } catch {
    window.localStorage.setItem(
      NATIONAL_EXAM_CACHE_STORAGE_KEY,
      JSON.stringify({ failedAt: Date.now() }),
    );
  }
};

const Home: FC = () => {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  // 출석 API 연결 전 UI 확인용 상태이며, 새로고침 시 초기화합니다.
  const [attendance, setAttendance] = useState<AttendanceSnapshot>({
    days: 0,
    completed: false,
  });
  const [isAttendanceReady, setIsAttendanceReady] = useState(false);
  const [isDdayReady, setIsDdayReady] = useState(false);
  const [ddays, setDdays] = useState<DDayItem[]>(DEFAULT_DDAYS);
  const [activeDdayId, setActiveDdayId] = useState(DEFAULT_DDAYS[0].id);
  const [isDdayEditorOpen, setIsDdayEditorOpen] = useState(false);
  const [newDdayDrafts, setNewDdayDrafts] = useState<NewDdayDraft[]>([
    { id: "draft-0", title: "", date: "", isConfirmed: false },
  ]);
  const [ddayToast, setDdayToast] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const ddayListRef = useRef<HTMLDivElement | null>(null);
  const newDdayDraftListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;

    const refreshAttendance = () => {
      const now = new Date();
      try {
        setAttendance(readAttendance(now));
      } catch {
        // Keep the current display; a check-in will report storage failures.
      } finally {
        setIsAttendanceReady(true);
      }

      clearTimeout(midnightTimer);
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      midnightTimer = setTimeout(
        refreshAttendance,
        midnight.getTime() - now.getTime() + 100,
      );
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === ATTENDANCE_STORAGE_KEY || event.key === null) {
        refreshAttendance();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshAttendance();
    };

    refreshAttendance();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshAttendance);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(midnightTimer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshAttendance);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValidAccessToken();
      setIsAuthenticated(!!token);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const legacyExamDate = window.localStorage.getItem(DDAY_STORAGE_KEY) ?? "";
    const savedDdays = window.localStorage.getItem(DDAY_LIST_STORAGE_KEY);
    const savedActiveId = window.localStorage.getItem(DDAY_ACTIVE_STORAGE_KEY);
    let nextDdays = DEFAULT_DDAYS;

    try {
      const parsed = savedDdays ? JSON.parse(savedDdays) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        nextDdays = parsed;
      } else if (legacyExamDate) {
        nextDdays = [
          { id: "guksi", label: "국시", date: legacyExamDate },
          ...DEFAULT_DDAYS.filter((item) => item.id !== "guksi"),
        ];
      }
    } catch {
      if (legacyExamDate) {
        nextDdays = [
          { id: "guksi", label: "국시", date: legacyExamDate },
          ...DEFAULT_DDAYS.filter((item) => item.id !== "guksi"),
        ];
      }
    }

    nextDdays = sanitizeNationalExamDday(nextDdays);

    const cachedNationalExam = readNationalExamCache();
    if (cachedNationalExam?.payload) {
      nextDdays = upsertNationalExamDday(
        nextDdays,
        buildNationalExamDday(cachedNationalExam.payload),
      );
    }

    setDdays(nextDdays);

    if (savedActiveId) {
      setActiveDdayId(savedActiveId);
    }

    setIsDdayReady(true);

    if (cachedNationalExam?.isFresh || cachedNationalExam?.isRetryBlocked) {
      return;
    }

    const controller = new AbortController();

    const fetchNationalExam = async () => {
      try {
        const response = await fetch("/api/exams/khp/dday", {
          signal: controller.signal,
        });

        if (!response.ok) {
          markNationalExamCacheRefreshFailed();
          return;
        }

        const payload = (await response.json()) as NationalExamPayload;
        if (!payload?.exam?.date || !isUpcomingDate(payload.exam.date)) {
          markNationalExamCacheRefreshFailed();
          return;
        }

        writeNationalExamCache(payload);
        setDdays((prev) =>
          upsertNationalExamDday(prev, buildNationalExamDday(payload)),
        );

        if (!savedActiveId) {
          setActiveDdayId("guksi");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          markNationalExamCacheRefreshFailed();
          console.error("약사 국시 D-Day 캐시 갱신 실패:", error);
        }
      }
    };

    void fetchNationalExam();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isDdayReady) return;

    window.localStorage.setItem(DDAY_LIST_STORAGE_KEY, JSON.stringify(ddays));
  }, [ddays, isDdayReady]);

  useEffect(() => {
    if (!isDdayReady) return;

    window.localStorage.setItem(DDAY_ACTIVE_STORAGE_KEY, activeDdayId);
  }, [activeDdayId, isDdayReady]);

  useEffect(() => {
    if (!isDdayEditorOpen || !ddayListRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      const list = ddayListRef.current;
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [ddays.length, isDdayEditorOpen]);

  useEffect(() => {
    if (!isDdayEditorOpen || !newDdayDraftListRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      const list = newDdayDraftListRef.current;
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [newDdayDrafts.length, isDdayEditorOpen]);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const showDdayToast = (message: string) => {
    setDdayToast((prev) => ({
      id: (prev?.id ?? 0) + 1,
      message,
    }));
  };

  const removeDdayById = (id: string) => {
    setDdays((prev) => {
      const next = prev.filter((item) => item.id !== id);

      if (activeDdayId === id) {
        setActiveDdayId(next[0]?.id ?? DEFAULT_DDAYS[0].id);
      }

      return next.length > 0 ? next : DEFAULT_DDAYS;
    });
  };

  const handleNewDdayDraftTitleChange = (draftId: string, title: string) => {
    const draft = newDdayDrafts.find((item) => item.id === draftId);
    const nextTitle = title.slice(0, MAX_DDAY_TITLE_LENGTH);

    if (draft?.ddayId) {
      removeDdayById(draft.ddayId);
    }

    setNewDdayDrafts((prev) =>
      trimTrailingNewDdayDrafts(
        prev.map((item) =>
          item.id === draftId
            ? {
                ...item,
                title: nextTitle,
                isConfirmed: false,
                ddayId: undefined,
              }
            : item,
        ),
      ),
    );
  };

  const handleNewDdayDraftDateChange = (draftId: string, date: string) => {
    const draft = newDdayDrafts.find((item) => item.id === draftId);

    if (draft?.ddayId) {
      removeDdayById(draft.ddayId);
    }

    setNewDdayDrafts((prev) =>
      trimTrailingNewDdayDrafts(
        prev.map((item) =>
          item.id === draftId
            ? { ...item, date, isConfirmed: false, ddayId: undefined }
            : item,
        ),
      ),
    );
  };

  const handleAddNewDdayDraft = (draftId: string) => {
    const draft = newDdayDrafts.find((item) => item.id === draftId);
    if (!draft) return;

    const label = (draft.title ?? "").trim();
    if (!label || !draft.date) return;

    const nextDdayId = `custom-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const nextDday = {
      id: nextDdayId,
      label,
      date: draft.date,
      source: "custom" as const,
    };

    setDdays((prev) => [...prev, nextDday]);
    showDdayToast("일정이 추가되었습니다!");
    setNewDdayDrafts([createNewDdayDraft()]);
  };

  const handleRemoveDday = (id: string) => {
    removeDdayById(id);
    setNewDdayDrafts((prev) => {
      const next = prev.filter((item) => item.ddayId !== id);

      return next.length > 0
        ? trimTrailingNewDdayDrafts(next)
        : [createNewDdayDraft()];
    });
  };

  const activeDday = useMemo(() => {
    return ddays.find((item) => item.id === activeDdayId) ?? ddays[0];
  }, [activeDdayId, ddays]);

  const dday = useMemo(() => {
    if (!activeDday) return null;
    return calculateDday(activeDday.date);
  }, [activeDday]);

  if (isAuthenticated === null) {
    return <LoadingIndicator label="불러오는 중..." />;
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if ("showPicker" in e.currentTarget) {
      e.currentTarget.showPicker();
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <AlarmHeader />

      <main className="flex-1 pb-[var(--bottom-nav-height)] pt-3">
        <section className="px-5 md:px-10" aria-label="국가고시 D-Day">
          <button
            type="button"
            onClick={() => setIsDdayEditorOpen(true)}
            aria-label={`${activeDday?.label ?? "국시"}, ${isDdayReady ? formatDday(dday) : "D-Day 계산 중"}, D-Day 관리 열기`}
            className="flex min-h-20 w-full items-center justify-between gap-4 bg-transparent px-1 py-3 text-left transition-opacity active:opacity-70 focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex min-w-0 flex-1 items-baseline gap-2">
              <span className="truncate text-base font-semibold leading-6 text-foreground">
                {activeDday?.label ?? "국시"}
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs leading-5 text-muted-foreground">
                {activeDday ? formatExamDate(activeDday.date) : "날짜 미설정"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-[1.75rem] font-bold tabular-nums leading-none tracking-tight text-primary">
                {isDdayReady ? formatDday(dday) : "–"}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={1.6}
              />
            </span>
          </button>
        </section>

        <AttendanceSummary
          days={attendance.days}
          completed={attendance.completed}
          pending={!isAttendanceReady}
          onCheckIn={() => {
            try {
              setAttendance(checkInAttendance());
            } catch {
              showDdayToast("출석을 저장하지 못했어요. 다시 시도해 주세요.");
            }
          }}
        />

        <section className="mt-6 px-5 md:px-10" aria-label="학습 메뉴">
          <div className="flex flex-col gap-4">
            <EntryButton
              compact
              icon={<GalleryVerticalEnd className="h-7 w-7 text-primary" />}
              title="AI 플래시카드"
              subtitle="취약 개념을 반복해서 복습하는 학습 루틴"
              onClick={() => router.push("/flashcards")}
            />

            <EntryButton
              compact
              icon={<Monitor className="h-7 w-7 text-primary" />}
              title="CBT 형태로 학습하기"
              subtitle="국가시험과 같은 시간·답안 환경에서 연습해요"
              onClick={() => router.push("/learning/cbt")}
            />

            <EntryButton
              compact
              icon={<BadgeCheck className="h-7 w-7 text-primary" />}
              title="수제 제작 문제"
              subtitle="전문가가 직접 만들고 검수한 문제를 풀어요"
              onClick={() => router.push("/questionbank/handcrafted")}
            />

            <EntryButton
              compact
              icon={<Sparkles className="h-7 w-7 text-primary" />}
              title="AI 문제 생성"
              subtitle="내 학습자료와 설정을 바탕으로 문제를 만들어요"
              onClick={() => router.push("/questionbank/premium")}
            />

            <EntryButton
              compact
              icon={<RotateCcw className="h-7 w-7 text-primary" />}
              title="복습하기"
              subtitle="CBT·수제 제작·AI 생성 문제의 오답을 모아 복습해요"
              onClick={() => router.push("/questionbank/review")}
            />
          </div>
        </section>

        {isDdayEditorOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end bg-foreground/40"
            onClick={() => setIsDdayEditorOpen(false)}
          >
            <div
              className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-app flex-col rounded-t-2xl bg-card p-5 md:max-w-[40rem]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-headline-small text-foreground">
                  D-Day 관리
                </h2>
              </div>

              <div
                ref={ddayListRef}
                className="mt-4 max-h-[12rem] space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-[14rem]"
              >
                {ddays.map((item) => {
                  const isActive = item.id === activeDdayId;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        isActive
                          ? "border-primary bg-primary-980"
                          : "border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1 text-left">
                        <p
                          className={`text-title-small ${
                            isActive
                              ? "text-primary-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p
                          className={`mt-1 text-body-small ${
                            isActive
                              ? "text-primary-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatExamDate(item.date)} ·{" "}
                          {formatDday(calculateDday(item.date))}
                          {item.source === "api" ? " · 공식 API" : ""}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        {item.source === "api" && (
                          <span className="rounded-full bg-white px-2 py-1 text-label-small font-medium text-primary">
                            공식
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveDdayId(item.id)}
                          aria-pressed={isActive}
                          className={`shrink-0 text-label-small font-semibold ${
                            isActive
                              ? "text-primary-800"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isActive ? "대표로 설정됨" : "대표설정"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDday(item.id)}
                          className="shrink-0 text-label-medium text-muted-foreground"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg bg-primary-980 p-3">
                <p className="text-label-medium text-muted-foreground">
                  새 D-Day 추가
                </p>
                <div
                  ref={newDdayDraftListRef}
                  className="mt-2 max-h-[13.5rem] space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-[16rem]"
                >
                  {newDdayDrafts.map((draft) => {
                    const canAddDraft = Boolean(
                      (draft.title ?? "").trim() && draft.date,
                    );

                    return (
                      <div
                        key={draft.id}
                        className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary-800 min-[360px]:grid-cols-[minmax(5rem,0.7fr)_minmax(7.5rem,1fr)_2.25rem] min-[360px]:gap-y-0"
                      >
                        <input
                          type="text"
                          value={draft.title ?? ""}
                          maxLength={MAX_DDAY_TITLE_LENGTH}
                          onChange={(event) =>
                            handleNewDdayDraftTitleChange(
                              draft.id,
                              event.target.value,
                            )
                          }
                          placeholder="제목(최대 10자)"
                          aria-label="D-Day 제목"
                          className="col-start-1 row-start-1 h-7 min-w-0 border-b border-border bg-transparent pb-1 text-body-medium text-foreground outline-none placeholder:text-muted-foreground min-[360px]:border-b-0 min-[360px]:border-r min-[360px]:pb-0 min-[360px]:pr-2"
                        />
                        <div className="col-start-1 row-start-2 flex min-w-0 items-center gap-2 min-[360px]:col-start-2 min-[360px]:row-start-1">
                          <img
                            src={PUBLIC_ASSETS.icons.calendar}
                            width={20}
                            alt=""
                          />
                          <input
                            type="date"
                            onClick={(event) => handleClick(event)}
                            value={draft.date}
                            onChange={(event) =>
                              handleNewDdayDraftDateChange(
                                draft.id,
                                event.target.value,
                              )
                            }
                            onInput={(event) =>
                              handleNewDdayDraftDateChange(
                                draft.id,
                                event.currentTarget.value,
                              )
                            }
                            aria-label="D-Day 날짜"
                            className="h-7 min-w-0 flex-1 bg-transparent text-body-medium text-foreground outline-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                          />
                        </div>
                        <div className="col-start-2 row-span-2 row-start-1 flex h-6 w-9 shrink-0 items-center justify-center min-[360px]:col-start-3 min-[360px]:row-span-1">
                          {canAddDraft && (
                            <button
                              type="button"
                              onClick={() => handleAddNewDdayDraft(draft.id)}
                              aria-label="D-Day 추가"
                              className="flex h-6 w-9 items-center justify-center rounded-xl text-label-small font-semibold text-primary active:scale-[0.98]"
                            >
                              추가
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDdayEditorOpen(false)}
                className="mt-3 h-[3.625rem] w-full rounded-xl bg-primary-600 text-label-large text-background active:scale-[0.98]"
              >
                완료
              </button>
            </div>
          </div>
        )}
      </main>

      <Toast
        open={!!ddayToast}
        message={ddayToast?.message ?? ""}
        toastKey={ddayToast?.id}
        onClose={() => setDdayToast(null)}
      />

      <BottomNavbar />
    </div>
  );
};

export default Home;
