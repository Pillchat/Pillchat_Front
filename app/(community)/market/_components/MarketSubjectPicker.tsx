"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type MarketSubjectSection = {
  title: string;
  items: Array<{
    code: string;
    label: string;
  }>;
};

interface MarketSubjectPickerProps {
  id: string;
  value: string;
  sections: MarketSubjectSection[];
  isLoading: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onSelect: (code: string) => void;
}

export function MarketSubjectPicker({
  id,
  value,
  sections,
  isLoading,
  disabled = false,
  invalid = false,
  onSelect,
}: MarketSubjectPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSubject = sections
    .flatMap((section) => section.items)
    .find((item) => item.code === value);

  const selectSubject = (code: string) => {
    onSelect(code);
    setIsOpen(false);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          data-testid="market-subject-picker-trigger"
          disabled={disabled}
          aria-required="true"
          aria-invalid={invalid}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-xl border bg-card px-4 text-left text-body-medium outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
            invalid ? "border-primary" : "border-input",
            !selectedSubject && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selectedSubject?.label ??
              (isLoading ? "과목을 불러오는 중..." : "과목을 선택해주세요")}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground"
            strokeWidth={1.8}
          />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-testid="market-subject-picker-dialog"
          className="fixed bottom-0 left-1/2 z-50 flex max-h-[82dvh] w-full max-w-app -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-card shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        >
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
          />

          <header className="relative border-b border-border px-6 pb-5 pt-4 text-center">
            <DialogPrimitive.Title className="text-title-large text-foreground">
              과목 선택
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 text-body-small text-muted-foreground">
              판매할 자료에 맞는 과목을 선택해주세요.
            </DialogPrimitive.Description>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="과목 선택 닫기"
                className="absolute right-5 top-3 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </DialogPrimitive.Close>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
            {isLoading ? (
              <div className="space-y-3 py-2" aria-label="과목을 불러오는 중">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-xl bg-primary-980"
                  />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <p className="py-12 text-center text-body-medium text-muted-foreground">
                선택할 수 있는 과목이 없습니다.
              </p>
            ) : (
              <div className="space-y-5">
                {sections.map((section) => (
                  <section key={section.title}>
                    <h3 className="mb-2 px-1 text-label-medium font-semibold text-muted-foreground">
                      {section.title}
                    </h3>
                    <div className="overflow-hidden rounded-2xl border border-border bg-background">
                      {section.items.map((item, index) => {
                        const isSelected = item.code === value;

                        return (
                          <button
                            key={item.code}
                            type="button"
                            data-testid={`market-subject-option-${item.code}`}
                            aria-pressed={isSelected}
                            onClick={() => selectSubject(item.code)}
                            className={cn(
                              "flex min-h-[3.25rem] w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-body-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                              index > 0 && "border-t border-border",
                              isSelected && "bg-primary-980 text-primary",
                            )}
                          >
                            <span className="font-medium">{item.label}</span>
                            {isSelected ? (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                  strokeWidth={2.5}
                                />
                              </span>
                            ) : (
                              <ChevronRight
                                aria-hidden="true"
                                className="h-5 w-5 shrink-0 text-muted-foreground"
                                strokeWidth={1.8}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
