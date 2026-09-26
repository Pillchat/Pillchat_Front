"use client";

import { Check } from "lucide-react";
import { FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  ExpectedFeature,
  ExpectedFeatureSurveyRequest,
} from "@/types/notification";

const EXPECTED_FEATURE_OPTIONS: ReadonlyArray<{
  value: ExpectedFeature;
  label: string;
}> = [
  { value: "AI_FLASHCARD", label: "AI 플래시카드" },
  { value: "QUESTION_BANK", label: "문제은행" },
];

interface ExpectedFeatureSurveyDialogProps {
  open: boolean;
  isSubmitting: boolean;
  hasSubmitError: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: ExpectedFeatureSurveyRequest) => void;
}

export function ExpectedFeatureSurveyDialog({
  open,
  isSubmitting,
  hasSubmitError,
  onOpenChange,
  onSubmit,
}: ExpectedFeatureSurveyDialogProps) {
  const [selectedFeature, setSelectedFeature] =
    useState<ExpectedFeature | null>(null);
  const [additionalOpinion, setAdditionalOpinion] = useState("");
  const opinionId = useId();
  const opinionHelpId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFeature || isSubmitting) return;

    const trimmedOpinion = additionalOpinion.trim();
    onSubmit({
      expectedFeature: selectedFeature,
      additionalOpinion: trimmedOpinion || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[440px] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 pb-5 pt-6 text-left">
          <DialogTitle className="pr-8 text-title-large">
            가장 기대되는 기능은 무엇인가요?
          </DialogTitle>
          <DialogDescription className="text-body-small">
            한 가지를 선택해 주세요. 여러분의 의견을 서비스 준비에 반영할게요.
          </DialogDescription>
        </DialogHeader>

        <form className="px-6 pb-6 pt-5" onSubmit={handleSubmit}>
          <fieldset disabled={isSubmitting}>
            <legend className="sr-only">가장 기대되는 기능</legend>
            <div className="flex flex-col gap-3">
              {EXPECTED_FEATURE_OPTIONS.map((option) => {
                const isSelected = selectedFeature === option.value;

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-body-large transition-colors",
                      isSelected
                        ? "border-primary bg-primary-980 text-primary"
                        : "border-border text-foreground hover:bg-muted",
                      isSubmitting && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name="expected-feature"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setSelectedFeature(option.value)}
                      className="peer sr-only"
                    />
                    <span className="font-medium">{option.label}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                        isSelected &&
                          "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {isSelected && (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={opinionId}
                className="text-title-small text-foreground"
              >
                추가 의견{" "}
                <span className="font-normal text-muted-foreground">
                  (선택)
                </span>
              </label>
              <span
                id={opinionHelpId}
                className="text-body-small text-muted-foreground"
              >
                {additionalOpinion.length}/300
              </span>
            </div>
            <Textarea
              id={opinionId}
              value={additionalOpinion}
              maxLength={300}
              rows={4}
              disabled={isSubmitting}
              aria-describedby={opinionHelpId}
              placeholder="서비스에 바라는 점을 자유롭게 적어주세요."
              className="mt-2 max-h-40 min-h-28"
              onChange={(event) => setAdditionalOpinion(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={!selectedFeature || isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? "제출 중..."
              : hasSubmitError
                ? "다시 시도"
                : "제출하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
