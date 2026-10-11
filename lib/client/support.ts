import {
  ApiError,
  fetchAPI,
  getValidAccessToken,
  recoverAccessToken,
} from "./fetch";

const BASE = "/api/support/inquiries";
export const SUPPORT_FILE_LIMIT = 10 * 1024 * 1024;
export const SUPPORT_TOTAL_LIMIT = 30 * 1024 * 1024;
type ServerId = string | number;
export type SupportAttachment = { id: string; name: string };
export type SupportAnswer = {
  content: string;
  authorName: string;
  answeredAt: string;
};
export type SupportInquirySummary = {
  id: string;
  title: string;
  content?: string;
  createdAt: string;
  status: "RECEIVED" | "IN_PROGRESS" | "ANSWERED";
};
export type SupportInquiry = SupportInquirySummary & {
  content: string;
  attachments: SupportAttachment[];
  answer: SupportAnswer | null;
};
export type SupportPage = {
  items: SupportInquirySummary[];
  page: number;
  hasNext: boolean;
};
export const supportStatusLabel = (status: SupportInquiry["status"]) =>
  ({ RECEIVED: "접수", IN_PROGRESS: "처리 중", ANSWERED: "답변 완료" })[status];
const invalidResponse = () =>
  new Error("서버 응답을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
function serverId(value: unknown): ServerId {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0)
    return value;
  throw invalidResponse();
}
function parseSummary(value: any): SupportInquirySummary {
  if (
    !value ||
    typeof value.title !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    !["RECEIVED", "IN_PROGRESS", "ANSWERED"].includes(value.status)
  )
    throw invalidResponse();
  return {
    id: String(serverId(value.id ?? value.inquiryId)),
    title: value.title,
    content: typeof value.content === "string" ? value.content : undefined,
    createdAt: value.createdAt,
    status: value.status,
  };
}
function parseInquiry(value: any): SupportInquiry {
  const summary = parseSummary(value);
  if (
    typeof value.content !== "string" ||
    !Array.isArray(value.attachments) ||
    (value.answer !== null &&
      (!value.answer ||
        typeof value.answer.content !== "string" ||
        typeof value.answer.authorName !== "string" ||
        !Number.isFinite(Date.parse(value.answer.answeredAt))))
  )
    throw invalidResponse();
  return {
    ...summary,
    content: value.content,
    answer: value.answer,
    attachments: value.attachments.map((a: any) => {
      const name =
        a.fileName ??
        a.originalFileName ??
        a.originalFilename ??
        a.originalName ??
        a.name ??
        "첨부파일";
      if (typeof name !== "string") throw invalidResponse();
      return { id: String(serverId(a.fileId ?? a.id)), name };
    }),
  };
}
export async function readSupportInquiries(page = 0): Promise<SupportPage> {
  const data = await fetchAPI(BASE, "GET", { page, size: 20 });
  if (!data || !Array.isArray(data.items) || typeof data.hasNext !== "boolean")
    throw invalidResponse();
  return { items: data.items.map(parseSummary), page, hasNext: data.hasNext };
}
export async function readSupportInquiry(id: string) {
  return parseInquiry(
    await fetchAPI(`${BASE}/${encodeURIComponent(id)}`, "GET"),
  );
}
export function validateSupportFiles(files: File[]): string | null {
  const images = files.filter((f) =>
    ["image/jpeg", "image/png"].includes(f.type),
  );
  const pdfs = files.filter((f) => f.type === "application/pdf");
  if (images.length + pdfs.length !== files.length)
    return "JPG, PNG 이미지나 PDF 파일을 선택해주세요.";
  if (
    images.length > 10 ||
    pdfs.length > 1 ||
    (images.length > 0 && pdfs.length > 0)
  )
    return "이미지 최대 10장 또는 PDF 1개를 첨부해주세요.";
  if (files.some((f) => f.size === 0))
    return "내용이 없는 파일은 첨부할 수 없습니다.";
  if (images.some((f) => f.size > SUPPORT_FILE_LIMIT))
    return "이미지는 한 장당 10MB까지 첨부할 수 있습니다.";
  if (files.reduce((sum, f) => sum + f.size, 0) > SUPPORT_TOTAL_LIMIT)
    return "PDF와 전체 첨부파일은 30MB까지 첨부할 수 있습니다.";
  return null;
}
export async function uploadSupportAttachment(file: File): Promise<ServerId> {
  const body = new FormData();
  body.append("file", file, file.name);
  const token = await getValidAccessToken();
  if (!token) throw new ApiError(401, { message: "로그인이 필요합니다." });
  const send = (accessToken: string) =>
    fetch("/api/support/attachments", {
      method: "POST",
      body,
      credentials: "same-origin",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  let response = await send(token);
  if (response.status === 401) {
    const recovered = await recoverAccessToken(token);
    if (recovered) response = await send(recovered);
  }
  if (!response.ok)
    throw new ApiError(
      response.status,
      await response.json().catch(() => ({})),
    );
  return serverId((await response.json()).fileId);
}

/** Retains uploaded IDs and the exact registration body across uncertain retries. */
export class SupportSubmission {
  private attachmentIds: ServerId[] = [];
  private body: {
    idempotencyKey: string;
    title: string;
    content: string;
    attachmentIds: ServerId[];
  } | null = null;
  uncertain = false;
  constructor(
    private readonly input: { title: string; content: string; files: File[] },
  ) {}
  async submit() {
    const title = this.input.title.trim();
    const content = this.input.content.trim();
    if (!title || title.length > 200 || !content || content.length > 1000)
      throw new Error("제목은 1~200자, 문의 내용은 1~1,000자로 입력해주세요.");
    const fileError = validateSupportFiles(this.input.files);
    if (fileError) throw new Error(fileError);
    for (
      let index = this.attachmentIds.length;
      index < this.input.files.length;
      index++
    ) {
      this.attachmentIds.push(
        await uploadSupportAttachment(this.input.files[index]),
      );
    }
    this.body ??= {
      idempotencyKey: crypto.randomUUID(),
      title,
      content,
      attachmentIds: [...this.attachmentIds],
    };
    try {
      const result = await fetchAPI(BASE, "POST", this.body);
      const id = String(serverId(result?.id ?? result?.inquiryId));
      this.uncertain = false;
      return { id };
    } catch (error) {
      this.uncertain =
        !(error instanceof ApiError) ||
        error.status >= 500 ||
        error.status === 408;
      throw error;
    }
  }
}
export async function downloadSupportAttachment(
  inquiryId: string,
  attachment: SupportAttachment,
) {
  const data = await fetchAPI(
    `${BASE}/${encodeURIComponent(inquiryId)}/attachments/${encodeURIComponent(attachment.id)}/download`,
    "GET",
  );
  if (typeof data?.downloadUrl !== "string") throw invalidResponse();
  const url = new URL(data.downloadUrl);
  if (!["https:", "http:"].includes(url.protocol)) throw invalidResponse();
  const anchor = document.createElement("a");
  anchor.href = url.href;
  anchor.download = attachment.name;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}
export function supportErrorMessage(error: unknown, submitting = false) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "로그인 후 이용해주세요.";
    if (error.status === 403) return "이 문의에 접근할 수 없습니다.";
    if (error.status === 413)
      return "첨부파일 용량이 너무 큽니다. 파일을 줄여 다시 제출해주세요.";
    if (error.status === 429)
      return "요청이 많습니다. 잠시 후 다시 시도해주세요.";
    if (error.status === 400) return "입력 내용과 첨부파일을 확인해주세요.";
    if (error.status === 409)
      return "이미 제출한 요청입니다. 문의 내역을 확인해주세요.";
  }
  return submitting
    ? "접수 여부를 확인하지 못했습니다. 문의 내역을 확인하거나 같은 내용으로 다시 시도해주세요."
    : "문의 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
}
