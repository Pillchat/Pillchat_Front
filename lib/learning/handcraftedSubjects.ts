import type { Catalog } from "./api";

export type SubjectOption = {
  subjectId: number | string;
  name: string;
  categoryName: string;
};

// The subject directory includes unpublished subjects; only the learning catalog
// supplies available counts and the IDs/revisions accepted by the attempt API.
export function handcraftedSubjects(
  directory: SubjectOption[],
  catalog: Catalog,
) {
  return directory.map((subject) => {
    const matches = catalog.subjects.filter(
      (item) => item.name.trim() === subject.name.trim(),
    );
    const learningSubject =
      matches.find(
        (item) => String(item.subjectId) === String(subject.subjectId),
      ) ?? (matches.length === 1 ? matches[0] : undefined);
    return {
      ...subject,
      optionId: String(subject.subjectId),
      availableCount: learningSubject?.availableCount ?? 0,
      learningSubject,
    };
  });
}
