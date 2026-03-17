"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader, ExpandableChipSection } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import { useSubjects } from "@/hooks";
import StepEditor from "../../_components/StepEditor";
import type { WrongNoteDetail, WrongNoteStep } from "@/types/wrongnote";

const EditWrongNotePage = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectCategory, setSubjectCategory] = useState("");
  const [questionSource, setQuestionSource] = useState("");
  const [steps, setSteps] = useState<WrongNoteStep[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getSubjectMapForChips } = useSubjects();
  const subjectMap = useMemo(
    () => getSubjectMapForChips(),
    [getSubjectMapForChips],
  );

  const handleSubjectToggle = (label: string) => {
    setSubjectCategory(subjectCategory === label ? "" : label);
  };

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const raw = await fetchAPI(`/api/wrong-notes/${noteId}`, "GET");
        const data: WrongNoteDetail = raw.data ?? raw;
        setTitle(data.title);
        setContent(data.content);
        setSubjectCategory(data.subjectCategory ?? "");
        setQuestionSource(data.questionSource ?? "");
        setSteps(
          [...data.steps]
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((s) => ({ stepOrder: s.stepOrder, content: s.content })),
        );
      } catch {
        setError("오답노트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [noteId]);

  const isValid = title.trim() && content.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
      };
      if (subjectCategory.trim()) body.subjectCategory = subjectCategory.trim();
      if (questionSource.trim()) body.questionSource = questionSource.trim();
      if (steps.length > 0) {
        body.steps = steps.filter((s) => s.content.trim());
      }

      await fetchAPI(`/api/wrong-notes/${noteId}`, "PUT", body);
      router.replace(`/wrongnote/${noteId}`);
    } catch {
      setError("수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="오답노트 수정" showIcon />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* 제목 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="오답노트 제목"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-brand"
          />
        </div>

        {/* 과목 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            과목
          </label>
          <ExpandableChipSection
            data={subjectMap}
            selectedItems={subjectCategory ? [subjectCategory] : []}
            onItemToggle={handleSubjectToggle}
            showDropdown
            showDropdownButton
            categoryTitleClassName="text-sm font-medium text-pretendard text-[#111]"
            buttonSize="sm"
            className="gap-0"
          />
        </div>

        {/* 출처 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            출처
          </label>
          <input
            type="text"
            value={questionSource}
            onChange={(e) => setQuestionSource(e.target.value)}
            maxLength={200}
            placeholder="예: 2025 모의고시"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
          />
        </div>

        {/* 문제 내용 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            문제 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="문제 내용을 입력하세요"
            rows={5}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-brand"
          />
        </div>

        {/* 풀이 단계 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            풀이 과정
          </label>
          <StepEditor steps={steps} onChange={setSteps} />
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex-shrink-0 px-6 pb-6">
        <SolidButton
          content="수정 완료"
          disabled={!isValid || submitting}
          variant={isValid && !submitting ? "brand" : "disabled"}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default EditWrongNotePage;
