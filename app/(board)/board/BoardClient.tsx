"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { map } from "lodash";

import {
  ArrayList,
  BottomNavbar,
  GeneralHeader,
  QuestionListCard,
} from "@/components/molecules";
import { CircleButton } from "@/components/molecules/board";
import { Separator } from "@/components/ui/separator";
import { fetchAPI, formatDiffDate } from "@/lib/functions";
import { useBoardTabState } from "./_hooks";
import { ExpandableChipSection } from "@/components/molecules/ExpandableChipSection";
import { useSubjects } from "@/hooks";

const BoardClient = () => {
  const { currentStatus, handleTabChange } = useBoardTabState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const { getSubjectMapForChips } = useSubjects();

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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["boards", currentStatus],
    queryFn: () => fetchAPI(`/api/boards`, "GET"),
  });

  const list = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = data;

    if (q) {
      const terms = q
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.toLowerCase());

      filtered = filtered.filter((item: any) => {
        const searchable =
          `${item.title ?? ""} ${item.content ?? ""} ${item.body ?? ""} ${item.question ?? ""}`.toLowerCase();

        return terms.every((t) => searchable.includes(t));
      });
    }

    return filtered;
  }, [data, q]);

  const emptyText = q
    ? `"${q}" 검색 결과가 없습니다.`
    : `아직 ${currentStatus === "best" ? "등록된" : "답변이 달린"} 질문이 없습니다.`;

  return (
    <div className="flex min-h-screen flex-col">
      <GeneralHeader
        currentQ={q}
        currentStatus={currentStatus}
        searchBasePath="/board"
      />
      <div className="z-20 -mt-[1px] h-[1px] w-full bg-white" />
      <ArrayList value={currentStatus} onChange={handleTabChange} />

      {currentStatus === "study" && (
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

      <CircleButton
        onUploadPost={() => router.push("/upload")}
        onUploadStudy={() => router.push("/upload")}
      />

      <div className="relative flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-border">Loading...</div>
          </div>
        ) : isError ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-red-500">
              {error instanceof Error
                ? error.message
                : "질문을 불러오지 못했습니다."}
            </div>
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

export default BoardClient;
