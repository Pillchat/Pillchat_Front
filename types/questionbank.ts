/** 문제 생성 출처 */
export type QuizSourceType = "PDF" | "PREMIUM" | "REVIEW" | "BOOKMARK";

/** 채점 상태 (프론트엔드 전용) */
export type GradingState = "unanswered" | "answered" | "graded";

/** 복습 재풀이 모드 */
export type ResolveModeType = "all" | "wrong" | "bookmarked";

/** 문제 유형 */
export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "FILL_IN_BLANK";

/** AI 문제 생성 상태 */
export type GenerateStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

// ===== API 응답 타입 =====

/** PDF 업로드 응답 */
export interface PdfUploadResponse {
  fileId: number;
  fileName: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

/** PDF 추출 결과 응답 */
export interface PdfExtractResponse {
  fileId: number;
  fileName: string;
  status: string;
  extractedText?: string;
  extractedTextPreview?: string;
  extractedTextLength?: number;
  pageCount?: number;
  taskId?: number;
  taskStatus?: string;
  questions?: ServerQuestion[];
}

/** AI 문제 생성 요청 응답 */
export interface GenerateTaskResponse {
  taskId: number;
  status: GenerateStatus;
  message: string;
}

/** AI 문제 생성 상태 조회 응답 */
export interface GenerateStatusResponse {
  taskId: number;
  status: GenerateStatus;
  questionType: QuestionType;
  requestedCount: number;
  generatedCount: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

/** 서버에서 반환하는 문제 */
export interface ServerQuestion {
  id: number;
  type: QuestionType;
  subject: string;
  content: string;
  choices: string[] | null;
  answer: string;
  explanation: string | null;
  hint?: string | null;
  createdAt?: string;
}

/** AI 문제 생성 결과 응답 */
export interface GenerateResultResponse {
  taskId: number;
  status: GenerateStatus;
  questions: ServerQuestion[];
}

/** 퀴즈 세션 시작 응답 */
export interface QuizStartResponse {
  sessionId: number;
  type: QuizSourceType;
  questionCount: number;
  questions: Array<{
    id: number;
    type: QuestionType;
    subject: string;
    content: string;
    choices: string[] | null;
    hint?: string | null;
  }>;
}

/** 답안 제출 응답 */
export interface SubmitAnswerResponse {
  questionId: number;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  userAnswer: string;
}

/** 퀴즈 종료 응답 */
export interface QuizFinishResponse {
  sessionId: number;
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  startedAt: string;
  finishedAt: string;
  wrongCount: number;
  autoBookmarkedCount: number;
}

/** 퀴즈 결과 상세 조회 응답 */
export interface QuizResultResponse {
  sessionId: number;
  type: QuizSourceType;
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  startedAt: string;
  finishedAt: string;
  answers: Array<{
    questionId: number;
    questionType: QuestionType;
    subject: string;
    content: string;
    choices: string[];
    correctAnswer: string;
    explanation: string;
    userAnswer: string;
    isCorrect: boolean;
    answeredAt: string;
  }>;
}

/** 복습 카테고리 항목 (모음 단위) */
export interface ReviewCategoryItem {
  taskId: number;
  title: string;
  fileName: string | null;
  subject: string;
  totalQuestionCount: number;
  wrongCount: number;
}

/** 복습 문제 항목 (서버 응답) */
export interface ReviewQuestionResponse {
  questionId: number;
  questionType: QuestionType;
  subject: string;
  content: string;
  choices: string[];
  answer: string;
  explanation: string;
  hint?: string | null;
  isBookmarked: boolean;
  lastAnswerCorrect: boolean;
  lastAnsweredAt: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

/** 프리미엄 과목 */
export interface PremiumSubject {
  subjectId: number;
  code: string;
  name: string;
  categoryName: string;
}

/** 과목 하위 토픽 */
export interface SubjectTopic {
  topicId: number;
  name: string;
  subjectName: string;
}

/** 내 문제 생성 작업 항목 */
export interface MyTaskItem {
  taskId: number;
  status: string;
  questionType: QuestionType;
  subject: string;
  title: string;
  questionCount: number;
  generatedCount: number;
  createdAt: string;
  completedAt: string;
}

/** 북마크 토글 응답 */
export interface BookmarkToggleResponse {
  questionId: number;
  isBookmarked: boolean;
  source: string;
}

/** 북마크 목록 아이템 */
export interface BookmarkListItem {
  bookmarkId: number;
  questionId: number;
  questionType: QuestionType;
  subject: string;
  content: string;
  choices: string[] | null;
  answer: string;
  explanation: string;
  source: "MANUAL" | "AUTO";
  isBookmarked: boolean;
  bookmarkedAt: string;
}

/** 과목별 통계 */
export interface SubjectStat {
  subject: string;
  questionCount: number;
  correctCount: number;
  accuracy: number;
}

/** 주제별 통계 */
export interface TopicStat {
  topic: string;
  questionCount: number;
  correctCount: number;
  accuracy: number;
  quizSessionCount: number;
}

// ===== 프론트엔드 전용 타입 =====

/** 선지 (프론트에서 변환) */
export interface Choice {
  id: string; // "A", "B", "C", "D", "E"
  text: string;
}

/** 프론트엔드 퀴즈 문제 (서버 데이터를 변환) */
export interface QuizQuestion {
  id: number;
  questionType: QuestionType;
  passage: string;
  choices: Choice[];
  correctAnswer?: string; // 채점 후 서버에서 받은 정답
  explanation?: string; // 채점 후 서버에서 받은 해설
  subject: string;
  topic?: string;
  hint?: string | null;
}

/** 문제 풀이 결과 (프론트 로컬) */
export interface QuestionResult {
  questionId: number;
  selectedChoiceId: string | null;
  userAnswer: string | null;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
  isBookmarked: boolean;
}

/** 퀴즈 세션 (프론트 상태) */
export interface QuizSession {
  sessionId: number;
  sourceType: QuizSourceType;
  title: string;
  questions: QuizQuestion[];
  results: Record<number, QuestionResult>;
  currentIndex: number;
  gradingState: GradingState;
  selectedChoiceId: string | null;
  textAnswer: string | null;
  isComplete: boolean;
}

/** 복습 문제 항목 (프론트 표시용) */
export interface ReviewProblemItemData {
  questionId: number;
  index: number;
  passagePreview: string;
  answerPreview: string;
  isCorrect: boolean;
  isBookmarked: boolean;
}

/** 복습 필터 */
export interface ReviewFilter {
  tab: "pdf" | "premium";
  subject: string;
  wrongOnly: boolean;
  bookmarkedOnly: boolean;
  sortBy: "time" | "likes";
}
