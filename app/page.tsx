"use client";

import {
  type CSSProperties,
  type FC,
  Fragment,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Flame,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import {
  BottomNavbar,
  AlarmHeader,
  QuestionListCard,
} from "@/components/molecules";
import { Toast } from "@/components/atoms";
import { useRouter } from "@/lib/navigation";
import { getValidAccessToken } from "@/lib/client/fetch";
import {
  buildFileUrlMap,
  getFileKey,
  isPdfFileKey,
} from "@/lib/shared/filePreview";
import { formatDiffDate } from "@/lib/shared/date";
import {
  getRememberedBoardViewCounts,
  markBoardViewIntent,
} from "@/lib/client/boardView";
import { getCurrentUserInfo } from "@/lib/client/auth";
import {
  calculateDday,
  formatDday,
  getNextJanuaryFourthFridayDate,
} from "@/lib/shared/dday";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useBoardsQuery,
  useFilesQuery,
  useMaterialsQuery,
} from "@/hooks/queries";

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

type StudyCelebrationParticle = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  delay: number;
  color: string;
  shape: "dot" | "pill" | "square";
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
const STUDY_CERT_STORAGE_KEY = "yakchat:study-certified-date";
const STUDY_COUNT_STORAGE_KEY = "yakchat:study-count";
const NATIONAL_EXAM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NATIONAL_EXAM_RETRY_COOLDOWN_MS = 60 * 60 * 1000;
const PREVIOUS_DEFAULT_NATIONAL_EXAM_DATES = ["2027-01-15"];
const MAX_DDAY_TITLE_LENGTH = 10;
const STUDY_CELEBRATION_COLORS = [
  "#FF412E",
  "#FFD166",
  "#06D6A0",
  "#118AB2",
  "#FFFFFF",
];

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

const STUDY_CELEBRATION_PARTICLES: StudyCelebrationParticle[] = Array.from(
  { length: 28 },
  (_, index) => {
    const angle = (index / 28) * Math.PI * 2;
    const distance = 42 + (index % 5) * 9;
    const size = 5 + (index % 4);
    const shape = index % 7 === 0 ? "pill" : index % 5 === 0 ? "square" : "dot";

    return {
      id: index,
      x: Math.round(Math.cos(angle) * distance),
      y: Math.round(Math.sin(angle) * distance),
      width: shape === "pill" ? size * 2 : size,
      height: shape === "pill" ? Math.max(3, size - 2) : size,
      rotate: (index * 37) % 180,
      delay: (index % 6) * 16,
      color: STUDY_CELEBRATION_COLORS[index % STUDY_CELEBRATION_COLORS.length],
      shape,
    };
  },
);

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

const todayKey = () => new Date().toISOString().slice(0, 10);

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

const getBoardCategoryText = (item: any) =>
  String(item?.category ?? item?.categoryName ?? item?.boardType ?? "").trim();

const hasCategoryAlias = (item: any, aliases: string[]) => {
  const category = getBoardCategoryText(item);
  if (!category) return false;
  return aliases.some(
    (alias) => category === alias || category.includes(alias),
  );
};

const isFreeBoard = (item: any) => {
  const category = getBoardCategoryText(item);
  if (!category) return true;
  return hasCategoryAlias(item, ["FREE", "자유", "자유게시판"]);
};

const getCommentCount = (item: any) =>
  item?.answerCount ??
  item?.commentCount ??
  item?.commentsCount ??
  item?.replyCount ??
  item?.repliesCount ??
  0;

const getMaterialList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

const getMaterialPrice = (item: any) =>
  Number(item?.price ?? item?.amount ?? item?.cost ?? 0);

const HomeSection: FC<{
  title: string;
  subtitle?: string;
  href: string;
  children: ReactNode;
}> = ({ title, subtitle, href, children }) => (
  <section className="px-6 pb-7">
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-headline-small text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-body-small text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-0.5 text-label-medium text-primary"
      >
        더보기
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
    {children}
  </section>
);

const StudyCelebrationParticles: FC<{ burstId: number }> = ({ burstId }) => {
  if (burstId === 0) return null;

  return (
    <div
      key={burstId}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-visible motion-reduce:hidden"
    >
      <span className="absolute left-1/2 top-1/2 h-9 w-9 animate-study-celebration-ring rounded-full border-2 border-primary/30 bg-primary/10" />
      {STUDY_CELEBRATION_PARTICLES.map((particle) => {
        const style = {
          "--particle-x": `${particle.x}px`,
          "--particle-y": `${particle.y}px`,
          "--particle-rotate": `${particle.rotate}deg`,
          width: `${particle.width}px`,
          height: `${particle.height}px`,
          backgroundColor: particle.color,
          animationDelay: `${particle.delay}ms`,
          boxShadow: `0 0 8px ${particle.color}`,
        } as CSSProperties;
        const shapeClassName =
          particle.shape === "square" ? "rounded-[2px]" : "rounded-full";

        return (
          <span
            key={particle.id}
            className={`absolute left-1/2 top-1/2 animate-study-particle-burst opacity-0 ${shapeClassName}`}
            style={style}
          />
        );
      })}
    </div>
  );
};

const Home: FC = () => {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isDdayReady, setIsDdayReady] = useState(false);
  const [ddays, setDdays] = useState<DDayItem[]>(DEFAULT_DDAYS);
  const [activeDdayId, setActiveDdayId] = useState(DEFAULT_DDAYS[0].id);
  const [isDdayEditorOpen, setIsDdayEditorOpen] = useState(false);
  const [newDdayDrafts, setNewDdayDrafts] = useState<NewDdayDraft[]>([
    { id: "draft-0", title: "", date: "", isConfirmed: false },
  ]);
  const [studyCount, setStudyCount] = useState(0);
  const [isStudyCertified, setIsStudyCertified] = useState(false);
  const [studyCelebrationBurstId, setStudyCelebrationBurstId] = useState(0);
  const [ddayToastMessage, setDdayToastMessage] = useState<string | null>(null);
  const [viewCountOverrides, setViewCountOverrides] = useState<
    Record<string, number>
  >({});
  const userInfo = getCurrentUserInfo();

  const {
    data: boards,
    isLoading: isBoardsLoading,
    isError: isBoardsError,
    refetch: refetchBoards,
  } = useBoardsQuery("latest", {
    enabled: isAuthenticated === true,
  });
  const { data: materialsData, isLoading: isMaterialsLoading } =
    useMaterialsQuery({
      enabled: isAuthenticated === true,
    });

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
    const savedStudyDate = window.localStorage.getItem(STUDY_CERT_STORAGE_KEY);
    const savedStudyCount = window.localStorage.getItem(
      STUDY_COUNT_STORAGE_KEY,
    );

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

    if (savedStudyCount && !Number.isNaN(Number(savedStudyCount))) {
      setStudyCount(Number(savedStudyCount));
    }

    setIsStudyCertified(savedStudyDate === todayKey());
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
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const syncRememberedViewCounts = () => {
      setViewCountOverrides(getRememberedBoardViewCounts());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncRememberedViewCounts();
      }
    };

    syncRememberedViewCounts();
    window.addEventListener("pageshow", syncRememberedViewCounts);
    window.addEventListener("popstate", syncRememberedViewCounts);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", syncRememberedViewCounts);
      window.removeEventListener("popstate", syncRememberedViewCounts);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleBoardClick = (boardId: string) => {
    markBoardViewIntent(boardId);
    router.push(`/board/${boardId}`);
  };

  const handleCertifyStudy = () => {
    if (isStudyCertified) return;

    const nextCount = studyCount + 1;
    setStudyCelebrationBurstId((prev) => prev + 1);
    setIsStudyCertified(true);
    setStudyCount(nextCount);
    window.localStorage.setItem(STUDY_CERT_STORAGE_KEY, todayKey());
    window.localStorage.setItem(STUDY_COUNT_STORAGE_KEY, String(nextCount));
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

  const handleToggleNewDdayDraft = (draftId: string) => {
    const draft = newDdayDrafts.find((item) => item.id === draftId);
    if (!draft) return;

    if (draft.isConfirmed) {
      if (draft.ddayId) {
        removeDdayById(draft.ddayId);
      }

      setNewDdayDrafts((prev) =>
        trimTrailingNewDdayDrafts(
          prev.map((item) =>
            item.id === draftId
              ? { ...item, isConfirmed: false, ddayId: undefined }
              : item,
          ),
        ),
      );
      setDdayToastMessage("일정이 삭제되었습니다!");
      return;
    }

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
    setActiveDdayId(nextDdayId);
    setDdayToastMessage("일정이 추가되었습니다!");
    setNewDdayDrafts((prev) => {
      const draftIndex = prev.findIndex((item) => item.id === draftId);
      const next = prev.map((item) =>
        item.id === draftId
          ? { ...item, isConfirmed: true, ddayId: nextDdayId }
          : item,
      );
      const hasBlankDraftAfter = next
        .slice(draftIndex + 1)
        .some((item) => !item.title && !item.date && !item.isConfirmed);

      return hasBlankDraftAfter ? next : [...next, createNewDdayDraft()];
    });
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

  const getPreviewBoards = (kind: "free" | "tips" | "reviews") => {
    const aliases = {
      free: [],
      tips: ["TIP", "TIPS", "꿀팁", "꿀팁게시판", "꿀팁 게시판"],
      reviews: ["REVIEW", "REVIEWS", "후기", "후기게시판", "후기 게시판"],
    }[kind];

    if (kind === "free") {
      return rawBoardList.filter(isFreeBoard).slice(0, 3);
    }

    return rawBoardList
      .filter((item: any) => hasCategoryAlias(item, aliases))
      .slice(0, 3);
  };

  const rawBoardList = useMemo(() => {
    if (Array.isArray(boards)) return boards;
    if (Array.isArray(boards?.data)) return boards.data;
    return [];
  }, [boards]);

  const materialPreviewItems = useMemo(
    () => getMaterialList(materialsData).slice(0, 4),
    [materialsData],
  );

  const boardList = useMemo(() => {
    return [...rawBoardList]
      .sort((a: any, b: any) => {
        const left = new Date(a?.createdAt ?? 0).getTime();
        const right = new Date(b?.createdAt ?? 0).getTime();
        return right - left;
      })
      .slice(0, 3);
  }, [rawBoardList]);

  const freePreviewBoards = useMemo(
    () => getPreviewBoards("free"),
    [rawBoardList],
  );
  const tipsPreviewBoards = useMemo(
    () => getPreviewBoards("tips"),
    [rawBoardList],
  );
  const reviewPreviewBoards = useMemo(
    () => getPreviewBoards("reviews"),
    [rawBoardList],
  );

  const boardPreviewItems = useMemo(
    () => [
      ...freePreviewBoards,
      ...tipsPreviewBoards,
      ...reviewPreviewBoards,
      ...boardList,
    ],
    [boardList, freePreviewBoards, tipsPreviewBoards, reviewPreviewBoards],
  );

  const boardImageKeys = useMemo(() => {
    return [
      ...new Set(
        boardPreviewItems.flatMap((item: any) =>
          Array.isArray(item?.images)
            ? item.images
                .map((image: any) => getFileKey(image))
                .filter(Boolean)
                .filter((key: string) => !isPdfFileKey(key))
            : [],
        ),
      ),
    ];
  }, [boardPreviewItems]);

  const { data: boardFilesData } = useFilesQuery({
    keys: isAuthenticated === true ? boardImageKeys : [],
  });

  const boardImageUrlMap = useMemo(
    () => buildFileUrlMap(boardImageKeys, boardFilesData),
    [boardFilesData, boardImageKeys],
  );

  const renderBoardPreviewRows = (items: any[], emptyText: string) => {
    if (isBoardsLoading) {
      return (
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-20 rounded-lg bg-primary-980" />
            </div>
          ))}
        </div>
      );
    }

    if (isBoardsError) {
      return (
        <Card className="p-5 text-center">
          <p className="mb-3 text-body-medium text-muted-foreground">
            게시글을 불러오지 못했습니다
          </p>
          <button
            type="button"
            onClick={() => void refetchBoards()}
            className="text-label-medium text-primary hover:text-primary-800"
          >
            다시 시도
          </button>
        </Card>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-body-medium text-muted-foreground">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((board: any, index: number) => {
          const imageKeys = Array.isArray(board?.images)
            ? board.images
                .map((image: any) => getFileKey(image))
                .filter(Boolean)
                .filter((key: string) => !isPdfFileKey(key))
            : [];

          const imageUrls = imageKeys
            .map((key: string) => boardImageUrlMap[key])
            .filter(Boolean);

          const cardData = {
            ...board,
            viewCount: Math.max(
              Number(board?.viewCount ?? 0),
              viewCountOverrides[String(board?.id ?? "")] ?? 0,
            ),
            userNickname: board?.userNickname ?? board?.nickname ?? "익명",
            subjectName: board?.subjectName ?? board?.categoryName ?? "",
            answerCount: getCommentCount(board),
            createdAt: formatDiffDate(board?.createdAt),
            images: imageUrls,
          };

          return (
            <Fragment key={board.id}>
              <QuestionListCard
                question={cardData}
                onClick={() => handleBoardClick(String(board.id))}
              />
              {index < items.length - 1 && <Separator className="mt-4" />}
            </Fragment>
          );
        })}
      </div>
    );
  };

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-white">
      <AlarmHeader />

      <main className="flex-1 pb-24 pt-4">
        <section className="px-6 pb-6" aria-label="국가고시 D-Day">
          <div className="overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-[0_16px_36px_rgba(255,65,46,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-label-medium text-primary-foreground/90">
                  <Flame
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    strokeWidth={1.5}
                  />
                  {activeDday?.label ?? "국시"} 카운트다운
                </div>
                <div className="mt-2 text-headline-large text-primary-foreground">
                  {isDdayReady ? formatDday(dday) : "-"}
                </div>
                <p className="mt-2 text-body-small text-primary-foreground/90">
                  {activeDday ? formatExamDate(activeDday.date) : "계산 중"} ·
                  {activeDday?.source === "api"
                    ? "국시원 API 기준"
                    : "직접 설정"}{" "}
                  · 현재 <b>{studyCount.toLocaleString("ko-KR")}명</b>의
                  동기들이 열공 중🔥
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDdayEditorOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-primary-foreground active:scale-95"
                aria-label="D-Day 편집"
              >
                <Pencil
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.5}
                />
              </button>
            </div>

            <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ddays.map((item) => {
                const days = calculateDday(item.date);
                const isActive = item.id === activeDdayId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveDdayId(item.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-label-small ${
                      isActive
                        ? "bg-white text-primary"
                        : "bg-white/15 text-primary-foreground"
                    }`}
                  >
                    {item.label}{" "}
                    <span
                      className={isActive ? "text-primary/70" : "opacity-70"}
                    >
                      {formatDday(days)}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsDdayEditorOpen(true)}
                className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-label-small text-primary-foreground"
                aria-label="D-Day 추가"
              >
                <Plus
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  strokeWidth={1.5}
                />
              </button>
            </div>

            <div className="relative mt-4">
              <StudyCelebrationParticles burstId={studyCelebrationBurstId} />
              <button
                type="button"
                onClick={handleCertifyStudy}
                className="flex h-12 w-full items-center justify-center gap-0 rounded-xl bg-white text-label-large text-primary active:scale-[0.98]"
              >
                {isStudyCertified ? (
                  <>
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-8 w-8"
                      strokeWidth={1.5}
                    />
                    오늘도 인증 완료
                  </>
                ) : (
                  "오늘도 공부 인증하기"
                )}
              </button>
            </div>
          </div>
        </section>

        <HomeSection
          title="내 노력엔 정당한 가치"
          subtitle="밤새워 만든 고퀄리티 전공 요약본"
          href="/market"
        >
          {isMaterialsLoading ? (
            <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-1">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-40 w-40 shrink-0 animate-pulse rounded-lg bg-primary-980"
                />
              ))}
            </div>
          ) : materialPreviewItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-body-medium text-muted-foreground">
              등록된 자료가 없습니다.
            </div>
          ) : (
            <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {materialPreviewItems.map((item: any) => {
                const price = getMaterialPrice(item);
                const title = item?.title ?? "제목 없음";
                const subject =
                  item?.subjectName ??
                  item?.subject?.name ??
                  item?.category ??
                  "";

                return (
                  <Link
                    key={item.id}
                    href={`/materials/${item.id}`}
                    className="w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-card active:scale-[0.98]"
                  >
                    <div className="flex h-24 items-center justify-center bg-primary-980 px-3 text-center text-title-small text-primary">
                      자료
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="truncate text-label-small font-medium text-brand">
                        {subject || "학습자료"}
                      </p>
                      <p className="mt-1 line-clamp-1 text-label-medium text-foreground">
                        {title}
                      </p>
                      <p className="mt-1 text-label-medium font-semibold text-primary">
                        {price > 0
                          ? `${price.toLocaleString("ko-KR")}원`
                          : "무료"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </HomeSection>

        <HomeSection
          title="야매 팁으로 외우는 약물학"
          subtitle="기발한 암기법 모음"
          href="/tips"
        >
          {renderBoardPreviewRows(
            tipsPreviewBoards,
            "아직 올라온 꿀팁 게시글이 없습니다.",
          )}
        </HomeSection>

        <HomeSection
          title="자유 게시판"
          subtitle="동기들과 자유롭게 나누는 이야기"
          href="/board"
        >
          {renderBoardPreviewRows(
            freePreviewBoards,
            "아직 올라온 자유 게시글이 없습니다.",
          )}
        </HomeSection>

        <HomeSection
          title="실습 가기 전, 날 것의 후기부터"
          subtitle="익명으로 안전하게"
          href="/reviews"
        >
          {renderBoardPreviewRows(
            reviewPreviewBoards,
            "아직 올라온 후기 게시글이 없습니다.",
          )}
        </HomeSection>

        {isDdayEditorOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end bg-foreground/40"
            onClick={() => setIsDdayEditorOpen(false)}
          >
            <div
              className="mx-auto w-full max-w-app rounded-t-2xl bg-card p-5 md:max-w-[40rem]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-headline-small text-foreground">
                  D-Day 관리
                </h2>
                <button
                  type="button"
                  onClick={() => setIsDdayEditorOpen(false)}
                  aria-label="닫기"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-980 text-muted-foreground"
                >
                  <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
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
                      <button
                        type="button"
                        onClick={() => setActiveDdayId(item.id)}
                        aria-pressed={isActive}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-title-small text-foreground">
                          {item.label}
                        </p>
                        <p className="mt-1 text-body-small text-muted-foreground">
                          {formatExamDate(item.date)} ·{" "}
                          {formatDday(calculateDday(item.date))}
                          {item.source === "api" ? " · 공식 API" : ""}
                        </p>
                      </button>
                      {item.source === "api" ? (
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-label-small font-medium text-primary">
                          공식
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveDday(item.id)}
                          className="shrink-0 text-label-medium text-muted-foreground"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg bg-primary-980 p-3">
                <p className="text-label-medium text-muted-foreground">
                  새 D-Day 추가
                </p>
                <div className="mt-2 space-y-2">
                  {newDdayDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`grid grid-cols-[minmax(5rem,0.7fr)_minmax(7.5rem,1fr)_1.75rem] items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors ${
                        draft.isConfirmed
                          ? "border-primary"
                          : "border-border focus-within:border-primary-800"
                      }`}
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
                        placeholder="제목(10자)"
                        aria-label="D-Day 제목"
                        className="h-7 min-w-0 border-r border-border bg-transparent pr-2 text-body-medium text-foreground outline-none placeholder:text-muted-foreground"
                      />
                      <div className="flex min-w-0 items-center gap-2">
                        <CalendarDays
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                        />
                        <input
                          type="date"
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
                          className="h-7 min-w-0 flex-1 bg-transparent text-body-medium text-foreground outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleNewDdayDraft(draft.id)}
                        disabled={
                          (!(draft.title ?? "").trim() || !draft.date) &&
                          !draft.isConfirmed
                        }
                        aria-label={
                          draft.isConfirmed ? "D-Day 비활성화" : "D-Day 추가"
                        }
                        aria-pressed={draft.isConfirmed}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                          draft.isConfirmed
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary-980 text-muted-foreground disabled:opacity-40"
                        }`}
                      >
                        <Check
                          aria-hidden="true"
                          className="h-4 w-4"
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDdayEditorOpen(false)}
                className="mt-3 h-[3.625rem] w-full rounded-xl bg-foreground text-label-large text-background active:scale-[0.98]"
              >
                완료
              </button>
            </div>
          </div>
        )}
      </main>

      <Toast
        open={!!ddayToastMessage}
        message={ddayToastMessage ?? ""}
        onClose={() => setDdayToastMessage(null)}
      />

      <BottomNavbar />
    </div>
  );
};

export default Home;
