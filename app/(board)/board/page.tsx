"use client";

import {
  ArrayList,
  BottomNavbar,
  GeneralHeader,
  QuestionListCard,
} from "@/components/molecules";
import { CircleButton } from "@/components/molecules/board";
import { fetchAPI, formatDiffDate } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import { useMemo, Fragment } from "react";
import { useBoardTabState } from "./_hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { map } from "lodash";
import { Separator } from "@/components/ui/separator";

const boardPage = () => {
  const { currentStatus, handleTabChange } = useBoardTabState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  const { data, isLoading } = useQuery({
    queryKey: ["questions", currentStatus],
    queryFn: () => fetchAPI(`/api/questions?status=${currentStatus}`, "GET"),
  });

  const list = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (!q) return data;

    const terms = q
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.toLowerCase());

    return data.filter((item: any) => {
      const searchable =
        `${item.title ?? ""} ${item.content ?? ""} ${item.body ?? ""} ${item.question ?? ""}`.toLowerCase();
      return terms.every((t) => searchable.includes(t));
    });
  }, [data, q]);

  const emptyText = q
    ? `"${q}" 검색 결과가 없습니다.`
    : `아직 ${currentStatus === "best" ? "등록된" : "답변이 달린"} 질문이 없습니다.`;

  return (
    <div className="flex min-h-screen flex-col">
      <GeneralHeader />
      <div className="z-20 -mt-[1px] h-[1px] w-full bg-white" />
      <ArrayList value={currentStatus} onChange={handleTabChange} />

      <CircleButton 
        onUploadPost={() => router.push("/post")}
        onUploadStudy={() => router.push("/upload")}
      />

      <div className="relative flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-border">Loading...</div>
          </div>
        ) : list.length > 0 ? (
          <div className="mx-6 py-5 pb-[5.625rem]">
            <div className="flex flex-col gap-5">
              {map(list, (question: any) => (
                <Fragment key={question.id}>
                  <QuestionListCard
                    question={{
                      ...question,
                      createdAt: formatDiffDate(question.createdAt),
                    }}
                    onClick={() => router.push(`/question/${question.id}`)}
                  />
                  <Separator className="last:hidden" />
                </Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center pb-[5.625rem]">
            <div className="text-border">{emptyText}</div>
          </div>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
};

export default boardPage;
