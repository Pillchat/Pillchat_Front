"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import { CustomHeader } from "@/components/molecules";
import { FloatingActionButton } from "@/components/atoms";
import TaskItem from "../_components/TaskItem";
import LoadingOverlay from "../_components/LoadingOverlay";
import { cn } from "@/lib/utils";
import type { MyTaskItem, QuizStartResponse } from "@/types/questionbank";

const MyTasksPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<MyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const initSession = useSetAtom(initQuizSessionAtom);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const raw = await fetchAPI("/api/questionbank/my-tasks", "GET");
        const data: MyTaskItem[] = raw.data ?? raw;
        setTasks(Array.isArray(data) ? data : []);
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // 과목 목록 추출
  const subjects = useMemo(() => {
    const set = new Set(tasks.map((t) => t.subject));
    return Array.from(set);
  }, [tasks]);

  // 필터 적용
  const filteredTasks = useMemo(() => {
    if (!selectedSubject) return tasks;
    return tasks.filter((t) => t.subject === selectedSubject);
  }, [tasks, selectedSubject]);

  const handleTaskClick = async (task: MyTaskItem) => {
    setStarting(true);
    try {
      const quizRaw = await fetchAPI("/api/questionbank/quiz", "POST", {
        type: "PDF",
        taskId: task.taskId,
      });
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;

      initSession({
        sessionId: quizData.sessionId,
        sourceType: "PDF",
        title: task.title,
        questions: quizData.questions.map((q) => ({
          id: q.id,
          questionType: q.type,
          passage: q.content,
          choices: mapChoices(q.choices),
          subject: q.subject,
          hint: q.hint,
        })),
      });
      router.push("/questionbank/solve");
    } catch {
      alert("퀴즈 시작에 실패했습니다.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="내 학습자료로 문제 생성" showIcon />

      {/* 과목 필터 */}
      {tasks.length > 0 && (
        <div className="border-b px-6 py-3">
          <button
            className="flex items-center gap-1 text-sm text-muted-foreground"
            onClick={() => setShowFilter(!showFilter)}
          >
            과목별로 보기
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("transition-transform", showFilter && "rotate-180")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showFilter && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  !selectedSubject
                    ? "border-brand bg-brandSecondary font-medium text-brand"
                    : "border-gray-200 text-muted-foreground",
                )}
                onClick={() => setSelectedSubject(null)}
              >
                전체
              </button>
              {subjects.map((subject) => (
                <button
                  key={subject}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    selectedSubject === subject
                      ? "border-brand bg-brandSecondary font-medium text-brand"
                      : "border-gray-200 text-muted-foreground",
                  )}
                  onClick={() => setSelectedSubject(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">불러오는 중...</div>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.taskId}
              task={task}
              onClick={() => handleTaskClick(task)}
            />
          ))
        ) : tasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6">
            <p className="text-center text-muted-foreground">
              생성된 문제집이 없습니다.
            </p>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              자료를 업로드하여 문제를 생성해주세요.
            </p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              해당 과목의 문제집이 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* FAB — 문제 생성 */}
      <FloatingActionButton
        mainIcon={
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        }
        size="md"
        bottom={32}
        right={24}
        onMainClick={() => router.push("/questionbank/generate")}
      />

      {starting && <LoadingOverlay message="퀴즈 준비 중..." />}
    </div>
  );
};

export default MyTasksPage;
