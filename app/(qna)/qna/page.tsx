"use client";

import {
  BottomNavbar,
  GeneralHeader,
  ListCard,
  TabsWithUnderline,
} from "@/components/molecules";
import { fetchAPI, formatDiffDate } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import { FC, Fragment } from "react";
import { useQnaTabState } from "./_hooks";
import { map } from "lodash";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { FloatingActionButton } from "@/components/atoms";
import { QuestionWithBubble } from "@/components/icons";

const TABS = [
  { value: "pending", label: "답변을 기다리는 질문" },
  { value: "completed", label: "답변이 달린 질문" },
];

const QnaPage: FC = () => {
  const { currentStatus, handleTabChange } = useQnaTabState();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["questions", currentStatus],
    queryFn: () => fetchAPI(`/api/questions?status=${currentStatus}`, "GET"),
  });

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-shrink-0">
        <GeneralHeader />
        {/* <TabsWithUnderline
          className="mx-6"
          tabs={TABS}
          defaultValue={currentStatus}
          onValueChange={handleTabChange}
        /> */}
      </div>
      <div className="relative flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-border">Loading...</div>
          </div>
        ) : data?.length > 0 ? (
          <div className="mx-6 py-5 pb-[5.625rem]">
            <div className="flex flex-col gap-5">
              {map(data, (question) => (
                <Fragment key={question.id}>
                  {/* <ListCard
                    onClick={() => {
                      router.push(`/question/${question.id}`);
                    }}
                    title={question.title}
                    content={question.content}
                    reward={question.reward}
                    createdAt={formatDiffDate(question.createdAt)}
                    viewCount={question.viewCount || 0}
                    answerCount={question.answerCount || 0}
                    commentCount={question.commentCount || 0}
                  /> */}
                  <Separator className="last:hidden" />
                </Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center pb-[5.625rem]">
            <div className="text-border">{`아직 ${currentStatus === "pending" ? "등록된" : "답변이 달린"} 질문이 없습니다.`}</div>
          </div>
        )}
      </div>
      <div className="absolute bottom-28 right-6 z-50">
        <FloatingActionButton
          mainIcon={
            <QuestionWithBubble
              className="text-brand"
              style={{ width: "32px", height: "32px" }}
            />
          }
          size="md"
          className="relative"
          onMainClick={() => {
            router.push("/ask");
          }}
          text="질문하기"
        />
      </div>
      <div className="flex-shrink-0">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default QnaPage;
