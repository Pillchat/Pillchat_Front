"use client";

import { FC, Fragment, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  MessageCircle,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";
import {
  BottomNavbar,
  AlarmHeader,
  QuestionListCard,
} from "@/components/molecules";
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
import { Card, CardContent } from "@/components/ui/card";
import { QuestionWithBubble } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useBoardsQuery, useFilesQuery } from "@/hooks/queries";

const DDAY_STORAGE_KEY = "yakchat:national-exam-date";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const calculateDday = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) return null;

  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.UTC(year, month - 1, day);

  return Math.ceil((target - today) / MS_PER_DAY);
};

const formatDday = (days: number | null) => {
  if (days === null) return "미설정";
  if (days === 0) return "D-Day";
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
};

const formatExamDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) return "시험일 미설정";

  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(
    2,
    "0",
  )}`;
};

const quickLinks = [
  {
    label: "자료마켓",
    description: "요약 노트와 문제집",
    href: "/market",
    icon: ShoppingBag,
  },
  {
    label: "학습",
    description: "문제은행과 AI 생성",
    href: "/learn",
    icon: GraduationCap,
  },
  {
    label: "꿀팁",
    description: "시험과 실습 노하우",
    href: "/tips",
    icon: BookOpenCheck,
  },
  {
    label: "자유",
    description: "약대생 이야기",
    href: "/board",
    icon: MessageCircle,
  },
  {
    label: "후기",
    description: "강의와 자료 후기",
    href: "/reviews",
    icon: Star,
  },
];

const Home: FC = () => {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isDdayReady, setIsDdayReady] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [draftExamDate, setDraftExamDate] = useState("");
  const [viewCountOverrides, setViewCountOverrides] = useState<
    Record<string, number>
  >({});
  const userInfo = getCurrentUserInfo();

  const {
    data: boards,
    isLoading: isBoardsLoading,
    isError: isBoardsError,
    refetch: refetchBoards,
  } = useBoardsQuery("best", {
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
    const savedExamDate = window.localStorage.getItem(DDAY_STORAGE_KEY) ?? "";

    setExamDate(savedExamDate);
    setDraftExamDate(savedExamDate);
    setIsDdayReady(true);
  }, []);

  // TODO: 임시로 미로그인 사용자도 홈 화면에 접근 가능하게 둔다.
  // useEffect(() => {
  //   if (isAuthenticated === false) {
  //     router.replace("/login");
  //   }
  // }, [isAuthenticated, router]);

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

  const handleAskQuestion = () => {
    router.push("/ask");
  };

  const handleViewAllBoards = () => {
    router.push("/board");
  };

  const handleBoardClick = (boardId: string) => {
    markBoardViewIntent(boardId);
    router.push(`/board/${boardId}`);
  };

  const handleSaveExamDate = () => {
    const nextExamDate = draftExamDate.trim();

    if (nextExamDate) {
      window.localStorage.setItem(DDAY_STORAGE_KEY, nextExamDate);
    } else {
      window.localStorage.removeItem(DDAY_STORAGE_KEY);
    }

    setExamDate(nextExamDate);
  };

  const dday = useMemo(() => calculateDday(examDate), [examDate]);

  const rawBoardList = useMemo(() => {
    if (Array.isArray(boards)) return boards;
    if (Array.isArray(boards?.data)) return boards.data;
    return [];
  }, [boards]);

  const boardList = useMemo(() => {
    return [...rawBoardList]
      .sort((a: any, b: any) => (b?.likeCount ?? 0) - (a?.likeCount ?? 0))
      .slice(0, 3);
  }, [rawBoardList]);

  const getCommentCount = (item: any) =>
    item?.answerCount ??
    item?.commentCount ??
    item?.commentsCount ??
    item?.replyCount ??
    item?.repliesCount ??
    0;

  const boardImageKeys = useMemo(() => {
    return [
      ...new Set(
        boardList.flatMap((item: any) =>
          Array.isArray(item?.images)
            ? item.images
                .map((image: any) => getFileKey(image))
                .filter(Boolean)
                .filter((key: string) => !isPdfFileKey(key))
            : [],
        ),
      ),
    ];
  }, [boardList]);

  const { data: boardFilesData } = useFilesQuery({
    keys: isAuthenticated === true ? boardImageKeys : [],
  });

  const boardImageUrlMap = useMemo(
    () => buildFileUrlMap(boardImageKeys, boardFilesData),
    [boardFilesData, boardImageKeys],
  );

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AlarmHeader />

      <main className="flex-1 pb-24 pt-4">
        <div className="mb-6 gap-2">
          <Carousel className="w-full">
            <CarouselContent>
              <CarouselItem>
                <Card
                  className="cursor-pointer border-primary-900 bg-primary-980 transition-shadow hover:shadow-md"
                  onClick={handleViewAllBoards}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="mb-2 text-xl font-bold text-foreground">
                          게시판 둘러보기
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          인기 게시글과 다양한 글을 확인하기
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <MessageCircle
                            aria-hidden="true"
                            className="h-6 w-6"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem>
                <Card
                  className="cursor-pointer border-border bg-card transition-shadow hover:shadow-md"
                  onClick={() => router.push("/archive")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="mb-2 text-xl font-bold text-foreground">
                          내 활동 확인하기
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          내가 작성한 게시글과 오답노트 관리하기
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-brand">
                          <UserRound aria-hidden="true" className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>

        <div className="px-6 py-5">
          <h2 className="mb-2 text-xl font-bold text-foreground">
            안녕하세요, {userInfo?.username}님!
          </h2>
          <h2 className="mb-2 text-xl font-bold text-foreground">
            오늘도 필챗과 함께하고 계세요!
          </h2>
        </div>

        <section className="px-6 pb-6" aria-label="국가고시 D-Day">
          <div className="rounded-lg border border-primary-900 bg-primary-980 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
                  <CalendarDays aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    국가고시 D-Day
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isDdayReady ? formatExamDate(examDate) : "계산 중"}
                  </p>
                </div>
              </div>
              <strong className="shrink-0 text-2xl font-bold text-primary">
                {isDdayReady ? formatDday(dday) : "-"}
              </strong>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="date"
                value={draftExamDate}
                onChange={(event) => setDraftExamDate(event.target.value)}
                aria-label="국가고시 날짜"
                className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-foreground outline-none focus:border-primary-800"
              />
              <button
                type="button"
                onClick={handleSaveExamDate}
                disabled={!isDdayReady}
                className="h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                저장
              </button>
            </div>
          </div>
        </section>

        <section className="px-6 pb-6" aria-label="빠른 진입">
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex min-h-24 items-center gap-3 rounded-lg border border-border bg-card p-4 text-left active:scale-[0.98]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm font-semibold text-foreground">
                      {item.label}
                    </strong>
                    <span className="mt-1 block text-xs leading-4 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="border-t-[12px] border-t-primary-980 py-5" />

        {/*
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              궁금해하실 질문들
            </h2>
            <button
              onClick={handleViewAllQuestions}
              className="text-sm font-medium text-border hover:text-foreground"
            >
              전체보기
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-20 rounded-lg bg-gray-200"></div>
                </div>
              ))}
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="space-y-4">
              {questions
                .slice(0, 5)
                .map((question: QuestionResponse, index: number) => (
                  <div key={question.id}>
                    <QuestionListCard
                      question={{
                        ...question,
                        createdAt: formatDiffDate(question.createdAt),
                      }}
                      onClick={() => handleQuestionClick(question.id)}
                    />
                    {index < Math.min(questions.length - 1, 4) && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="mb-4 text-gray-500">아직 질문이 없습니다</p>
              <button
                onClick={handleAskQuestion}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                첫 번째 질문을 올려보세요!
              </button>
            </Card>
          )}
        </div>
        */}

        <div className="mb-6 px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              인기 게시글들
            </h2>
            <button
              onClick={handleViewAllBoards}
              className="text-sm font-medium text-border hover:text-foreground"
            >
              전체보기
            </button>
          </div>

          {isBoardsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-20 rounded-lg bg-gray-200"></div>
                </div>
              ))}
            </div>
          ) : isBoardsError ? (
            <Card className="p-6 text-center">
              <p className="mb-4 text-gray-500">
                인기 게시글을 불러오지 못했습니다
              </p>
              <button
                onClick={() => void refetchBoards()}
                className="font-medium text-primary hover:text-primary-800"
              >
                다시 시도
              </button>
            </Card>
          ) : boardList.length > 0 ? (
            <div className="space-y-4">
              {boardList.map((board: any, index: number) => {
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
                  userNickname:
                    board?.userNickname ?? board?.nickname ?? "익명",
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
                    {index < boardList.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </Fragment>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="mb-4 text-gray-500">아직 게시글이 없습니다</p>
              <button
                onClick={handleViewAllBoards}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                게시판 보러가기
              </button>
            </Card>
          )}
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
};

export default Home;
