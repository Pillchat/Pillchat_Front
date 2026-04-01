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
  ExpandableChipSection,
} from "@/components/molecules";
import { CircleButton } from "@/components/molecules/board";
import { Separator } from "@/components/ui/separator";
import { fetchAPI, formatDiffDate, markBoardViewIntent } from "@/lib/functions";
import { useBoardTabState } from "./_hooks";
import { useSubjects } from "@/hooks";
import { cn } from "@/lib/utils";

const resolveMaterialKey = (value: any, materialId: string | number) => {
  const raw =
    typeof value === "string"
      ? value
      : (value?.urlKey ?? value?.key ?? value?.fileKey ?? value?.name ?? "");

  if (!raw) return "";
  return raw.includes("/") ? raw : `material/${materialId}/${raw}`;
};

const getBoardFileKey = (file: any) => {
  if (typeof file === "string") return file;
  return file?.urlKey ?? file?.key ?? file?.fileKey ?? file?.name ?? "";
};

const BoardClient = () => {
  const { currentStatus, handleTabChange } = useBoardTabState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { getSubjectMapForChips } = useSubjects();

  const subjectMap = useMemo(
    () => getSubjectMapForChips(),
    [getSubjectMapForChips],
  );

  const allSubjects = useMemo(
    () => ({
      "과목 선택": [...new Set(Object.values(subjectMap).flat())],
    }),
    [subjectMap],
  );

  const handleSubjectToggle = (item: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item],
    );
  };

  const handleBoardClick = (boardId: string | number) => {
    markBoardViewIntent(boardId);
    router.push(`/board/${boardId}`);
  };

  const getCommentCount = (item: any) =>
    item?.answerCount ??
    item?.commentCount ??
    item?.commentsCount ??
    item?.replyCount ??
    item?.repliesCount ??
    0;

  const isStudyTab = currentStatus === "study";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: isStudyTab ? ["materials", "all"] : ["boards", currentStatus],
    queryFn: () =>
      isStudyTab
        ? fetchAPI("/api/materials/all", "GET")
        : fetchAPI(`/api/boards?status=${currentStatus}`, "GET"),
  });

  const rawList = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const list = useMemo(() => {
    let filtered = [...rawList];

    if (q) {
      const terms = q
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.toLowerCase());

      filtered = filtered.filter((item: any) => {
        const searchable = isStudyTab
          ? `${item.title ?? ""} ${item.subjectName ?? ""} ${item.subject?.name ?? ""} ${item.nickname ?? ""}`.toLowerCase()
          : `${item.title ?? ""} ${item.content ?? ""} ${item.categoryName ?? ""} ${item.nickname ?? ""}`.toLowerCase();

        return terms.every((t) => searchable.includes(t));
      });
    }

    if (isStudyTab && selectedSubjects.length > 0) {
      filtered = filtered.filter((item: any) => {
        const subjectName =
          item?.subjectName ?? item?.subject?.name ?? item?.name ?? "";
        return selectedSubjects.includes(subjectName);
      });
    }

    if (!isStudyTab && currentStatus === "column") {
      filtered = filtered.filter(
        (item: any) =>
          item?.category === "COLUMN" || item?.categoryName === "칼럼",
      );
    }

    if (!isStudyTab && currentStatus === "promo") {
      filtered = filtered.filter(
        (item: any) =>
          item?.category === "PROMOTION" || item?.categoryName === "홍보게시판",
      );
    }

    if (!isStudyTab && currentStatus === "best") {
      filtered.sort(
        (a: any, b: any) => (b?.likeCount ?? 0) - (a?.likeCount ?? 0),
      );
    }

    return filtered;
  }, [rawList, q, currentStatus, isStudyTab, selectedSubjects]);

  const previewFileKeys = useMemo(() => {
    return [
      ...new Set(
        list.flatMap((item: any) => {
          if (isStudyTab) {
            if (!item?.id || !Array.isArray(item?.images)) return [];
            return item.images
              .map((value: any) => resolveMaterialKey(value, item.id))
              .filter(Boolean);
          }

          return Array.isArray(item?.images)
            ? item.images
                .map((image: any) => getBoardFileKey(image))
                .filter(Boolean)
            : [];
        }),
      ),
    ];
  }, [isStudyTab, list]);

  const { data: previewFilesData } = useQuery({
    queryKey: ["list-preview-files", isStudyTab, previewFileKeys],
    queryFn: async () => {
      if (previewFileKeys.length === 0) return [];

      const params = new URLSearchParams();
      previewFileKeys.forEach((key) => {
        params.append("keys", key);
      });

      return fetchAPI(`/api/files?${params.toString()}`, "GET");
    },
    enabled: previewFileKeys.length > 0,
  });

  const previewImageUrlMap = useMemo(() => {
    if (!Array.isArray(previewFilesData)) return {};

    return previewFilesData.reduce<Record<string, string>>(
      (acc, file: any, index: number) => {
        const requestedKey = previewFileKeys[index];
        const responseKey = file?.key ?? "";

        if (requestedKey && file?.preSignedUrl) {
          acc[requestedKey] = file.preSignedUrl;
        }

        if (responseKey && file?.preSignedUrl) {
          acc[responseKey] = file.preSignedUrl;
        }

        return acc;
      },
      {},
    );
  }, [previewFilesData, previewFileKeys]);

  const emptyText = q
    ? `"${q}" 검색 결과가 없습니다.`
    : isStudyTab
      ? "아직 등록된 학습자료가 없습니다."
      : "아직 등록된 게시글이 없습니다.";

  const mobileFixedHidden = isSearchOpen
    ? "translate-y-[140%] opacity-0 pointer-events-none"
    : "translate-y-0 opacity-100";

  return (
    <div className="flex min-h-screen flex-col">
      <GeneralHeader
        currentQ={q}
        currentStatus={currentStatus}
        searchBasePath="/board"
        hideBottomBorder
        onSearchOpenChange={setIsSearchOpen}
      />

      <ArrayList
        value={currentStatus}
        onChange={handleTabChange}
        innerClassName="px-6 md:px-10"
      />

      {currentStatus === "study" && (
        <div className="px-6 pt-4">
          <ExpandableChipSection
            data={allSubjects}
            expandedData={subjectMap}
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
        onUploadPost={() => router.push("/post")}
        onUploadStudy={() => router.push("/upload")}
        className={mobileFixedHidden}
      />

      <div
        className={cn(
          "relative flex-1",
          isSearchOpen ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-border">불러오는 중...</span>
          </div>
        ) : isError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-500">
              {error instanceof Error
                ? error.message
                : isStudyTab
                  ? "학습자료를 불러오지 못했습니다."
                  : "게시글을 불러오지 못했습니다."}
            </div>
          </div>
        ) : list.length > 0 ? (
          <div className="mx-6 py-5 pb-[5.625rem]">
            <div className="flex flex-col gap-5">
              {map(list, (item: any) => {
                const imageKeys = isStudyTab
                  ? item?.id && Array.isArray(item?.images)
                    ? item.images
                        .map((value: any) => resolveMaterialKey(value, item.id))
                        .filter(Boolean)
                    : []
                  : Array.isArray(item?.images)
                    ? item.images
                        .map((image: any) => getBoardFileKey(image))
                        .filter(Boolean)
                    : [];

                const imageUrls = imageKeys
                  .map((key: string) => previewImageUrlMap[key])
                  .filter(Boolean);

                const materialPreviewContent = item?.pdfKey
                  ? "PDF 첨부"
                  : imageUrls.length > 0
                    ? "이미지 첨부"
                    : "첨부 파일 없음";

                const boardPreviewContent =
                  typeof item?.content === "string" && item.content.trim()
                    ? item.content.trim()
                    : imageUrls.length > 0
                      ? "이미지 첨부"
                      : "첨부 파일 없음";

                const cardData = isStudyTab
                  ? {
                      id: String(item?.id ?? ""),
                      title: item?.title ?? "제목 없음",
                      content: materialPreviewContent,
                      userNickname:
                        item?.userNickname ?? item?.nickname ?? "익명",
                      subjectName:
                        item?.subjectName ?? item?.subject?.name ?? "",
                      answerCount: getCommentCount(item),
                      likeCount: item?.likeCount ?? 0,
                      viewCount: item?.viewCount ?? 0,
                      createdAt: formatDiffDate(item?.createdAt),
                      images: imageUrls,
                    }
                  : {
                      ...item,
                      content: boardPreviewContent,
                      userNickname:
                        item?.userNickname ?? item?.nickname ?? "익명",
                      subjectName:
                        item?.subjectName ?? item?.categoryName ?? "",
                      answerCount: getCommentCount(item),
                      createdAt: formatDiffDate(item?.createdAt),
                      images: imageUrls,
                    };

                return (
                  <Fragment key={item?.id}>
                    <QuestionListCard
                      question={cardData}
                      hideStats={isStudyTab}
                      onClick={() =>
                        isStudyTab
                          ? router.push(`/materials/${item.id}`)
                          : handleBoardClick(item.id)
                      }
                    />
                    <Separator className="last:hidden" />
                  </Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pb-[5.625rem]">
            <div className="text-border">{emptyText}</div>
          </div>
        )}
      </div>

      <BottomNavbar className={`${mobileFixedHidden} z-20`} />
    </div>
  );
};

export default BoardClient;
