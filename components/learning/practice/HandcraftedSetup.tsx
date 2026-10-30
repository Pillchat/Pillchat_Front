"use client";

import { useState } from "react";
import {
  useHandcraftedSubjectsQuery,
  useHandcraftedAvailabilityQuery,
} from "@/hooks/queries/useHandcraftedSelectionQueries";
import Link from "next/link";
import type { LearningSession } from "@/hooks/useLearningSession";
import { handcraftedSubjects } from "@/lib/learning/handcraftedSubjects";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { AttemptHistory } from "./SessionFeedback";

export default function HandcraftedSetup({
  session: s,
}: {
  session: LearningSession;
}) {
  const initial =
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);
  const [subjectId, setSubjectId] = useState(initial.get("subject") ?? "");
  const [topicId, setTopicId] = useState(initial.get("topic") ?? "");
  const [count, setCount] = useState<number | "all">(
    Math.min(30, Math.max(1, Number(initial.get("count")) || 3)),
  );
  const subjectsQuery = useHandcraftedSubjectsQuery();
  const options = s.catalog
    ? handcraftedSubjects(subjectsQuery.data ?? [], s.catalog)
    : [];
  const selected =
    options.find(
      (item) => item.optionId === subjectId && item.availableCount > 0,
    ) ?? options.find((item) => item.availableCount > 0);
  const subject = selected?.learningSubject;
  const topic = subject?.topics.find((item) => item.topicId === topicId);
  const availability = useHandcraftedAvailabilityQuery(
    subject?.subjectId,
    topic?.topicId,
  );
  const available = availability.data?.newCount ?? 0;
  const questionCount = count === "all" ? Math.min(30, available) : count;
  const shortage = questionCount > available;
  const groups = options.reduce<Record<string, typeof options>>(
    (result, item) => {
      (result[item.categoryName || "과목"] ??= []).push(item);
      return result;
    },
    {},
  );
  const canStart =
    !s.disabled &&
    !subjectsQuery.isError &&
    !availability.isPending &&
    !availability.isError &&
    !!subject &&
    questionCount >= 1 &&
    available > 0;
  const selectClass =
    "mt-3 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium disabled:bg-gray-50 disabled:text-muted-foreground";

  return (
    <main className="px-5 py-7 md:px-10 md:py-9">
      <section>
        <p className="text-sm font-semibold text-primary">
          검수된 문제만 골라서
        </p>
        <h1 className="mt-1 text-2xl font-bold md:text-[1.75rem]">
          오늘 풀 문제를 선택하세요
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          새 문제는 한 번도 풀지 않은 문제만 출제돼요. 이미 푼 문제와 진행 중인
          문제는 제외되고, 틀린 문제는 약점공략에 쌓여요.
        </p>
      </section>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canStart && subject) {
            const url = new URL(window.location.href);
            url.searchParams.set("subject", selected?.optionId ?? "");
            url.searchParams.set("topic", topic?.topicId ?? "");
            url.searchParams.set("count", String(questionCount));
            window.history.replaceState(null, "", url);
            void s
              .startHandcrafted(
                subject.subjectId,
                topic?.topicId ?? "",
                Math.min(questionCount, available),
              )
              .then((started) => {
                if (!started) void availability.refetch();
              });
          }
        }}
      >
        <section className="mt-7 space-y-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          {subjectsQuery.isPending ? (
            <LoadingIndicator
              label="과목 목록을 불러오는 중..."
              className="py-6"
            />
          ) : subjectsQuery.isError ? (
            <div role="alert" className="text-sm text-destructive">
              과목 목록을 불러오지 못했어요.
              <button
                type="button"
                onClick={() => void subjectsQuery.refetch()}
                className="ml-2 underline"
              >
                다시 불러오기
              </button>
            </div>
          ) : !s.catalog ? (
            <p className="text-sm text-muted-foreground">
              과목별 문항 수를 확인하지 못했어요. 위의 다시 불러오기를
              눌러주세요.
            </p>
          ) : (
            <>
              <div>
                <label
                  htmlFor="handcrafted-subject"
                  className="text-sm font-bold"
                >
                  과목
                </label>
                <select
                  id="handcrafted-subject"
                  value={selected?.optionId ?? ""}
                  disabled={s.disabled || !options.length}
                  className={selectClass}
                  aria-describedby="handcrafted-subject-help"
                  onChange={(event) => {
                    const option = options.find(
                      (item) => item.optionId === event.target.value,
                    );
                    if (!option || option.availableCount <= 0) return;
                    setSubjectId(option.optionId);
                    setTopicId("");
                  }}
                >
                  <option value="" disabled>
                    {options.length
                      ? "학습 가능한 과목이 없습니다"
                      : "등록된 과목이 없습니다"}
                  </option>
                  {Object.entries(groups).map(([category, subjects]) => (
                    <optgroup key={category} label={category}>
                      {subjects.map((item) => (
                        <option
                          key={item.optionId}
                          value={item.optionId}
                          disabled={item.availableCount === 0}
                        >
                          {item.name} ({item.availableCount}문항)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p
                  id="handcrafted-subject-help"
                  className="mt-2 text-xs leading-5 text-muted-foreground"
                >
                  0문항인 과목은 아직 준비 중이에요. 관리자가 문제를 등록하면
                  선택할 수 있어요.
                </p>
              </div>
              <fieldset disabled={s.disabled || !subject}>
                <legend className="text-sm font-bold">세부 주제</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { topicId: "", name: "전체" },
                    ...(subject?.topics ?? []),
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.topicId}
                      aria-pressed={(topic?.topicId ?? "") === item.topicId}
                      onClick={() => setTopicId(item.topicId)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${(topic?.topicId ?? "") === item.topicId ? "border-primary bg-primary text-white" : "border-gray-200 text-muted-foreground"}`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset disabled={s.disabled || !subject}>
                <legend className="text-sm font-bold">문항 수</legend>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {([3, 5, 10, 20, 30, "all"] as const).map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={count === value}
                      onClick={() => setCount(value)}
                      className={`h-11 rounded-xl border text-sm font-semibold disabled:opacity-40 ${count === value ? "border-primary bg-brandSecondary text-primary" : "border-gray-200 text-muted-foreground"}`}
                    >
                      {value === "all"
                        ? available > 30
                          ? "최대 30문제"
                          : "전체"
                        : `${value}문제`}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {availability.isPending
                    ? "새 문제 수를 확인하는 중..."
                    : `출제 가능한 새 문제 ${available}개`}
                </p>
              </fieldset>
            </>
          )}
        </section>
        {availability.isError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            문제 현황을 불러오지 못했어요.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void availability.refetch()}
            >
              다시 불러오기
            </button>
          </p>
        )}
        {availability.data && (
          <section
            aria-label="출제 전 문제 현황"
            className="mt-4 rounded-xl bg-accent p-4 text-sm"
          >
            <p>
              새 문제 {available}개 · 이미 풀어서 제외{" "}
              {availability.data.answeredCount}개
            </p>
            <p className="mt-2">
              약점공략 {availability.data.weaknessCount}개 · 진행 중{" "}
              {availability.data.inProgressCount}개
            </p>
            {shortage && (
              <p className="mt-3">
                요청한 {questionCount}문제 중 새 문제는 {available}개예요. 약점
                문제는 자동으로 섞지 않아요.
              </p>
            )}
            {available === 0 && (
              <p className="mt-3">선택한 범위의 새 문제를 모두 풀었어요.</p>
            )}
            {(shortage || available === 0) && (
              <div className="mt-3 flex flex-wrap gap-4">
                <Link
                  href="/learning/weakness?range=all&sources=HANDCRAFTED&sort=due"
                  className="font-semibold text-primary"
                >
                  약점공략 {availability.data.weaknessCount}문제 보기
                </Link>
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setTopicId("");
                    setSubjectId("");
                  }}
                >
                  조건 다시 선택
                </button>
              </div>
            )}
          </section>
        )}
        <button
          type="submit"
          disabled={!canStart}
          className="mt-5 h-14 w-full rounded-xl bg-primary text-base font-bold text-white shadow-sm disabled:opacity-40"
        >
          {s.busy
            ? "문제를 준비하는 중..."
            : shortage && available > 0
              ? `새 문제 ${available}개로 시작`
              : "새 문제 풀기"}
        </button>
      </form>
      <AttemptHistory session={s} />
      <Link
        href="/learning/review?category=HANDCRAFTED"
        className="mt-5 block text-sm font-semibold text-primary"
      >
        학습 기록 복습하기
      </Link>
    </main>
  );
}
