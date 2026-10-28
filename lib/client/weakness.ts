import { fetchAPI } from "@/lib/client/fetch";
import {
  WEAKNESS_SOURCES,
  type WeaknessLibrary,
  type WeaknessQuestion,
} from "@/lib/learning/weakness";
import type { ReviewCollectionPage } from "@/lib/learning/review";

type Detail = {
  questions: {
    sourceQuestionVersionId: string;
    latestOutcome: string;
    availableForReview: boolean;
    question: { subjectName: string };
  }[];
};

export async function readWeaknessLibrary(): Promise<WeaknessLibrary> {
  const groups = await Promise.all(
    WEAKNESS_SOURCES.map(async (source) => {
      const collections: WeaknessLibrary["collections"] = [];
      const visited = new Set<string>();
      let cursor: string | null = null;
      do {
        const page: ReviewCollectionPage = await fetchAPI(
          "/api/learning/review/collections",
          "GET",
          { source, cursor: cursor ?? undefined, limit: 100 },
        );
        for (const item of page.items)
          if (item.wrong > 0)
            collections.push({
              collectionRef: item.collectionRef,
              title: item.title,
              source,
            });
        cursor = page.nextCursor;
        if (cursor && visited.has(cursor))
          throw new Error("복습 목록을 다시 불러와 주세요.");
        if (cursor) visited.add(cursor);
      } while (cursor);
      return collections;
    }),
  );
  const collections = groups.flat();
  const questions = new Map<string, WeaknessQuestion>();
  for (let index = 0; index < collections.length; index += 4) {
    const batch = collections.slice(index, index + 4);
    const details = await Promise.all(
      batch.map(
        (item) =>
          fetchAPI(
            `/api/learning/review/collections/${encodeURIComponent(item.collectionRef)}`,
            "GET",
            { mode: "WRONG" },
          ) as Promise<Detail>,
      ),
    );
    details.forEach((detail, position) => {
      const collection = batch[position];
      for (const row of detail.questions) {
        if (!row.availableForReview || row.latestOutcome !== "INCORRECT")
          continue;
        const id = `${collection.source}:${row.sourceQuestionVersionId}`;
        if (!questions.has(id))
          questions.set(id, {
            id,
            source: collection.source,
            collectionRef: collection.collectionRef,
            subject: row.question.subjectName?.trim() || "과목 미분류",
          });
      }
    });
  }
  return { questions: [...questions.values()], collections };
}
