"use client";

import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Toggle } from "@/components/atoms/Toggle";
import { TextField } from "@/components/atoms/TextField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createQuestion,
  MAX_CHOICES,
  MAX_QUESTIONS,
} from "@/lib/admin/questions";
import type {
  AdminQuestionDraft,
  AdminQuestionSetDraft,
} from "@/types/adminQuestion";

type PendingDelete = { questionId: string; choiceId?: string };

export function QuestionEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: AdminQuestionSetDraft;
  onChange: (value: AdminQuestionSetDraft) => void;
  disabled?: boolean;
}) {
  const fieldId = useId();
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  const updateQuestion = (id: string, patch: Partial<AdminQuestionDraft>) => {
    if (disabled) return;
    onChange({
      ...value,
      questions: value.questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    });
  };

  const remove = () => {
    if (disabled || !pendingDelete) return;
    const question = value.questions.find(
      (item) => item.id === pendingDelete.questionId,
    );
    if (pendingDelete.choiceId && question && question.choices.length > 2) {
      updateQuestion(question.id, {
        choices: question.choices.filter(
          (choice) => choice.id !== pendingDelete.choiceId,
        ),
        correctChoiceId:
          question.correctChoiceId === pendingDelete.choiceId
            ? ""
            : question.correctChoiceId,
      });
    } else if (!pendingDelete.choiceId && value.questions.length > 1) {
      onChange({
        ...value,
        questions: value.questions.filter(
          (item) => item.id !== pendingDelete.questionId,
        ),
      });
    }
    setPendingDelete(null);
  };

  return (
    <div className="min-w-0 space-y-8">
      <fieldset disabled={disabled} className="min-w-0 space-y-6">
        <legend className="mb-4 text-headline-small">세트 정보</legend>
        <TextField
          id={`${fieldId}-title`}
          label="세트명"
          value={value.title}
          onChange={(event) =>
            onChange({ ...value, title: event.target.value })
          }
          placeholder="세트명을 입력해 주세요"
          maxLength={100}
          required
          disabled={disabled}
        />
        <fieldset className="space-y-2">
          <legend className="text-title-small">문제 구분</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["HANDCRAFTED", "수제 문제"],
                ["CBT", "CBT"],
              ] as const
            ).map(([kind, label]) => (
              <Button
                key={kind}
                type="button"
                variant={value.kind === kind ? "secondary" : "outline"}
                aria-pressed={value.kind === kind}
                disabled={disabled}
                onClick={() => onChange({ ...value, kind })}
              >
                {label}
              </Button>
            ))}
          </div>
        </fieldset>
        {value.kind === "CBT" && (
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-title-small">교시</legend>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as const).map((sessionId) => (
                  <Button
                    key={sessionId}
                    type="button"
                    size="sm"
                    variant={
                      value.sessionId === sessionId ? "secondary" : "outline"
                    }
                    aria-pressed={value.sessionId === sessionId}
                    disabled={disabled}
                    onClick={() => onChange({ ...value, sessionId })}
                  >
                    {sessionId}교시
                  </Button>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-duration`}>시험 시간 (분)</Label>
              <Input
                id={`${fieldId}-duration`}
                type="number"
                min={1}
                max={240}
                step={1}
                value={value.durationMinutes || ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    durationMinutes: Number(event.target.value),
                  })
                }
                disabled={disabled}
                required
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-title-small">세트 활성 여부</p>
            <p className="mt-1 text-body-small text-muted-foreground">
              비활성 세트는 학습 목록에 표시하지 않아요.
            </p>
          </div>
          <Toggle
            checked={value.isActive}
            onChange={(isActive) => onChange({ ...value, isActive })}
            ariaLabel="세트 활성 여부"
            disabled={disabled}
          />
        </div>
      </fieldset>

      <section
        className="min-w-0 space-y-4"
        aria-labelledby={`${fieldId}-questions`}
      >
        <h2 id={`${fieldId}-questions`} className="text-headline-small">
          문제 {value.questions.length}개
        </h2>
        {value.questions.map((question, index) => (
          <fieldset
            key={question.id}
            disabled={disabled}
            className="min-w-0 space-y-5 rounded-2xl border border-gray-300 bg-white p-4 sm:p-5"
          >
            <legend className="px-1 text-title-large">문제 {index + 1}</legend>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-body-small text-muted-foreground">
                  문제 활성
                </span>
                <Toggle
                  checked={question.isActive}
                  onChange={(isActive) =>
                    updateQuestion(question.id, { isActive })
                  }
                  ariaLabel={`${index + 1}번 문제 활성 여부`}
                  disabled={disabled}
                  size="sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`${index + 1}번 문제 삭제`}
                disabled={disabled || value.questions.length <= 1}
                onClick={() => setPendingDelete({ questionId: question.id })}
              >
                <Trash2 aria-hidden="true" /> 삭제
              </Button>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-3">
              {(
                [
                  ["subject", "과목"],
                  ["topic", "주제"],
                  ["subtopic", "세부 주제"],
                ] as const
              ).map(([key, label]) => (
                <TextField
                  key={key}
                  id={`${fieldId}-${question.id}-${key}`}
                  label={label}
                  value={question[key]}
                  placeholder={`${label} 입력`}
                  onChange={(event) =>
                    updateQuestion(question.id, { [key]: event.target.value })
                  }
                  disabled={disabled}
                  maxLength={100}
                  required={key !== "subtopic"}
                />
              ))}
            </div>
            {(
              [
                ["prompt", "문제 본문", "문제 내용을 입력해 주세요"],
                [
                  "referenceContent",
                  "자료 / 제시문 (선택)",
                  "문제에 필요한 자료나 제시문을 입력해 주세요",
                ],
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`${fieldId}-${question.id}-${key}`}>
                  {label}
                </Label>
                <Textarea
                  id={`${fieldId}-${question.id}-${key}`}
                  value={question[key]}
                  onChange={(event) =>
                    updateQuestion(question.id, { [key]: event.target.value })
                  }
                  placeholder={placeholder}
                  rows={3}
                  maxLength={10000}
                  disabled={disabled}
                  required={key === "prompt"}
                />
              </div>
            ))}
            <fieldset className="min-w-0 space-y-3">
              <legend className="mb-2 text-title-small">보기 및 정답</legend>
              <p className="text-body-small text-muted-foreground">
                보기를 2~{MAX_CHOICES}개 입력하고 정답 하나를 선택해 주세요.
              </p>
              {question.choices.map((choice, choiceIndex) => (
                <div
                  key={choice.id}
                  className="min-w-0 space-y-3 rounded-xl border border-gray-100 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`${fieldId}-${question.id}-${choice.id}-correct`}
                      className="flex min-w-0 cursor-pointer items-center gap-2 text-title-small"
                    >
                      <input
                        id={`${fieldId}-${question.id}-${choice.id}-correct`}
                        type="radio"
                        name={`${fieldId}-${question.id}-correct`}
                        checked={question.correctChoiceId === choice.id}
                        onChange={() =>
                          updateQuestion(question.id, {
                            correctChoiceId: choice.id,
                          })
                        }
                        disabled={disabled}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
                      보기 {choiceIndex + 1} 정답
                    </label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`${index + 1}번 문제 보기 ${choiceIndex + 1} 삭제`}
                      disabled={disabled || question.choices.length <= 2}
                      onClick={() =>
                        setPendingDelete({
                          questionId: question.id,
                          choiceId: choice.id,
                        })
                      }
                    >
                      <Trash2 className="!h-5 !w-5" aria-hidden="true" />
                    </Button>
                  </div>
                  {(
                    [
                      ["text", "보기 내용", 2000],
                      ["explanation", "보기별 해설", 10000],
                    ] as const
                  ).map(([key, label, maxLength]) => (
                    <div key={key} className="space-y-1">
                      <Label
                        htmlFor={`${fieldId}-${question.id}-${choice.id}-${key}`}
                      >
                        {label}
                      </Label>
                      <Textarea
                        id={`${fieldId}-${question.id}-${choice.id}-${key}`}
                        value={choice[key]}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            choices: question.choices.map((item) =>
                              item.id === choice.id
                                ? { ...item, [key]: event.target.value }
                                : item,
                            ),
                          })
                        }
                        placeholder={`${label}을 입력해 주세요`}
                        rows={2}
                        maxLength={maxLength}
                        disabled={disabled}
                        required
                      />
                    </div>
                  ))}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={disabled || question.choices.length >= MAX_CHOICES}
                onClick={() => {
                  if (disabled || question.choices.length >= MAX_CHOICES)
                    return;
                  updateQuestion(question.id, {
                    choices: [
                      ...question.choices,
                      { id: crypto.randomUUID(), text: "", explanation: "" },
                    ],
                  });
                }}
              >
                <Plus aria-hidden="true" /> 보기 추가
              </Button>
            </fieldset>
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-${question.id}-explanation`}>
                전체 해설
              </Label>
              <Textarea
                id={`${fieldId}-${question.id}-explanation`}
                value={question.explanation}
                onChange={(event) =>
                  updateQuestion(question.id, {
                    explanation: event.target.value,
                  })
                }
                placeholder="정답의 근거와 전체 해설을 입력해 주세요"
                rows={3}
                maxLength={10000}
                disabled={disabled}
                required
              />
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={disabled || value.questions.length >= MAX_QUESTIONS}
          onClick={() => {
            if (disabled || value.questions.length >= MAX_QUESTIONS) return;
            onChange({
              ...value,
              questions: [...value.questions, createQuestion()],
            });
          }}
        >
          <Plus aria-hidden="true" /> 문제 추가
        </Button>
        <p className="text-body-small text-muted-foreground">
          한 세트에 최대 {MAX_QUESTIONS}개 문제를 작성할 수 있어요.
        </p>
      </section>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDelete?.choiceId
                ? "보기를 삭제할까요?"
                : "문제를 삭제할까요?"}
            </DialogTitle>
            <DialogDescription>
              작성한 내용과 해설이 함께 삭제됩니다. 삭제 후에는 되돌릴 수
              없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={disabled}
            >
              취소
            </Button>
            <Button type="button" onClick={remove} disabled={disabled}>
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
