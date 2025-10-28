export type QuestionFormData = {
  title: string;
  content: string;
  subject: string;
  keys: string[];
  subjectId: string;
};

export type QuestionCreateRequest = {
  title: string;
  content: string;
  subjectId: string;
  reward?: string;
  keys?: string[];
};

export type QuestionResponse = {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  nickname: string;
  answerCount: number;
  viewCount: number;
  likeCount: number;
  images?: { id: string; urlKey: string }[];
};

export type Author = {
  id: number;
  nickname: string;
  school: string;
  grade: string;
  avatarUrl: string;
  isMe: boolean;
};

export type AnswerStep = {
  stepId: string;
  content: string;
  images: string[];
};

export type Answer = {
  id: number;
  questionId: number;
  author: Author;
  accepted: boolean;
  likeCount: number;
  createdAt: string;
  steps: AnswerStep[];
  stepTotal: number;
  hasMoreSteps: boolean;
};

export type AnswerListResponse = {
  totalPages: number;
  page: number;
  items: Answer[];
  totalElements: number;
  hasNext: boolean;
  size: number;
};
