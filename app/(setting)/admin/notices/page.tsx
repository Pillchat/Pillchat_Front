"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/molecules/AppShell";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { NoticeArticle } from "@/components/notices/NoticeArticle";
import { useAdminNoticeAccessQuery } from "@/hooks/queries/useNoticesQuery";
import { useCreateNoticeMutation } from "@/hooks/mutations/useCreateNoticeMutation";
import { ApiError } from "@/lib/client/fetch";
import { useRouter } from "@/lib/navigation";

export default function AdminNoticesPage() {
  const router = useRouter();
  const access = useAdminNoticeAccessQuery();
  const create = useCreateNoticeMutation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(true);
  const [preview, setPreview] = useState(false);
  const [previewDate] = useState(() => new Date().toISOString());
  const submitting = useRef(false);
  const valid = !!title.trim() && !!content.trim();
  const uncertain =
    create.error &&
    (!(create.error instanceof ApiError) || create.error.status >= 500);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid || !access.isSuccess || submitting.current) return;
    submitting.current = true;
    try {
      const notice = await create.mutateAsync({ title, content, pinned });
      router.replace(`/notices/${encodeURIComponent(notice.id)}`);
    } catch {
      // Keep the draft on failure; a mutation is never retried automatically.
      submitting.current = false;
    }
  };

  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="none"
      className="pb-[calc(7rem+env(safe-area-inset-bottom))]"
    >
      <CustomHeader
        title={preview ? "공지 미리보기" : "공지 작성"}
        titleAlign="left"
      />
      {access.isPending ? (
        <LoadingIndicator label="관리자 권한 확인 중…" className="py-20" />
      ) : !access.isSuccess ? (
        <div className="space-y-4 px-6 py-12 text-center">
          <p role="alert" className="text-sm text-muted-foreground">
            {access.error instanceof ApiError &&
            [401, 403].includes(access.error.status)
              ? "관리자 계정만 이용할 수 있습니다."
              : "관리자 권한을 확인하지 못했어요. 다시 시도해 주세요."}
          </p>
          <Button variant="outline" onClick={() => void access.refetch()}>
            다시 확인
          </Button>
        </div>
      ) : (
        <form onSubmit={submit}>
          {preview ? (
            <NoticeArticle
              title={title.trim()}
              content={content.trim()}
              type="GENERAL"
              publishedAt={previewDate}
            />
          ) : (
            <fieldset
              disabled={create.isPending || create.isSuccess}
              className="space-y-6 px-6 py-6 md:px-10"
            >
              <div className="space-y-2">
                <label
                  htmlFor="notice-title"
                  className="block text-base font-semibold"
                >
                  제목{" "}
                  <span aria-hidden="true" className="text-primary">
                    *
                  </span>
                </label>
                <Input
                  id="notice-title"
                  required
                  value={title}
                  placeholder="공지 제목을 입력해 주세요"
                  className="h-11 rounded-lg"
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="notice-content"
                  className="block text-base font-semibold"
                >
                  내용{" "}
                  <span aria-hidden="true" className="text-primary">
                    *
                  </span>
                </label>
                <Textarea
                  id="notice-content"
                  required
                  value={content}
                  placeholder="공지 내용을 입력해 주세요"
                  className="max-h-[50dvh] min-h-[22rem] rounded-lg py-3 text-sm leading-6 shadow-none"
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="notice-pinned"
                  checked={pinned}
                  onCheckedChange={(checked) => setPinned(checked === true)}
                  className="mt-0.5 h-6 w-6 rounded-md"
                  aria-describedby="notice-pinned-help"
                />
                <div>
                  <label
                    htmlFor="notice-pinned"
                    className="cursor-pointer text-base font-semibold"
                  >
                    홈 상단에 표시
                  </label>
                  <p
                    id="notice-pinned-help"
                    className="mt-1 text-sm leading-5 text-muted-foreground"
                  >
                    홈에서 가장 먼저 보이는 공지로 게시해요.
                  </p>
                </div>
              </div>
            </fieldset>
          )}
          {create.isError && (
            <div
              role="alert"
              className="px-6 py-3 text-sm text-destructive md:px-10"
            >
              <p>
                {uncertain
                  ? "등록 결과를 확인하지 못했어요. 공지 목록을 확인한 뒤 다시 시도해 주세요."
                  : create.error.message}
              </p>
              {uncertain && (
                <Link href="/notices" className="mt-2 inline-block underline">
                  공지 목록 확인
                </Link>
              )}
            </div>
          )}
          <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto grid w-full max-w-app grid-cols-[1fr_1.55fr] gap-3 bg-white px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 md:px-10">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-lg border-gray-300"
              disabled={!valid || create.isPending || create.isSuccess}
              onClick={() => setPreview((value) => !value)}
            >
              {preview ? "수정하기" : "미리보기"}
            </Button>
            <Button
              type="submit"
              className="h-12 rounded-lg text-xl font-bold"
              disabled={!valid || create.isSuccess}
              loading={create.isPending}
            >
              공지 등록
            </Button>
          </footer>
        </form>
      )}
    </AppShell>
  );
}
