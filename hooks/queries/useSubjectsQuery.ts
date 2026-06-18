import { fetchAPI } from "@/lib/client/fetch";
import { useQuery } from "@tanstack/react-query";

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

export const subjectsQueryKey = ["subjects"] as const;

export const getSubjects = () => fetchAPI("/api/subjects", "GET");

export const useSubjectsQuery = () => {
  return useQuery<SubjectsResponse>({
    queryKey: subjectsQueryKey,
    queryFn: getSubjects,
  });
};
