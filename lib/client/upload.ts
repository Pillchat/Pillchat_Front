import { fetchAPI, getValidAccessToken, recoverAccessToken } from "./fetch";

const normalizeToken = (token: string) => token.replace(/^(Bearer\s+)+/i, "");

const getUploadContentType = (file: File) => {
  if (file.type) return file.type;

  const extension = file.name.split(".").pop()?.toLowerCase();
  const inferredTypes: Record<string, string> = {
    pdf: "application/pdf",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };

  return (extension && inferredTypes[extension]) || "application/octet-stream";
};

const readUploadError = async (response: Response) => {
  const text = await response.text();

  if (text.trim()) {
    try {
      const payload = JSON.parse(text) as {
        message?: unknown;
        error?: unknown;
        code?: unknown;
      };
      const message = [payload.message, payload.error, payload.code].find(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );

      if (message) return message;
    } catch {
      return text;
    }
  }

  if (response.status === 401 || response.status === 403) {
    return "인증이 만료되었거나 이 요청에 대한 권한이 없습니다. 다시 로그인해주세요.";
  }

  return `요청 실패 (${response.status})`;
};

// ─── 내부 헬퍼 ───────────────────────────────────────────────

/** FormData + Auth 전송 공통 함수 (Content-Type 미설정 — 브라우저가 boundary 자동 설정) */
async function fetchWithFormData(
  url: string,
  method: string,
  formData: FormData,
) {
  const buildHeaders = (token?: string | null) => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${normalizeToken(token)}`;
    return headers;
  };

  const token = await getValidAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
  }

  let res = await fetch(url, {
    method,
    headers: buildHeaders(token),
    body: formData,
    credentials: "same-origin",
  });

  if (res.status === 401 || res.status === 403) {
    const recoveredToken = await recoverAccessToken(token);
    if (recoveredToken) {
      res = await fetch(url, {
        method,
        headers: buildHeaders(recoveredToken),
        body: formData,
        credentials: "same-origin",
      });
    }
  }

  if (!res.ok) {
    throw new Error(await readUploadError(res));
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── 프로필 ──────────────────────────────────────────────────

/** 프로필 수정 (닉네임 + 이미지 한번에) */
export async function uploadProfile(nickname: string, image?: File) {
  const fd = new FormData();
  fd.append("nickname", nickname);
  if (image) fd.append("image", image);
  return fetchWithFormData("/api/profile/upload", "PUT", fd);
}

// ─── 학습자료 ────────────────────────────────────────────────

/** 학습자료 생성 (multipart) */
export async function uploadMaterial(data: {
  title: string;
  content: string;
  subjectId: number;
  files?: File[];
  pdf?: File;
}) {
  const fd = new FormData();
  fd.append("title", data.title);
  fd.append("content", data.content);
  fd.append("subjectId", String(data.subjectId));
  data.files?.forEach((file) => fd.append("files", file));
  if (data.pdf) fd.append("pdf", data.pdf);
  return fetchWithFormData("/api/materials/upload", "POST", fd);
}

// ─── 대형 파일 업로드 (10MB 초과) ───────────────────────────

export type FileRefType =
  | "QUESTION"
  | "ANSWER"
  | "PROFILE"
  | "MATERIAL"
  | "MARKET";

export type CompletedFileUpload = {
  fileId: number;
  status?: string;
  originalFileName?: string;
  fileSize?: number;
};

/** 대형 파일 업로드: init → S3 PUT → complete */
export async function uploadLargeFile(
  file: File,
  refType: FileRefType,
): Promise<CompletedFileUpload> {
  const contentType = getUploadContentType(file);

  // Step 1: init
  const initRes = await fetchAPI("/api/files/init", "POST", {
    fileName: file.name,
    contentType,
    fileSize: file.size,
    refType,
  });
  const initializedFileId = Number(initRes?.fileId);
  const presignedUrl = initRes?.presignedUrl;

  if (
    !Number.isSafeInteger(initializedFileId) ||
    initializedFileId <= 0 ||
    typeof presignedUrl !== "string" ||
    !presignedUrl
  ) {
    throw new Error("파일 업로드 초기화 응답이 올바르지 않습니다.");
  }

  try {
    // Step 2: S3 직접 업로드
    const s3Res = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!s3Res.ok) throw new Error("S3 업로드 실패");

    // Step 3: complete
    const completed = await fetchAPI(
      `/api/files/${initializedFileId}/complete`,
      "POST",
    );
    const fileId = Number(completed?.fileId ?? initializedFileId);

    if (!Number.isSafeInteger(fileId) || fileId <= 0) {
      throw new Error("파일 업로드 완료 응답에서 fileId를 확인할 수 없습니다.");
    }

    return {
      ...(completed && typeof completed === "object" ? completed : {}),
      fileId,
    };
  } catch (error) {
    await fetchAPI(`/api/files/${initializedFileId}/delete`, "DELETE").catch(
      () => undefined,
    );
    throw error;
  }
}

// ─── 파일 다운로드 / 삭제 ───────────────────────────────────

/** 파일 다운로드 URL 조회 */
export async function getFileDownloadUrl(
  fileId: number | string,
): Promise<string> {
  const res = await fetchAPI(`/api/files/${fileId}/download`, "GET");
  return res.downloadUrl;
}

/** 파일 삭제 */
export async function deleteFile(fileId: number | string) {
  return fetchAPI(`/api/files/${fileId}/delete`, "DELETE");
}
