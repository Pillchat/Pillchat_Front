import { formatNoticeDate, noticeTypeLabel } from "@/lib/client/notices";

export function NoticeArticle({
  title,
  content,
  type,
  publishedAt,
}: {
  title: string;
  content: string;
  type: string;
  publishedAt: string;
}) {
  return (
    <article className="break-words px-6 py-6 md:px-10">
      <span className="inline-flex rounded-md bg-brandSecondary px-3 py-1.5 text-sm font-semibold text-primary">
        {noticeTypeLabel(type)}
      </span>
      <h1 className="mt-3 text-xl font-bold leading-7">{title}</h1>
      <time
        dateTime={publishedAt}
        className="mt-3 block text-sm text-muted-foreground"
      >
        {formatNoticeDate(publishedAt)}
      </time>
      <div className="my-5 border-t border-gray-200" />
      <p className="whitespace-pre-wrap text-base leading-7">{content}</p>
    </article>
  );
}
