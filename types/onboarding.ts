export type OnboardingStudent = {
  grade: string;
  age: number;
  studyDays: string[];
  studyTimes: string[];
  weakSubjects: string[]; // subject codes (e.g., ["BIO-BIOCHEM", "IND-ANAL"])
  strongSubjects: string[]; // subject codes
  courses: {
    year: number;
    subjects: string[]; // subject codes
    customSubjects: string[];
  }[];
};

export type OnboardingProfessional = {
  strongSubjects: string[]; // subject codes (e.g., ["BIO-BIOCHEM", "IND-ANAL"])
  job: string;
  workplace?: string;
  availableDays: string[];
  availableTimes: string[];
  answerCycle: string;
  avgAnswerCount: number;
};
