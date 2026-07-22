"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronDown, X } from "lucide-react";
import { useId, useState } from "react";

import { SIGNUP_GRADE_OPTIONS, type SignupGrade } from "@/constants/signup";
import { cn } from "@/lib/utils";

type SelectGradeModalProps = {
  value: SignupGrade | "";
  onSelect: (grade: SignupGrade) => void;
};

export function SelectGradeModal({ value, onSelect }: SelectGradeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const labelId = useId();
  const valueId = useId();

  const selectGrade = (grade: SignupGrade) => {
    onSelect(grade);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <p id={labelId} className="text-title-small text-foreground">
        학년
      </p>

      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            aria-labelledby={`${labelId} ${valueId}`}
            className="flex h-14 w-full items-center justify-between rounded-xl border border-gray-300 bg-card px-4 text-left text-body-large text-foreground outline-none transition-colors focus-visible:border-2 focus-visible:border-foreground focus-visible:ring-0"
          >
            <span
              id={valueId}
              className={cn("truncate", !value && "text-gray-500")}
            >
              {value || "학년을 선택해주세요"}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-gray-500"
              strokeWidth={1.8}
            />
          </button>
        </DialogPrimitive.Trigger>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed bottom-0 left-1/2 z-50 flex max-h-[82dvh] w-full max-w-app -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-card shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
            <div
              aria-hidden="true"
              className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
            />

            <header className="relative border-b border-border px-6 pb-5 pt-4 text-center">
              <DialogPrimitive.Title className="text-title-large text-foreground">
                학년 선택
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-body-small text-muted-foreground">
                현재 학년 또는 상태를 선택해주세요.
              </DialogPrimitive.Description>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="학년 선택 닫기"
                  className="absolute right-5 top-3 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </button>
              </DialogPrimitive.Close>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {SIGNUP_GRADE_OPTIONS.map((grade, index) => {
                  const isSelected = grade === value;

                  return (
                    <button
                      key={grade}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectGrade(grade)}
                      className={cn(
                        "flex min-h-[3.25rem] w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-body-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        index > 0 && "border-t border-border",
                        isSelected && "bg-primary-980 text-primary",
                      )}
                    >
                      <span className="font-medium">{grade}</span>
                      {isSelected && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check
                            aria-hidden="true"
                            className="h-4 w-4"
                            strokeWidth={2.5}
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
