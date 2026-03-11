"use client";

import { useEffect } from "react";
import { CATEGORY_MAP, useCategoryType } from "./_hooks/";

type SelectCategoryModalProps = {
  isOpen: boolean;
  closeClick?: () => void;
  onSelect?: (label: string, value: string) => void;
  setCategories?: (types: string[]) => void;
};

export const SelectCategoryModal = ({
  isOpen,
  closeClick,
  onSelect,
  setCategories,
}: SelectCategoryModalProps) => {
  const { categories, onCategoryType } = useCategoryType();

  useEffect(() => {
    if (!isOpen) return;
    onCategoryType();
  }, [isOpen, onCategoryType]);

  useEffect(() => {
    if (categories.length > 0) {
      setCategories?.(categories);
    }
  }, [categories, setCategories]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => closeClick?.()}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-h-[100vh] max-w-screen-sm overflow-y-auto rounded-t-2xl border bg-white px-6 pb-6 pt-4 shadow-lg">
        <div className="mb-4 mt-4 flex items-center justify-between">
          <div className="mx-auto flex max-w-[80%] flex-col items-center">
            <p className="mb-3 text-lg font-medium">카테고리</p>
            <p className="text-sm text-gray-400">
              게시글 카테고리를 선택해주세요.
            </p>
          </div>
        </div>
        <hr className="my-2.5" />
        <div className="flex flex-col gap-3">
          {categories.map((item, i) => {
            const mapped = CATEGORY_MAP[item as keyof typeof CATEGORY_MAP];

            return (
              <div key={i} className="flex w-full flex-row justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.(mapped?.label || item, mapped?.value || item);
                  }}
                  className="rounded-lg p-3 text-left"
                >
                  {item}
                </button>
                <img
                  src="/ArrowIcon.svg"
                  alt="arrow-right"
                  width={20}
                  height={20}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
