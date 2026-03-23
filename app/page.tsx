"use client";

import { FC, Fragment, useEffect, useMemo, useState } from "react";
import {
  BottomNavbar,
  AlarmHeader,
  QuestionListCard,
} from "@/components/molecules";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI, formatDiffDate, getCurrentUserInfo } from "@/lib/functions";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionWithBubble } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const Home: FC = () => {
  const router = useRouter();
  const { getStorageItem } = useLocalStorage();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const userInfo = getCurrentUserInfo();

  const { data: boards, isLoading: isBoardsLoading } = useQuery({
    queryKey: ["home-boards-best"],
    queryFn: () => fetchAPI("/api/boards?status=best", "GET"),
    enabled: isAuthenticated === true,
  });

  useEffect(() => {
    const token = getStorageItem("access_token");
    setIsAuthenticated(!!token);
  }, [getStorageItem]);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const handleAskQuestion = () => {
    router.push("/ask");
  };

  const handleViewAllBoards = () => {
    router.push("/board");
  };

  const handleBoardClick = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

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
                .map((image: any) =>
                  typeof image === "string" ? image : image?.urlKey,
                )
                .filter(Boolean)
            : [],
        ),
      ),
    ];
  }, [boardList]);

  const { data: boardFilesData } = useQuery({
    queryKey: ["home-board-files", boardImageKeys],
    queryFn: async () => {
      if (boardImageKeys.length === 0) return [];

      const params = new URLSearchParams();
      boardImageKeys.forEach((key) => {
        params.append("keys", key);
      });

      return fetchAPI(`/api/files?${params.toString()}`, "GET");
    },
    enabled: isAuthenticated === true && boardImageKeys.length > 0,
  });

  const boardImageUrlMap = useMemo(() => {
    if (!Array.isArray(boardFilesData)) return {};

    return boardImageKeys.reduce<Record<string, string>>((acc, key, index) => {
      const file = boardFilesData[index];
      if (file?.preSignedUrl) {
        acc[key] = file.preSignedUrl;
      }
      return acc;
    }, {});
  }, [boardFilesData, boardImageKeys]);

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
                  className="cursor-pointer border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 transition-shadow hover:shadow-md"
                  onClick={handleViewAllBoards}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                          게시판 둘러보기
                        </h2>
                        <p className="text-sm text-gray-600">
                          인기 게시글과 다양한 글을 확인하기
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem>
                <Card
                  className="cursor-pointer border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 transition-shadow hover:shadow-md"
                  onClick={() => router.push("/archive")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                          내 활동 확인하기
                        </h2>
                        <p className="text-sm text-gray-600">
                          내가 작성한 게시글과 오답노트 관리하기
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500">
                          <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
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
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            안녕하세요, {userInfo?.username}님!
          </h2>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            오늘도 필챗과 함께하고 계세요!
          </h2>
        </div>

        <div className="border-t-[12px] border-t-[#FFF6F5] py-5" />

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
          ) : boardList.length > 0 ? (
            <div className="space-y-4">
              {boardList.map((board: any, index: number) => {
                const imageKeys = Array.isArray(board?.images)
                  ? board.images
                      .map((image: any) =>
                        typeof image === "string" ? image : image?.urlKey,
                      )
                      .filter(Boolean)
                  : [];

                const imageUrls = imageKeys
                  .map((key: string) => boardImageUrlMap[key])
                  .filter(Boolean);

                const cardData = {
                  ...board,
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
