"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { AppShell } from "@/components/molecules/AppShell";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { Button } from "@/components/ui/button";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { useMyStudentVerificationQuery } from "@/hooks/queries/useStudentVerificationQuery";
import { useSubmitStudentVerificationMutation } from "@/hooks/mutations/useStudentVerificationMutation";
import {
  StudentVerificationSubmission,
  validateStudentIdImage,
} from "@/lib/client/studentVerification";

export default function StudentVerificationPage() {
  const userId = useAuthIdentity();
  return <StudentVerificationForm key={userId ?? "guest"} userId={userId} />;
}
function StudentVerificationForm({ userId }: { userId: string | null }) {
  const current = useMyStudentVerificationQuery();
  const submit = useSubmitStudentVerificationMutation();
  const [attachment, setAttachment] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [fileError, setFileError] = useState("");
  const submission = useRef<StudentVerificationSubmission | null>(null);
  const submitLock = useRef(false);
  const status = current.data?.status;
  const submitted = status === "PENDING" || status === "APPROVED";
  const locked =
    submitted || submit.isPending || !!submission.current?.uncertain;
  const previewUrl =
    attachment?.url ?? (submitted ? current.data?.imageUrl : undefined);
  const canSubmit =
    !!userId &&
    !!attachment &&
    imageReady &&
    current.isSuccess &&
    !submitted &&
    !submit.isPending;

  useEffect(() => {
    const url = attachment?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [attachment]);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || locked) return;
    setFileError("");
    setImageReady(false);
    setAttachment(null);
    submission.current = null;
    submit.reset();
    const error = validateStudentIdImage(file);
    if (error) {
      setFileError(error);
      return;
    }
    setAttachment({ file, url: URL.createObjectURL(file) });
  };
  const requestVerification = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !attachment || submitLock.current) return;
    submitLock.current = true;
    submission.current ??= new StudentVerificationSubmission(attachment.file);
    try {
      await submit.mutateAsync(submission.current);
    } catch {
      /* Keep the selected image and retry key on failure. */
    } finally {
      submitLock.current = false;
    }
  };
  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="none"
      className="pb-[calc(10rem+env(safe-area-inset-bottom))]"
    >
      <div className="border-b border-gray-100">
        <CustomHeader title="학생 인증" titleAlign="left" />
      </div>
      <main className="px-6 pt-8">
        <form
          id="student-verification-form"
          onSubmit={requestVerification}
          className="mx-auto max-w-[35rem]"
        >
          <label
            className={
              "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gray-100/30 focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-primary " +
              (previewUrl
                ? "border border-gray-100"
                : "min-h-[228px] border border-dashed border-gray-500 sm:min-h-60")
            }
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="학생증 사진 첨부 또는 변경"
              aria-describedby={fileError ? "student-id-error" : undefined}
              aria-invalid={!!fileError}
              disabled={
                locked || current.isPending || current.isError || !userId
              }
              onChange={selectImage}
              className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
            />
            {previewUrl ? (
              // Private signed URLs and local Blob previews must not pass through a shared image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={previewUrl}
                src={previewUrl}
                alt="첨부한 학생증 사진 미리보기"
                className="max-h-[55dvh] w-full object-contain"
                referrerPolicy="no-referrer"
                onLoad={() => setImageReady(true)}
                onError={() => {
                  setImageReady(false);
                  setFileError(
                    "사진을 열 수 없어요. 다른 사진을 선택해주세요.",
                  );
                }}
              />
            ) : (
              <span className="grid justify-items-center gap-4 py-10 text-body-large text-gray-800">
                <ImagePlus
                  size={32}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="text-gray-500"
                />
                <span>학생증 사진 첨부</span>
              </span>
            )}
          </label>
          {fileError && (
            <p
              id="student-id-error"
              role="alert"
              className="mt-3 text-body-medium text-destructive"
            >
              {fileError}
            </p>
          )}
          {current.isError && (
            <div
              role="alert"
              className="mt-4 space-y-3 text-body-medium text-gray-800"
            >
              <p>인증 정보를 불러오지 못했어요. 다시 시도해주세요.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void current.refetch()}
              >
                다시 확인
              </Button>
            </div>
          )}
          {!userId && (
            <p role="alert" className="mt-4 text-body-medium text-gray-800">
              로그인 후 학생 인증을 요청해주세요.
            </p>
          )}
          {!attachment && status === "REJECTED" && (
            <p role="status" className="mt-4 text-body-medium text-gray-800">
              이전 인증 요청이 거부되었어요. 학생증 사진을 다시 첨부해주세요.
            </p>
          )}
          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-app bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <div className="mx-auto max-w-[35rem]">
              <Button
                type="submit"
                form="student-verification-form"
                disabled={!canSubmit}
                loading={submit.isPending}
                className="w-full text-xl font-bold"
              >
                {status === "APPROVED"
                  ? "인증 완료"
                  : status === "PENDING"
                    ? "승인 대기 중"
                    : "인증 요청하기"}
              </Button>
              {submit.isError && (
                <p
                  role="alert"
                  className="mt-3 text-body-medium text-destructive"
                >
                  {submission.current?.uncertain
                    ? "요청 결과를 확인하지 못했어요. 사진은 유지되니 같은 요청으로 다시 시도해주세요."
                    : submit.error.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
