/** 오답노트 풀이 단계 */
export interface WrongNoteStep {
  id?: number;
  stepOrder: number;
  content: string;
}

/** 오답노트 이미지 */
export interface WrongNoteImage {
  id?: number;
  imageUrl: string;
  imageOrder: number;
  type: "QUESTION" | "ANSWER";
}

/** 오답노트 목록 아이템 */
export interface WrongNoteListItem {
  id: number;
  title: string;
  content: string;
  subjectCategory: string;
  userNickname: string;
  userId: number;
  likesCount: number;
  isLiked: boolean;
  stepCount: number;
  imageCount: number;
  createdAt: string;
}

/** 오답노트 목록 페이지네이션 응답 */
export interface WrongNoteListResponse {
  content: WrongNoteListItem[];
  totalElements: number;
  totalPages: number;
}

/** 오답노트 상세 */
export interface WrongNoteDetail {
  id: number;
  userId: number;
  userNickname: string;
  title: string;
  content: string;
  subjectCategory: string;
  questionSource: string;
  likesCount: number;
  isLiked: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  steps: WrongNoteStep[];
  images: WrongNoteImage[];
}

/** 오답노트 생성/수정 요청 */
export interface WrongNoteRequest {
  title: string;
  content: string;
  subjectCategory?: string;
  questionSource?: string;
  steps?: WrongNoteStep[];
  images?: WrongNoteImage[];
}

/** 좋아요 토글 응답 */
export interface WrongNoteLikeResponse {
  noteId: number;
  isLiked: boolean;
  likesCount: number;
}

/** 시험지 문제 */
export interface ExamQuestion {
  id: number;
  questionOrder: number;
  content: string;
  choices: string[] | null;
  answer: string;
  explanation: string;
  sourceSubject: string;
}

/** 시험지 상세/생성 응답 */
export interface WrongNoteExam {
  examId: number;
  title: string;
  questionCount: number;
  sourceNoteIds: number[];
  pdfS3Key: string | null;
  createdAt: string;
  questions: ExamQuestion[];
}

/** 시험지 목록 아이템 */
export interface WrongNoteExamListItem {
  examId: number;
  title: string;
  questionCount: number;
  hasPdf: boolean;
  createdAt: string;
}

/** 시험지 생성 요청 */
export interface GenerateExamRequest {
  noteIds: number[];
  title?: string;
  questionCount: number;
}
