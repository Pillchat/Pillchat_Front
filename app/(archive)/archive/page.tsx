"use client";

type ArchiveTabKey =
  | "my-questions"
  | "my-study"
  | "my-note"
  | "my-post";

import { FC, Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlarmHeader,
  BottomNavbar,
  ArrayList,
  QuestionListCard,
  ExpandableChipSection,
} from "@/components/molecules";
import { useArchiveTabState, useMyQuestions } from "@/app/(archive)/archive/_hooks/";
import { Separator } from "@/components/ui/separator";
import { formatDiffDate } from "@/lib/functions";
import { map } from "lodash";
import { useSubjects } from "@/hooks";

const TABS: { key: ArchiveTabKey; label: string }[] = [
  { key: "my-questions", label: "내 질문" },
  { key: "my-study", label: "학습자료" },
  { key: "my-note", label: "오답노트" },
  { key: "my-post", label: "게시물" },
];

const ArchivePage: FC = () => {
  const { currentStatus, handleTabChange } = useArchiveTabState();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const { getSubjectMapForChips } = useSubjects();
  const router = useRouter();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const {
    data: myQuestions,
    loading: questionsLoading,
    error: questionsError,
    refetch: refetchQuestions,
  } = useMyQuestions(token || undefined);

  const rawSubjectMap = useMemo(
    () => getSubjectMapForChips(),
    [getSubjectMapForChips],
  );

  const subjectData = useMemo(
    () => ({
      "과목별로 보기": [...new Set(Object.values(rawSubjectMap).flat())],
    }),
    [rawSubjectMap],
  );

  const handleSubjectToggle = (item: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item],
    );
  };

  const pickQuestionId = (item: any): number | null => {
    return item?.question?.id ?? item?.questionId ?? item?.id ?? null;
  };

  const renderQuestionList = (list: any[] | undefined | null) => {
    if (!list || list.length === 0) {
      return (
        <div className="flex h-full items-center justify-center pb-[5.625rem]">
          <div className="text-border">아직 올린 질문이 없습니다.</div>
        </div>
      );
    }

    return (
      <div className="mx-6 py-5 pb-[5.625rem]">
        <div className="flex flex-col gap-5">
          {map(list, (item) => {
            const qid = pickQuestionId(item);
            const question = {
              id: String(qid ?? ""),
              title: item?.title ?? item?.question?.title ?? "제목 없음",
              content:
                item?.content ??
                item?.question?.content ??
                "내용 없음",
              createdAt: formatDiffDate(
                item?.createdAt ??
                  item?.question?.createdAt ??
                  new Date().toISOString(),
              ),
              likeCount: item?.likeCount ?? 0,
              answerCount: item?.answerCount ?? 0,
              subjectName: item?.subjectName ?? item?.question?.subjectName,
              viewCount: item?.viewCount ?? 0,
              userNickname:
                item?.userNickname ?? item?.question?.userNickname ?? "익명",
              images: item?.images ?? item?.question?.images ?? [],
            };

            return (
              <Fragment key={qid ?? Math.random()}>
                <QuestionListCard
                  question={question}
                  onClick={() => {
                    if (qid) router.push(`/question/${qid}`);
                    else alert("질문 ID를 찾을 수 없습니다.");
                  }}
                />
                <Separator className="last:hidden" />
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPreparingText = (text: string) => (
    <div className="flex h-full items-center justify-center pb-[5.625rem]">
      <div className="text-border">{text}</div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-shrink-0">
        <AlarmHeader hideBottomBorder />
        <ArrayList
          tabs={TABS}
          value={currentStatus as ArchiveTabKey}
          onChange={(key) => handleTabChange(key)}
          scrollable={false}
        />
      </div>

      {(currentStatus === "my-study" || currentStatus === "my-note") && (
        <div className="px-6 pt-4">
          <ExpandableChipSection
            data={subjectData}
            selectedItems={selectedSubjects}
            onItemToggle={handleSubjectToggle}
            showDropdown
            showDropdownButton
            categoryTitleClassName="text-sm font-medium text-pretendard text-[#111]"
            buttonSize="sm"
            className="gap-0"
          />
        </div>
      )}

      <div className="relative flex-1 overflow-y-auto">
        {currentStatus === "my-questions" ? (
          questionsLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-border">불러오는 중...</div>
            </div>
          ) : questionsError ? (
            <div className="flex h-full items-center justify-center text-red-500">
              {questionsError}
            </div>
          ) : (
            renderQuestionList(myQuestions)
          )
        ) : currentStatus === "my-study" ? (
          renderPreparingText("학습자료 목록은 준비 중입니다.")
        ) : currentStatus === "my-note" ? (
          renderPreparingText("오답노트 목록은 준비 중입니다.")
        ) : (
          renderPreparingText("게시물 목록은 준비 중입니다.")
        )}
      </div>

      {currentStatus === "my-questions" && (
        <div className="mt-4 text-center">
          <button
            onClick={refetchQuestions}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-gray-100"
          >
            새로고침
          </button>
        </div>
      )}

      <div className="flex-shrink-0">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default ArchivePage;