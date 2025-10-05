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
  subject: string;
  reward: string;
  keys: string[];
  createdAt: string;
  updatedAt: string;
};
