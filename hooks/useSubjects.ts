import { fetchAPI } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";

// API 데이터 타입 정의
export type SubjectItem = {
  code: string;
  label: string;
};

export type SubjectSection = {
  sectionCode: string;
  sectionTitle: string;
  items: SubjectItem[];
};

export type SubjectsResponse = {
  sections: SubjectSection[];
};

export const useSubjects = () => {
  const {
    data: response,
    isLoading,
    error,
  } = useQuery<SubjectsResponse>({
    queryKey: ["subjects"],
    queryFn: () => fetchAPI("/api/subjects", "GET"),
  });

  const subjects = response?.sections;

  // API 데이터에서 유틸리티 함수들
  const getSubjectByCode = (code: string): SubjectItem | undefined => {
    if (!subjects) return undefined;

    for (const section of subjects) {
      const item = section.items.find((item) => item.code === code);
      if (item) return item;
    }
    return undefined;
  };

  const getSubjectCodeByLabel = (label: string): string | undefined => {
    if (!subjects) return undefined;

    for (const section of subjects) {
      const item = section.items.find((item) => item.label === label);
      if (item) return item.code;
    }
    return undefined;
  };

  // SectionWithChips용 데이터 형태로 변환
  const getSubjectMapForChips = () => {
    if (!subjects) return {};

    return subjects.reduce(
      (acc, section) => {
        acc[section.sectionTitle] = section.items.map((item) => item.label);
        return acc;
      },
      {} as Record<string, string[]>,
    );
  };

  // 선택된 과목 코드들을 라벨로 변환
  const getSubjectLabelsByCodes = (codes: string[]): string[] => {
    if (!subjects) return [];

    return codes
      .map((code) => getSubjectByCode(code)?.label || code)
      .filter(Boolean);
  };

  return {
    subjects,
    isLoading,
    error,
    getSubjectByCode,
    getSubjectCodeByLabel,
    getSubjectMapForChips,
    getSubjectLabelsByCodes,
  };
};
