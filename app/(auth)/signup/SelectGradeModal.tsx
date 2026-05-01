"use client";

type SelectGradeModalProps = {
  isOpen: boolean;
  closeClick?: () => void;
  onSelect?: (grade: string) => void;
};

export const GRADE_OPTIONS = [
  "1학년",
  "2학년",
  "3학년",
  "4학년",
  "5학년",
  "6학년",
  "졸업생",
  "휴학생",
];

export const SelectGradeModal = ({
  isOpen,
  closeClick,
  onSelect,
}: SelectGradeModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => closeClick?.()}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-h-[100vh] max-w-screen-sm overflow-y-auto rounded-t-2xl border bg-white px-6 pb-6 pt-4 shadow-lg md:max-w-none">
        <div className="mb-4 mt-4 flex items-center justify-between">
          <div className="mx-auto flex max-w-[80%] flex-col items-center">
            <p className="mb-3 text-lg font-medium">학년</p>
            <p className="text-sm text-gray-400">학년을 선택해주세요.</p>
          </div>
        </div>
        <hr className="my-2.5" />
        <div className="flex flex-col gap-3">
          {GRADE_OPTIONS.map((grade) => (
            <div key={grade} className="flex w-full flex-row justify-between">
              <button
                type="button"
                onClick={() => onSelect?.(grade)}
                className="rounded-lg p-3 text-left"
              >
                {grade}
              </button>
              <img
                src="/ArrowIcon.svg"
                alt="arrow-right"
                width={20}
                height={20}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
