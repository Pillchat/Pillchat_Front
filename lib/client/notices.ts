import { fetchAPI } from "./fetch";

export type NoticeSummary = {
  id: string | number;
  title: string;
  type: string;
  pinned: boolean;
  publishedAt: string;
};
export type Notice = NoticeSummary & { content: string };
export type NoticePage = { content: NoticeSummary[]; last: boolean };
export type NoticeDraft = { title: string; content: string; pinned: boolean };

export const noticeTypeLabel = (type: string) =>
  ({
    MAINTENANCE: "점검",
    UPDATE: "업데이트",
    CONTEST: "이벤트",
    POLICY: "정책",
  })[type] ?? "안내";

export const formatNoticeDate = (value: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" })
    .format(new Date(value))
    .replaceAll("-", ".");

function summary(value: any): NoticeSummary {
  if (
    !value ||
    !(
      (typeof value.id === "string" && /^[1-9]\d*$/.test(value.id)) ||
      (Number.isSafeInteger(value.id) && value.id > 0)
    ) ||
    typeof value.title !== "string" ||
    typeof value.type !== "string" ||
    typeof value.pinned !== "boolean" ||
    typeof value.publishedAt !== "string" ||
    !Number.isFinite(Date.parse(value.publishedAt))
  )
    throw new Error("공지 응답을 확인하지 못했어요. 다시 시도해 주세요.");
  return value;
}

export async function readNotices(page = 0, size = 20): Promise<NoticePage> {
  const data = await fetchAPI("/api/notices", "GET", { page, size });
  if (!Array.isArray(data?.content) || typeof data.last !== "boolean")
    throw new Error("공지 목록을 확인하지 못했어요. 다시 시도해 주세요.");
  return { content: data.content.map(summary), last: data.last };
}

export async function readNotice(id: string): Promise<Notice> {
  const data = await fetchAPI(`/api/notices/${encodeURIComponent(id)}`, "GET");
  summary(data);
  if (typeof data.content !== "string")
    throw new Error("공지 내용을 확인하지 못했어요. 다시 시도해 주세요.");
  return data;
}

export async function createNotice(draft: NoticeDraft): Promise<NoticeSummary> {
  const title = draft.title.trim();
  const content = draft.content.trim();
  if (!title || !content) throw new Error("제목과 내용을 입력해 주세요.");
  const data = await fetchAPI("/api/admin/notices", "POST", {
    title,
    content,
    pinned: draft.pinned,
    type: "GENERAL",
    status: "PUBLISHED",
  });
  if (data?.status !== "PUBLISHED")
    throw new Error(
      "공지 게시 결과를 확인하지 못했어요. 공지 목록을 확인해 주세요.",
    );
  return summary(data);
}
