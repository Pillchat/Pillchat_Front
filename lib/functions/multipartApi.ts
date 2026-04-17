import { getToken, fetchAPI } from "./fetchData";

// ─── 내부 헬퍼 ───────────────────────────────────────────────

/** FormData + Auth 전송 공통 함수 (Content-Type 미설정 — 브라우저가 boundary 자동 설정) */
async function fetchWithFormData(
  url: string,
  method: string,
  formData: FormData,
) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method, headers, body: formData });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `요청 실패 (${res.status})`);
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

// ─── 게시글 ──────────────────────────────────────────────────

/** 게시글 생성 (multipart) */
export async function uploadBoard(data: {
  title: string;
  content: string;
  category: string;
  images?: File[];
  pdf?: File;
}) {
  const fd = new FormData();
  fd.append("title", data.title);
  fd.append("content", data.content);
  fd.append("category", data.category);
  data.images?.forEach((file) => fd.append("images", file));
  if (data.pdf) fd.append("pdf", data.pdf);
  return fetchWithFormData("/api/boards/upload", "POST", fd);
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

type RefType = "QUESTION" | "ANSWER" | "PROFILE" | "MATERIAL" | "BOARD";

/** 대형 파일 업로드: init → S3 PUT → complete */
export async function uploadLargeFile(file: File, refType: RefType) {
  // Step 1: init
  const initRes = await fetchAPI("/api/files/init", "POST", {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
    refType,
  });

  // Step 2: S3 직접 업로드
  const s3Res = await fetch(initRes.presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!s3Res.ok) throw new Error("S3 업로드 실패");

  // Step 3: complete
  return fetchAPI(`/api/files/${initRes.fileId}/complete`, "POST");
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
