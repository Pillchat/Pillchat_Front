import { serverFetch } from "@/lib/server/fetch";
import { NextRequest, NextResponse } from "next/server";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getPositiveInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const enrichSubjectIds = async (data: unknown, request: NextRequest) => {
  if (!isRecord(data) || !Array.isArray(data.sections)) return data;

  const codes = Array.from(
    new Set(
      data.sections.flatMap((section) => {
        if (!isRecord(section) || !Array.isArray(section.items)) return [];

        return section.items.flatMap((item) => {
          if (!isRecord(item) || getPositiveInteger(item.id)) return [];
          return typeof item.code === "string" && item.code.trim()
            ? [item.code]
            : [];
        });
      }),
    ),
  );

  const subjectDetails = await Promise.allSettled(
    codes.map(async (code) => {
      const detail = await serverFetch(
        `/api/subjects/${encodeURIComponent(code)}`,
        {
          method: "GET",
          request,
        },
      );
      const id = isRecord(detail) ? getPositiveInteger(detail.id) : undefined;
      return [code, id] as const;
    }),
  );
  const idsByCode = new Map<string, number>();

  subjectDetails.forEach((result) => {
    if (result.status !== "fulfilled") return;
    const [code, id] = result.value;
    if (id) idsByCode.set(code, id);
  });

  return {
    ...data,
    sections: data.sections.map((section) => {
      if (!isRecord(section) || !Array.isArray(section.items)) return section;

      return {
        ...section,
        items: section.items.map((item) => {
          if (!isRecord(item) || typeof item.code !== "string") return item;
          const id = getPositiveInteger(item.id) ?? idsByCode.get(item.code);
          return id ? { ...item, id } : item;
        }),
      };
    }),
  };
};

export const GET = async (request: NextRequest) => {
  try {
    const data = await serverFetch(`/api/subjects/ui`, {
      method: "GET",
      request,
    });

    return NextResponse.json(await enrichSubjectIds(data, request));
  } catch (error) {
    let errorInfo: { message?: string; status?: number } = {};

    if (error instanceof Error) {
      try {
        errorInfo = JSON.parse(error.message);
      } catch {
        errorInfo = { message: error.message };
      }
    }

    return NextResponse.json(
      { message: errorInfo.message || "Subjects API 에러" },
      { status: errorInfo.status || 500 },
    );
  }
};
