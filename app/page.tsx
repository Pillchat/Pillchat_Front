"use client";

import { FC, useEffect, useState } from "react";
import {
  BottomNavbar,
  AlarmHeader,
  QuestionListCard,
} from "@/components/molecules";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI, formatDiffDate, getCurrentUserInfo } from "@/lib/functions";
import { QuestionResponse } from "@/types/question";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // 최근 질문들 가져오기 (답변을 기다리는 질문 우선)
  const { data: questions, isLoading } = useQuery({
    queryKey: ["home-questions"],
    queryFn: () => fetchAPI("/api/questions?status=pending", "GET"),
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

  const handleQuestionClick = (questionId: string) => {
    router.push(`/question/${questionId}`);
  };

  const handleAskQuestion = () => {
    router.push("/ask");
  };

  const handleViewAllQuestions = () => {
    router.push("/qna");
  };

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AlarmHeader />

      <main className="flex-1 px-6 pb-24 pt-4">
        {/* 메인 배너 카드 캐러셀 */}
        <div className="mb-6">
          <Carousel className="w-full">
            <CarouselContent>
              <CarouselItem>
                <Card
                  className="cursor-pointer border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-shadow hover:shadow-md"
                  onClick={handleAskQuestion}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                          오늘의 질문 처방전
                        </h2>
                        <p className="text-sm text-gray-600">
                          클릭해서 궁금한 것 질문하기
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                          <QuestionWithBubble className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>

              <CarouselItem>
                <Card
                  className="cursor-pointer border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 transition-shadow hover:shadow-md"
                  onClick={handleViewAllQuestions}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                          질문 광장 둘러보기
                        </h2>
                        <p className="text-sm text-gray-600">
                          다른 사람들의 질문과 답변 확인하기
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
                  onClick={() => router.push("/mypage")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                          내 활동 확인하기
                        </h2>
                        <p className="text-sm text-gray-600">
                          내가 작성한 질문과 답변 관리하기
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
        <div className="-mx-6 border-t-[12px] border-t-[#FFF6F5] py-5" />

        {/* 궁금해하실 질문들 섹션 */}
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
      </main>
      <BottomNavbar />
    </div>
  );
};

export default Home;
