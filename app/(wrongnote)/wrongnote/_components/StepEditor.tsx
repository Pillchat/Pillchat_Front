"use client";

import { FC } from "react";
import type { WrongNoteStep } from "@/types/wrongnote";

interface StepEditorProps {
  steps: WrongNoteStep[];
  onChange: (steps: WrongNoteStep[]) => void;
}

const StepEditor: FC<StepEditorProps> = ({ steps, onChange }) => {
  const addStep = () => {
    onChange([...steps, { stepOrder: steps.length, content: "" }]);
  };

  const updateStep = (index: number, content: string) => {
    const updated = steps.map((s, i) =>
      i === index ? { ...s, content } : s,
    );
    onChange(updated);
  };

  const removeStep = (index: number) => {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stepOrder: i }));
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {i + 1}
          </span>
          <textarea
            value={step.content}
            onChange={(e) => updateStep(i, e.target.value)}
            placeholder={`풀이 ${i + 1}단계`}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            className="mt-2 flex-shrink-0 text-sm text-red-400"
            onClick={() => removeStep(i)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        className="w-full rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-brand"
        onClick={addStep}
      >
        + 풀이 단계 추가
      </button>
    </div>
  );
};

export default StepEditor;
