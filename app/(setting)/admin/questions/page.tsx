"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Download, FileUp, Plus } from "lucide-react";
import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { Toast } from "@/components/atoms/Toast";
import { AppShell } from "@/components/molecules/AppShell";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createQuestionSet,
  MAX_IMPORT_BYTES,
  normalizeQuestionSet,
  parseQuestionSet,
  validateQuestionSet,
} from "@/lib/admin/questions";
import { getCurrentUserId, isCurrentUserAdmin } from "@/lib/client/auth";
import { fetchAPI, getValidAccessToken } from "@/lib/client/fetch";
import type { AdminQuestionSetDraft } from "@/types/adminQuestion";
import { QuestionEditor } from "./_components/QuestionEditor";
import { QuestionPreview } from "./_components/QuestionPreview";

function downloadFile(value: AdminQuestionSetDraft) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  if (blob.size > MAX_IMPORT_BYTES) {
    throw new Error("문제 파일은 5MB 이내로 작성해주세요.");
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(value.title || "문제-세트").replace(/[\\/:*?"<>|]/g, "_").slice(0, 80)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminQuestionsPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [draft, setDraft] = useState<AdminQuestionSetDraft | null>(null);
  const [storageKey, setStorageKey] = useState("");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const [replacement, setReplacement] = useState<AdminQuestionSetDraft | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const importLock = useRef(false);
  const loadRevision = useRef(0);

  const load = useCallback(async () => {
    const revision = ++loadRevision.current;
    setChecking(true);
    setAllowed(false);
    setAccessError("");
    setStorageKey("");
    try {
      const token = await getValidAccessToken();
      if (revision !== loadRevision.current) return;
      if (!token || !isCurrentUserAdmin()) {
        setAccessError("관리자 계정만 이용할 수 있습니다.");
        return;
      }
      const result = await fetchAPI("/api/admin/questions/access", "GET");
      if (revision !== loadRevision.current) return;
      if (result.isAdmin !== true || !isCurrentUserAdmin())
        throw new Error("관리자 계정만 이용할 수 있습니다.");
      const userId = getCurrentUserId();
      let next = createQuestionSet();
      if (userId) {
        const key = `pillchat:admin-question-draft:${userId}`;
        try {
          const saved = localStorage.getItem(key);
          if (saved) next = parseQuestionSet(JSON.parse(saved));
          setStorageKey(key);
        } catch {
          setError(
            "기존 초안을 읽지 못했습니다. 기존 초안은 보존되며, 새 내용은 파일로 내보내 보관해주세요.",
          );
        }
      }
      setDraft(next);
      setAllowed(true);
    } catch (error) {
      if (revision === loadRevision.current) {
        setAccessError(
          error instanceof Error
            ? error.message
            : "관리자 권한을 확인하지 못했습니다.",
        );
      }
    } finally {
      if (revision === loadRevision.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      loadRevision.current++;
    };
  }, [load]);

  useEffect(() => {
    if (!allowed || !draft || !storageKey) return;
    setSaveStatus("초안 저장 중…");
    const save = (showStatus: boolean) => {
      try {
        parseQuestionSet(draft);
      } catch {
        if (showStatus)
          setSaveStatus("시험 시간 등 세트 정보를 확인하면 초안이 저장돼요.");
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
        if (showStatus) setSaveStatus("이 기기에 초안을 저장했어요.");
      } catch {
        if (showStatus)
          setSaveStatus(
            "초안을 저장하지 못했어요. 문제 파일을 내보내 보관해주세요.",
          );
      }
    };
    const timer = setTimeout(() => save(true), 400);
    return () => {
      clearTimeout(timer);
      save(false);
    };
  }, [allowed, draft, storageKey]);

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || importLock.current) return;
    importLock.current = true;
    setImporting(true);
    setError("");
    try {
      if (file.size > MAX_IMPORT_BYTES)
        throw new Error("5MB 이하의 JSON 파일을 선택해주세요.");
      const next = parseQuestionSet(JSON.parse(await file.text()));
      setReplacement(next);
    } catch (error) {
      setError(
        error instanceof SyntaxError
          ? "문제 파일을 읽지 못했습니다. JSON 형식을 확인해주세요."
          : error instanceof Error
            ? error.message
            : "문제 파일을 읽지 못했습니다.",
      );
    } finally {
      importLock.current = false;
      setImporting(false);
    }
  };

  const exportFile = () => {
    if (!draft) return;
    const issue = validateQuestionSet(draft);
    if (issue) {
      setError(issue);
      setView("edit");
      return;
    }
    try {
      downloadFile(normalizeQuestionSet(draft));
      setError("");
      setToast("문제 파일을 내보냈어요.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "문제 파일을 내보내지 못했습니다.",
      );
    }
  };

  return (
    <AppShell
      bottomNav={false}
      bottomSpacing="none"
      className="pb-[calc(10rem+env(safe-area-inset-bottom))]"
    >
      <CustomHeader title="문제 제작 · 등록" />
      {checking ? (
        <LoadingIndicator label="관리자 권한 확인 중…" className="py-20" />
      ) : !allowed || !draft ? (
        <div className="space-y-4 px-6 py-12 text-center">
          <p role="alert" className="text-body-medium text-muted-foreground">
            {accessError}
          </p>
          <Button variant="outline" onClick={() => void load()}>
            다시 확인
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6 px-6 py-5">
            <div className="space-y-2">
              <h1 className="text-headline-small">수제 문제 · CBT 관리</h1>
              <p className="text-body-medium text-muted-foreground">
                직접 작성한 문제를 불러오거나 새 세트를 제작하고 미리
                확인해보세요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                loading={importing}
                disabled={importing}
                onClick={() => fileInput.current?.click()}
              >
                <FileUp aria-hidden="true" /> 파일 불러오기
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={importing}
                onClick={() => setReplacement(createQuestionSet())}
              >
                <Plus aria-hidden="true" /> 새 세트
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                aria-label="문제 JSON 파일 불러오기"
                className="hidden"
                onChange={importFile}
                disabled={importing}
              />
            </div>
            <p role="status" className="text-body-small text-muted-foreground">
              {saveStatus || "문제 파일은 JSON 형식으로 불러올 수 있어요."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={view === "edit" ? "secondary" : "outline"}
                size="sm"
                aria-pressed={view === "edit"}
                onClick={() => setView("edit")}
              >
                문제 제작
              </Button>
              <Button
                variant={view === "preview" ? "secondary" : "outline"}
                size="sm"
                aria-pressed={view === "preview"}
                onClick={() => setView("preview")}
              >
                미리보기
              </Button>
            </div>
            {error && (
              <p
                role="alert"
                className="whitespace-pre-wrap text-body-medium text-primary"
              >
                {error}
              </p>
            )}
            {view === "edit" ? (
              <QuestionEditor
                value={draft}
                disabled={importing}
                onChange={(value) => {
                  setDraft(value);
                  setError("");
                }}
              />
            ) : (
              <QuestionPreview value={draft} />
            )}
          </div>
          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-app space-y-2 border-t border-gray-100 bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <p className="text-body-small text-muted-foreground">
              현재 등록은 준비 중이에요. 작성한 문제는 파일로 보관할 수 있어요.
            </p>
            {view === "edit" ? (
              <Button
                className="w-full"
                disabled={importing}
                onClick={() => setView("preview")}
              >
                미리보기
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  disabled={importing}
                  onClick={exportFile}
                >
                  <Download aria-hidden="true" /> 파일 내보내기
                </Button>
                <Button disabled>등록하기</Button>
              </div>
            )}
          </div>
        </>
      )}
      <Dialog
        open={Boolean(replacement)}
        onOpenChange={(open) => {
          if (!open) setReplacement(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>현재 초안을 바꿀까요?</DialogTitle>
            <DialogDescription>
              현재 작성 중인 초안이 바뀝니다. 보관할 내용이 있다면 먼저 문제
              파일을 내보내주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReplacement(null)}>
              취소
            </Button>
            <Button
              onClick={() => {
                if (replacement) {
                  setDraft(replacement);
                  setView("edit");
                  setError("");
                }
                setReplacement(null);
              }}
            >
              바꾸기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toast
        open={Boolean(toast)}
        message={toast}
        onClose={() => setToast("")}
      />
    </AppShell>
  );
}
