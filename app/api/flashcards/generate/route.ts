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
const PDF_MAX_POLLS = 60;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST?.replace(/\/$/, "");
const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");

class GenerationApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GenerationApiError";
  }
}

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

const readResponseError = async (response: Response, fallback: string) => {
  const text = await response.text();

  if (!text.trim()) return fallback;

  try {
    const payload = JSON.parse(text) as {
      message?: unknown;
      error?: unknown;
      errorMessage?: unknown;
    };
    const message = [payload.message, payload.errorMessage, payload.error].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );

    return message ?? fallback;
  } catch {
    return text;
  }
};

async function extractPdfQuestions(
  file: File,
  request: Request,
): Promise<GeneratedQuestion[]> {
  if (!API_BASE_URL) {
    throw new GenerationApiError("백엔드 API 주소가 설정되지 않았습니다.", 500);
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    throw new GenerationApiError(
      "로그인이 필요합니다. 다시 로그인해주세요.",
      401,
    );
  }

  const headers = {
    Authorization: `Bearer ${normalizeToken(authorization)}`,
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("questionCount", "5");

  const uploadResponse = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new GenerationApiError(
      await readResponseError(uploadResponse, "PDF 업로드에 실패했습니다."),
      uploadResponse.status,
    );
  }

  const uploadData = unwrapData(await readJson(uploadResponse)) as {
    fileId?: number | string;
  } | null;
  const fileId = uploadData?.fileId;
  if (!fileId) {
    throw new GenerationApiError(
      "PDF 업로드 응답에서 fileId를 받지 못했습니다.",
      502,
    );
  }

  let extractedTextPreview = "";

  for (let attempt = 0; attempt < PDF_MAX_POLLS; attempt += 1) {
    if (attempt > 0) await wait(PDF_POLL_INTERVAL_MS);

    const extractResponse = await fetch(
      `${API_BASE_URL}/api/pdf/${fileId}/extract`,
      { headers },
    );

    if (!extractResponse.ok) {
      throw new GenerationApiError(
        await readResponseError(
          extractResponse,
          "PDF 문제 생성 상태를 확인하지 못했습니다.",
        ),
        extractResponse.status,
      );
    }

    const extractData = unwrapData(await readJson(extractResponse)) as {
      status?: string;
      taskStatus?: string;
      questions?: GeneratedQuestion[];
      extractedTextPreview?: string;
      errorMessage?: string;
    } | null;

    if (extractData?.extractedTextPreview?.trim()) {
      extractedTextPreview = extractData.extractedTextPreview.trim();
    }

    if (
      extractData?.status === "FAILED" ||
      extractData?.taskStatus === "FAILED"
    ) {
      throw new GenerationApiError(
        extractData.errorMessage ||
          "PDF 텍스트 추출 또는 문제 생성에 실패했습니다.",
        422,
      );
    }

    if (Array.isArray(extractData?.questions) && extractData.questions.length) {
      return extractData.questions;
    }

    if (
      extractData?.status === "DONE" &&
      extractData.taskStatus === "COMPLETED" &&
      extractedTextPreview
    ) {
      return [
        {
          subject: file.name,
          content: extractedTextPreview,
          answer: extractedTextPreview,
          explanation: extractedTextPreview.slice(0, 220),
        },
      ];
    }
  }

  if (extractedTextPreview) {
    return [
      {
        subject: file.name,
        content: extractedTextPreview,
        answer: extractedTextPreview,
        explanation: extractedTextPreview.slice(0, 220),
      },
    ];
  }

  throw new GenerationApiError(
    "PDF 문제 생성 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
    504,
  );
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
  const cardSources = sentences.length ? sentences : [source];

  return cardSources.slice(0, 5).map((sentence, index) => ({
    type: "concept" as const,
    term: compact(
      index === 0 && input.topic ? input.topic : `${title} 핵심 ${index + 1}`,
      `${title} 핵심 ${index + 1}`,
      88,
    ),
    definition: compact(
      sentence,
      `${title}에서 기억해야 할 내용을 정리하세요.`,
      180,
    ),
  }));
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
      { status: error instanceof GenerationApiError ? error.status : 400 },
    );
  }
}
