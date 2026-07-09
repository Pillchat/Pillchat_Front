import { NextResponse } from "next/server";

import type { FlashcardDraft } from "@/types/flashcard";

type GenerationInput = {
  topic: string;
  text: string;
  fileName: string;
  fileText: string;
  pdfQuestions: GeneratedQuestion[];
};

type GeneratedQuestion = {
  subject?: string | null;
  content?: string | null;
  answer?: string | null;
  explanation?: string | null;
  choices?: string[] | null;
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const PDF_POLL_INTERVAL_MS = 1500;
const PDF_MAX_POLLS = 8;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST?.replace(/\/$/, "");
const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");

const trimText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const splitSentences = (text: string) =>
  text
    .replace(/\r/g, "\n")
    .split(/[\n.!?。！？]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

const compact = (value: string, fallback: string, maxLength = 96) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
};

const unwrapData = (payload: unknown) => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }

  return payload;
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isPdfFile = (file: File) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

const readJson = async (response: Response) =>
  (await response.json().catch(() => null)) as unknown;

async function extractPdfQuestions(
  file: File,
  request: Request,
): Promise<GeneratedQuestion[]> {
  if (!API_BASE_URL) return [];

  const authorization = request.headers.get("authorization");
  const headers: Record<string, string> = {};
  if (authorization)
    headers.Authorization = `Bearer ${normalizeToken(authorization)}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("questionCount", "5");

  const uploadResponse = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!uploadResponse.ok) return [];

  const uploadData = unwrapData(await readJson(uploadResponse)) as {
    fileId?: number | string;
  } | null;
  const fileId = uploadData?.fileId;
  if (!fileId) return [];

  for (let attempt = 0; attempt < PDF_MAX_POLLS; attempt += 1) {
    if (attempt > 0) await wait(PDF_POLL_INTERVAL_MS);

    const extractResponse = await fetch(
      `${API_BASE_URL}/api/pdf/${fileId}/extract`,
      { headers },
    );

    if (!extractResponse.ok) return [];

    const extractData = unwrapData(await readJson(extractResponse)) as {
      status?: string;
      taskStatus?: string;
      questions?: GeneratedQuestion[];
      extractedText?: string;
      extractedTextPreview?: string;
    } | null;

    if (
      extractData?.status === "FAILED" ||
      extractData?.taskStatus === "FAILED"
    ) {
      return [];
    }

    if (Array.isArray(extractData?.questions) && extractData.questions.length) {
      return extractData.questions;
    }

    if (extractData?.status === "DONE" && extractData.extractedText) {
      return [
        {
          subject: file.name,
          content: extractData.extractedText,
          answer: extractData.extractedTextPreview ?? "",
          explanation: extractData.extractedText.slice(0, 220),
        },
      ];
    }
  }

  return [];
}

async function readGenerationInput(request: Request): Promise<GenerationInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    let fileName = "";
    let fileText = "";
    let pdfQuestions: GeneratedQuestion[] = [];

    if (file instanceof File) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("8MB 이하의 파일만 업로드할 수 있어요.");
      }

      fileName = file.name;

      if (isPdfFile(file)) {
        pdfQuestions = await extractPdfQuestions(file, request);
        fileText = pdfQuestions
          .map((question) =>
            [
              question.subject,
              question.content,
              question.answer,
              question.explanation,
            ]
              .filter(Boolean)
              .join(" "),
          )
          .join("\n");
      } else if (
        file.type.startsWith("text/") ||
        /\.(txt|md|csv)$/i.test(file.name)
      ) {
        fileText = await file.text();
      } else {
        fileText = `${file.name} (${file.type || "첨부 파일"})`;
      }
    }

    return {
      topic: trimText(formData.get("topic")),
      text: trimText(formData.get("text")),
      fileName,
      fileText: trimText(fileText),
      pdfQuestions,
    };
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: string;
    text?: string;
  } | null;

  return {
    topic: trimText(body?.topic),
    text: trimText(body?.text),
    fileName: "",
    fileText: "",
    pdfQuestions: [],
  };
}

function buildCardsFromQuestions(input: GenerationInput): FlashcardDraft[] {
  const questions = input.pdfQuestions
    .filter(
      (question) => question.content || question.answer || question.explanation,
    )
    .slice(0, 5);
  const title = compact(
    input.topic || input.fileName || questions[0]?.subject || "",
    "PDF 학습 자료",
    34,
  );

  const cards = questions.map((question, index): FlashcardDraft => {
    const answer = [question.answer, question.explanation]
      .filter(Boolean)
      .join(" - ");

    return {
      type: "concept",
      term: compact(
        question.content ?? question.subject ?? "",
        `${title} 핵심 ${index + 1}`,
        88,
      ),
      definition: compact(answer, "정답과 해설을 함께 복습하세요.", 180),
    };
  });

  if (questions.length >= 2) {
    cards.push({
      type: "compare",
      nameA: compact(questions[0]?.subject ?? title, `${title} A`, 24),
      nameB: compact(questions[1]?.subject ?? "관련 개념", `${title} B`, 24),
      common: compact(
        questions[0]?.content ?? "",
        "같은 자료에서 함께 출제된 핵심 개념입니다.",
        110,
      ),
      difference: compact(
        questions[1]?.content ?? "",
        "정답, 해설, 임상 포인트의 차이를 비교하세요.",
        130,
      ),
    });
  }

  return cards.slice(0, 5);
}

function buildCards(input: GenerationInput): FlashcardDraft[] {
  if (input.pdfQuestions.length) {
    return buildCardsFromQuestions(input);
  }

  const source = [input.topic, input.text, input.fileText]
    .filter(Boolean)
    .join("\n");
  const sentences = splitSentences(source);
  const title = compact(
    input.topic || sentences[0] || input.fileName,
    "학습 자료",
    34,
  );
  const first = compact(
    sentences[0] ?? "",
    `${title}의 핵심 개념을 정리하세요.`,
  );
  const second = compact(
    sentences[1] ?? sentences[0] ?? "",
    `${title}의 작용 기전과 임상 포인트를 연결하세요.`,
  );
  const relationSource =
    sentences.find((sentence) =>
      /→|->|억제|차단|증가|감소|활성|분해|축적|유발|원인|결과/.test(sentence),
    ) ?? second;
  const relationParts = relationSource
    .split(/→|->/)
    .map((part) => part.trim())
    .filter(Boolean);
  const trigger = compact(
    relationParts[0] ?? input.topic,
    `${title} 관련 자극`,
    42,
  );
  const effect = compact(
    relationParts.slice(1).join(" → ") || relationSource,
    `${title}의 결과`,
    58,
  );
  const comparisonSeeds = source
    .split(/,|\/| vs | VS |와 |과 | 및 /)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 24);
  const nameA = compact(comparisonSeeds[0] ?? title, `${title} A`, 24);
  const nameB = compact(comparisonSeeds[1] ?? "임상 포인트", `${title} B`, 24);

  return [
    {
      type: "concept",
      term: title,
      definition: first,
    },
    {
      type: "relation",
      trigger,
      effect,
      mechanism: compact(
        relationSource,
        `${trigger} → ${effect} 흐름을 기전 중심으로 설명하세요.`,
        140,
      ),
    },
    {
      type: "compare",
      nameA,
      nameB,
      common: compact(
        sentences[2] ?? `${nameA}와 ${nameB}는 같은 주제에서 함께 비교됩니다.`,
        `${nameA}와 ${nameB}의 공통점을 정리하세요.`,
        110,
      ),
      difference: compact(
        sentences[3] ??
          "적응증, 부작용, 금기, 작용 시간 중 시험에 자주 나오는 차이를 정리하세요.",
        "차이점을 정리하세요.",
        130,
      ),
    },
  ];
}

export async function POST(request: Request) {
  try {
    const input = await readGenerationInput(request);
    const hasSource = !!(input.topic || input.text || input.fileText);

    if (!hasSource) {
      return NextResponse.json(
        { message: "주제, 학습 자료 텍스트, 파일 중 하나를 입력해 주세요." },
        { status: 400 },
      );
    }

    return NextResponse.json({ cards: buildCards(input) });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "카드를 생성하지 못했어요.",
      },
      { status: 400 },
    );
  }
}
