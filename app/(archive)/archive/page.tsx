"use client";

type ArchiveTabKey = "my-questions" | "my-study" | "my-note" | "my-post";

import { FC, Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlarmHeader,
  BottomNavbar,
  ArrayList,
  QuestionListCard,
  ExpandableChipSection,
} from "@/components/molecules";
import {
  useArchiveTabState,
  useMyQuestions,
} from "@/app/(archive)/archive/_hooks/";
import { Separator } from "@/components/ui/separator";
import { fetchAPI, formatDiffDate, getCurrentUserId } from "@/lib/functions";
import { map } from "lodash";
import { useSubjects } from "@/hooks";
import { FloatingActionButton } from "@/components/atoms";
import WrongNoteCard from "@/app/(wrongnote)/wrongnote/_components/WrongNoteCard";
import type {
  WrongNoteListItem,
  WrongNoteListResponse,
} from "@/types/wrongnote";

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
  const currentUserId = getCurrentUserId();

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const {
    data: myQuestions,
    loading: questionsLoading,
    error: questionsError,
    refetch: refetchQuestions,
  } = useMyQuestions(token || undefined);

  const [myMaterials, setMyMaterials] = useState<any[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const [wrongNotes, setWrongNotes] = useState<WrongNoteListItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    if (currentStatus !== "my-study") return;

    const fetchMyMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const raw = await fetchAPI("/api/materials/all", "GET");
        const data = raw.data ?? raw;

        const materials = Array.isArray(data) ? data : [];
        const filtered = materials.filter(
          (item: any) => Number(item?.userId) === Number(currentUserId),
        );

        setMyMaterials(filtered);
      } catch {
        setMyMaterials([]);
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchMyMaterials();
  }, [currentStatus, currentUserId]);

  useEffect(() => {
    if (currentStatus !== "my-note") return;
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        const raw = await fetchAPI(
          "/api/wrong-notes?sort=createdAt,desc&page=0&size=20",
          "GET",
        );
        const data: WrongNoteListResponse = raw.data ?? raw;
        setWrongNotes(Array.isArray(data.content) ? data.content : []);
      } catch {
        setWrongNotes([]);
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [currentStatus]);

  useEffect(() => {
    if (currentStatus !== "my-post") return;

    const fetchMyPosts = async () => {
      setPostsLoading(true);
      try {
        const raw = await fetchAPI("/api/boards", "GET");
        const data = raw.data ?? raw;

        const boards = Array.isArray(data) ? data : [];
        const filtered = boards.filter(
          (item: any) => Number(item?.userId) === Number(currentUserId),
        );

        setMyPosts(filtered);
      } catch {
        setMyPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchMyPosts();
  }, [currentStatus, currentUserId]);

  const filteredMaterials = useMemo(() => {
    if (selectedSubjects.length === 0) return myMaterials;

    return myMaterials.filter((item) => {
      const subjectName =
        item?.subjectName ?? item?.subject?.name ?? item?.name ?? "";
      return selectedSubjects.includes(subjectName);
    });
  }, [myMaterials, selectedSubjects]);

  const filteredNotes = useMemo(() => {
    if (selectedSubjects.length === 0) return wrongNotes;
    return wrongNotes.filter(
      (n) => n.subjectCategory && selectedSubjects.includes(n.subjectCategory),
    );
  }, [wrongNotes, selectedSubjects]);

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
              content: item?.content ?? item?.question?.content ?? "내용 없음",
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

  const renderBoardList = (list: any[] | undefined | null) => {
    if (!list || list.length === 0) {
      return (
        <div className="flex h-full items-center justify-center pb-[5.625rem]">
          <div className="text-border">아직 작성한 게시글이 없습니다.</div>
        </div>
      );
    }

    return (
      <div className="mx-6 py-5 pb-[5.625rem]">
        <div className="flex flex-col gap-5">
          {map(list, (item) => {
            const boardId = item?.id;

            const board = {
              id: String(boardId ?? ""),
              title: item?.title ?? "제목 없음",
              content: item?.content ?? "내용 없음",
              createdAt: formatDiffDate(
                item?.createdAt ?? new Date().toISOString(),
              ),
              likeCount: item?.likeCount ?? 0,
              answerCount: 0,
              subjectName: item?.categoryName ?? "",
              viewCount: item?.viewCount ?? 0,
              userNickname: item?.nickname ?? item?.userNickname ?? "익명",
              images: item?.images ?? [],
            };

            return (
              <Fragment key={boardId ?? Math.random()}>
                <QuestionListCard
                  question={board}
                  onClick={() => {
                    if (boardId) router.push(`/board/${boardId}`);
                    else alert("게시글 ID를 찾을 수 없습니다.");
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

  const renderMaterialList = (list: any[] | undefined | null) => {
    if (!list || list.length === 0) {
      return (
        <div className="flex h-full items-center justify-center pb-[5.625rem]">
          <div className="text-border">아직 작성한 학습자료가 없습니다.</div>
        </div>
      );
    }

    return (
      <div className="mx-6 py-5 pb-[5.625rem]">
        <div className="flex flex-col gap-5">
          {map(list, (item) => {
            const materialId = item?.id;

            const material = {
              id: String(materialId ?? ""),
              title: item?.title ?? "제목 없음",
              content: item?.pdfKey
                ? "PDF 첨부"
                : Array.isArray(item?.urlKey) && item.urlKey.length > 0
                  ? `이미지 ${item.urlKey.length}장 첨부`
                  : "첨부 파일 없음",
              createdAt: item?.createdAt ? formatDiffDate(item.createdAt) : "",
              likeCount: item?.likeCount ?? 0,
              answerCount: 0,
              subjectName: item?.subjectName ?? item?.subject?.name ?? "",
              viewCount: item?.viewCount ?? 0,
              userNickname: item?.nickname ?? item?.userNickname ?? "익명",
              images: item?.images ?? [],
            };

            return (
              <Fragment key={materialId ?? Math.random()}>
                <QuestionListCard
                  question={material}
                  onClick={() => {
                    if (materialId) router.push(`/materials/${materialId}`);
                    else alert("학습자료 ID를 찾을 수 없습니다.");
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
            expandedData={rawSubjectMap}
            selectedItems={selectedSubjects}
            onItemToggle={handleSubjectToggle}
            expandedData={rawSubjectMap}
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
          materialsLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-border">불러오는 중...</div>
            </div>
          ) : (
            renderMaterialList(filteredMaterials)
          )
        ) : currentStatus === "my-note" ? (
          notesLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-border">불러오는 중...</div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 pb-[5.625rem]">
              <div className="text-border">
                {wrongNotes.length === 0
                  ? "아직 작성된 오답노트가 없습니다."
                  : "해당 과목의 오답노트가 없습니다."}
              </div>
              {wrongNotes.length === 0 && (
                <button
                  className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white"
                  onClick={() => router.push("/wrongnote/new")}
                >
                  오답노트 작성하기
                </button>
              )}
            </div>
          ) : (
            <div className="pb-[5.625rem]">
              {filteredNotes.map((note) => (
                <WrongNoteCard
                  key={note.id}
                  note={note}
                  onClick={() => router.push(`/wrongnote/${note.id}`)}
                />
              ))}
              <button
                className="w-full py-4 text-center text-sm font-medium text-brand"
                onClick={() => router.push("/wrongnote")}
              >
                전체 보기
              </button>
            </div>
          )
        ) : currentStatus === "my-post" ? (
          postsLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-border">불러오는 중...</div>
            </div>
          ) : (
            renderBoardList(myPosts)
          )
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

      {currentStatus === "my-note" && (
        <FloatingActionButton
          mainIcon={
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="block"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
          size="lg"
          bottom={132}
          right={24}
          expandDirection="up"
          actions={[
            {
              id: "new-note",
              label: "오답노트 작성",
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              ),
              onClick: () => router.push("/wrongnote/new"),
            },
            // TODO: AI 시험지 기능 추가 예정
            // {
            //   id: "generate-exam",
            //   label: "AI 시험지 생성",
            //   icon: (
            //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            //       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            //       <polyline points="14 2 14 8 20 8" />
            //       <line x1="16" y1="13" x2="8" y2="13" />
            //       <line x1="16" y1="17" x2="8" y2="17" />
            //     </svg>
            //   ),
            //   onClick: () => router.push("/wrongnote/exams/generate"),
            // },
            // {
            //   id: "exam-list",
            //   label: "시험지 목록",
            //   icon: (
            //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            //       <line x1="8" y1="6" x2="21" y2="6" />
            //       <line x1="8" y1="12" x2="21" y2="12" />
            //       <line x1="8" y1="18" x2="21" y2="18" />
            //       <line x1="3" y1="6" x2="3.01" y2="6" />
            //       <line x1="3" y1="12" x2="3.01" y2="12" />
            //       <line x1="3" y1="18" x2="3.01" y2="18" />
            //     </svg>
            //   ),
            //   onClick: () => router.push("/wrongnote/exams"),
            // },
          ]}
        />
      )}

      <div className="flex-shrink-0">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default ArchivePage;
