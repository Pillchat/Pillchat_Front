export type QuestionFormData = {
  title: string;
  content: string;
  subject: string;
  reward: string;
  images?: string[];
  subjectId: string;
};

export type QuestionCreateRequest = {
  title: string;
  content: string;
  subjectId: string;
  reward?: string;
};

export type QuestionResponse = {
  id: string;
  title: string;
  content: string;
  subject: string;
  reward: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};
