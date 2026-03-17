"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/functions";
import { CustomHeader, ExpandableChipSection } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import { useSubjects } from "@/hooks";
import StepEditor from "../_components/StepEditor";
import type { WrongNoteStep } from "@/types/wrongnote";

const NewWrongNotePage = () => {
  const router = useRouter();
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

      const raw = await fetchAPI("/api/wrong-notes", "POST", body);
      const data = raw.data ?? raw;
      router.replace(`/wrongnote/${data.id}`);
    } catch {
      setError("오답노트 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="오답노트 작성" showIcon />

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
          content="저장"
          disabled={!isValid || submitting}
          variant={isValid && !submitting ? "brand" : "disabled"}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default NewWrongNotePage;
