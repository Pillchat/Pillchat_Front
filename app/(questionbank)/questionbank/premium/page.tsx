"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { fetchAPI } from "@/lib/functions";
import { initQuizSessionAtom, mapChoices } from "@/store/quizSession";
import { CustomHeader } from "@/components/molecules";
import { SolidButton } from "@/components/atoms";
import LoadingOverlay from "../_components/LoadingOverlay";
import SubjectTopicModal from "../_components/SubjectTopicModal";
import { cn } from "@/lib/utils";
import type {
  QuestionType,
  PremiumSubject,
  SubjectTopic,
  GenerateStatusResponse,
  QuizStartResponse,
} from "@/types/questionbank";

const POLL_INTERVAL = 2000;

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "객관식" },
  { value: "TRUE_FALSE", label: "참/거짓" },
  { value: "SHORT_ANSWER", label: "단답형" },
  { value: "FILL_IN_BLANK", label: "빈칸 채우기" },
];

const PremiumPage = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Record<string, PremiumSubject[]>>(
    {},
  );
  const [selectedSubject, setSelectedSubject] = useState<PremiumSubject | null>(
    null,
  );
  const [selectedTopic, setSelectedTopic] = useState<SubjectTopic | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] =
    useState<QuestionType | null>(null);
  const [questionCount, setQuestionCount] = useState<string>("5");
  const [subjectHint, setSubjectHint] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initSession = useSetAtom(initQuizSessionAtom);
  const abortRef = useRef(false);

  // 토픽 모달 관련 state
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicSubject, setTopicSubject] = useState<PremiumSubject | null>(null);
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);

  // 토픽 캐시 (subjectId → topics[])
  const topicCacheRef = useRef<Record<number, SubjectTopic[]>>({});

  // 과목 목록 가져오기
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const raw = await fetchAPI(
          "/api/questionbank/ai-questions/subjects",
          "GET",
        );
        const data: PremiumSubject[] = raw.data ?? raw;
        // categoryName으로 그룹핑
        const grouped: Record<string, PremiumSubject[]> = {};
        (Array.isArray(data) ? data : []).forEach((s) => {
          if (!grouped[s.categoryName]) grouped[s.categoryName] = [];
          grouped[s.categoryName].push(s);
        });
        setSubjects(grouped);
      } catch {
        setError("과목 목록을 불러오지 못했습니다.");
      }
    };
    fetchSubjects();
  }, []);

  /** 과목 칩 클릭 — 토픽 fetch 후 분기 */
  const handleSubjectClick = async (subject: PremiumSubject) => {
    // 캐시 확인
    if (topicCacheRef.current[subject.subjectId] !== undefined) {
      const cached = topicCacheRef.current[subject.subjectId];
      if (cached.length > 0) {
        setTopicSubject(subject);
        setTopics(cached);
        setShowTopicModal(true);
      } else {
        // 토픽 없는 과목 → 바로 선택
        setSelectedSubject(subject);
        setSelectedTopic(null);
        setSubjectHint("");
      }
      return;
    }

    // 토픽 fetch
    setTopicSubject(subject);
    setTopicLoading(true);
    setShowTopicModal(true);

    try {
      const raw = await fetchAPI(
        `/api/questionbank/ai-questions/subjects/${subject.subjectId}/topics`,
        "GET",
      );
      const data: SubjectTopic[] = raw.data ?? raw;
      const list = Array.isArray(data) ? data : [];
      topicCacheRef.current[subject.subjectId] = list;
      setTopics(list);

      if (list.length === 0) {
        // 토픽 없으면 모달 닫고 바로 선택
        setShowTopicModal(false);
        setSelectedSubject(subject);
        setSelectedTopic(null);
        setSubjectHint("");
      }
    } catch {
      setShowTopicModal(false);
      setSelectedSubject(subject);
      setSelectedTopic(null);
      setSubjectHint("");
    } finally {
      setTopicLoading(false);
    }
  };

  /** 토픽 선택 */
  const handleTopicSelect = (topic: SubjectTopic) => {
    setSelectedSubject(topicSubject);
    setSelectedTopic(topic);
    setSubjectHint(topic.name);
    setShowTopicModal(false);
  };

  const parsedCount = Number(questionCount);
  const isFormValid =
    selectedSubject &&
    selectedQuestionType &&
    parsedCount >= 1 &&
    parsedCount <= 20;

  /** 생성 상태 폴링 */
  const pollStatus = useCallback(
    async (taskId: number): Promise<GenerateStatusResponse> => {
      while (!abortRef.current) {
        const raw = await fetchAPI(
          `/api/questionbank/ai-questions/status/${taskId}`,
          "GET",
        );
        const status: GenerateStatusResponse = raw.data ?? raw;
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          return status;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
      throw new Error("취소됨");
    },
    [],
  );

  const handleGenerate = async () => {
    if (!isFormValid || !selectedSubject || !selectedQuestionType) return;
    setIsLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      // 1) AI 문제 생성 요청 (premium)
      const generateRaw = await fetchAPI(
        "/api/questionbank/ai-questions",
        "POST",
        {
          type: "premium",
          subjectId: selectedSubject.subjectId,
          questionType: selectedQuestionType,
          questionCount: parsedCount,
          subjectHint: subjectHint.trim() || undefined,
        },
      );
      const generateData = generateRaw.data ?? generateRaw;

      const taskId = generateData.taskId;
      if (!taskId)
        throw new Error("문제 생성 요청에서 taskId를 받지 못했습니다.");

      // 2) 생성 완료까지 폴링
      const finalStatus = await pollStatus(taskId);
      if (finalStatus.status === "FAILED") {
        throw new Error(
          finalStatus.errorMessage || "문제 생성에 실패했습니다.",
        );
      }

      // 3) 퀴즈 세션 시작
      const quizRaw = await fetchAPI("/api/questionbank/quiz", "POST", {
        type: "PREMIUM",
        taskId,
      });
      const quizData: QuizStartResponse = quizRaw.data ?? quizRaw;

      // 4) 세션 초기화 → 풀이 화면 이동
      initSession({
        sessionId: quizData.sessionId,
        sourceType: "PREMIUM",
        title: `${selectedSubject.name} 수제 제작 문제`,
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
    } catch (err: any) {
      if (!abortRef.current) {
        setError(err.message || "오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <CustomHeader title="고퀄리티 AI 문제 제작" showIcon />

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* 과목 선택 */}
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-foreground">
            과목 선택
          </h3>
          {Object.entries(subjects).map(([category, subs]) => (
            <div key={category} className="mb-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {subs.map((subject) => (
                  <React.Fragment key={subject.subjectId}>
                    <button
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm transition-colors",
                        selectedSubject?.subjectId === subject.subjectId
                          ? "border-brand bg-brandSecondary font-medium text-brand"
                          : "border-gray-200 text-muted-foreground",
                      )}
                      onClick={() => handleSubjectClick(subject)}
                    >
                      {subject.name}
                      {/* 토픽이 있는 과목에 셰브론 표시 */}
                      {topicCacheRef.current[subject.subjectId]?.length > 0 && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </button>
                    {/* 해당 과목이 선택되었고 토픽이 있으면 칩 옆에 표시 */}
                    {selectedSubject?.subjectId === subject.subjectId &&
                      selectedTopic && (
                        <span className="rounded-full border border-brand bg-brandSecondary px-3 py-2 text-sm font-medium text-brand">
                          {selectedTopic.name.replace(/\s*\(.*?\)\s*/g, "")}
                        </span>
                      )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(subjects).length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              과목 목록 로딩 중...
            </p>
          )}
        </div>

        {/* 문제 유형 선택 */}
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-foreground">
            문제 유형
          </h3>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((qt) => (
              <button
                key={qt.value}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  selectedQuestionType === qt.value
                    ? "border-brand bg-brandSecondary font-medium text-brand"
                    : "border-gray-200 text-muted-foreground",
                )}
                onClick={() => setSelectedQuestionType(qt.value)}
              >
                {qt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 문제 수 입력 */}
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-foreground">
            문제 수
          </h3>
          <input
            type="number"
            min="1"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-brand"
            placeholder="문제 수를 입력하세요 (최대 20개)"
          />
        </div>

        {/* 추가 힌트 (선택) */}
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-foreground">
            추가 힌트
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (선택)
            </span>
          </h3>
          <input
            type="text"
            value={subjectHint}
            onChange={(e) => setSubjectHint(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-brand"
            placeholder="예: 항생제 중심으로"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 px-6 pb-6">
        <SolidButton
          content="문제 생성"
          disabled={!isFormValid || isLoading}
          variant={isFormValid && !isLoading ? "brand" : "disabled"}
          onClick={handleGenerate}
        />
      </div>
      {isLoading && <LoadingOverlay />}

      {/* 토픽 선택 모달 */}
      <SubjectTopicModal
        isOpen={showTopicModal}
        subjectName={topicSubject?.name ?? ""}
        topics={topics}
        loading={topicLoading}
        onSelect={handleTopicSelect}
        onClose={() => setShowTopicModal(false)}
      />
    </div>
  );
};

export default PremiumPage;
