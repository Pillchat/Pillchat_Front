import { uploadContentType } from "./files";
import { getCurrentUserId } from "./auth";
import {
  ApiError,
  fetchAPI,
  getValidAccessToken,
  recoverAccessToken,
} from "./fetch";

export const STUDENT_ID_IMAGE_LIMIT = 10 * 1024 * 1024;
export const STUDENT_ID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export type StudentVerification = {
  id: string;
  userName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  imageUrl: string;
};
export type StudentVerificationPage = {
  items: StudentVerification[];
  page: number;
  hasNext: boolean;
};

export function validateStudentIdImage(
  file: Pick<File, "type" | "size" | "name">,
) {
  if (!STUDENT_ID_IMAGE_TYPES.includes(uploadContentType(file)))
    return "JPG, PNG 또는 WebP 사진을 선택해주세요.";
  if (file.size <= 0 || file.size > STUDENT_ID_IMAGE_LIMIT)
    return "내용이 있는 10MB 이하의 사진을 선택해주세요.";
  return null;
}
function serverId(value: unknown): string {
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0)
    return String(value);
  throw new Error("인증 요청 번호를 확인하지 못했습니다.");
}
function parseVerification(value: unknown): StudentVerification {
  const data = value as Partial<StudentVerification> | null;
  if (
    !data ||
    typeof data.userName !== "string" ||
    !data.userName.trim() ||
    !["PENDING", "APPROVED", "REJECTED"].includes(data.status ?? "") ||
    typeof data.submittedAt !== "string" ||
    !Number.isFinite(Date.parse(data.submittedAt)) ||
    typeof data.imageUrl !== "string" ||
    !/^https?:\/\//.test(data.imageUrl)
  )
    throw new Error("학생 인증 정보를 확인하지 못했습니다. 다시 시도해주세요.");
  return { ...data, id: serverId(data.id) } as StudentVerification;
}
export async function readMyStudentVerification(): Promise<StudentVerification | null> {
  const data = await fetchAPI("/api/student-verifications/me", "GET");
  return data === null ? null : parseVerification(data);
}
export async function readPendingStudentVerifications(
  page = 0,
): Promise<StudentVerificationPage> {
  const data = await fetchAPI("/api/admin/student-verifications", "GET", {
    page,
    size: 20,
  });
  if (
    !data ||
    !Array.isArray(data.items) ||
    typeof data.hasNext !== "boolean" ||
    data.page !== page
  )
    throw new Error("인증 요청 목록을 확인하지 못했습니다.");
  const items = data.items.map(parseVerification) as StudentVerification[];
  if (items.some((item) => item.status !== "PENDING"))
    throw new Error("인증 요청 목록의 상태를 확인하지 못했습니다.");
  return { items, page, hasNext: data.hasNext };
}

/** Keep the uploaded file and registration key when a response is lost. */
export class StudentVerificationSubmission {
  private readonly ownerId = getCurrentUserId();
  private fileId: string | null = null;
  private readonly idempotencyKey = crypto.randomUUID();
  uncertain = false;
  constructor(private readonly file: File) {}
  private requireSameOwner() {
    if (!this.ownerId || getCurrentUserId() !== this.ownerId)
      throw new Error(
        "로그인 정보가 변경됐어요. 페이지를 새로 열고 다시 요청해주세요.",
      );
  }
  async submit(): Promise<StudentVerification> {
    this.requireSameOwner();
    const validation = validateStudentIdImage(this.file);
    if (validation) throw new Error(validation);
    if (!this.fileId) {
      const token = await getValidAccessToken();
      if (!token) throw new ApiError(401, { message: "로그인이 필요합니다." });
      this.requireSameOwner();
      const body = new FormData();
      body.append(
        "file",
        new Blob([this.file], { type: uploadContentType(this.file) }),
        this.file.name,
      );
      const send = (accessToken: string) =>
        fetch("/api/student-verifications/attachments", {
          method: "POST",
          headers: { Authorization: "Bearer " + accessToken },
          credentials: "same-origin",
          body,
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
      this.fileId = serverId((await response.json()).fileId);
    }
    this.requireSameOwner();
    try {
      const result = parseVerification(
        await fetchAPI("/api/student-verifications", "POST", {
          fileId: this.fileId,
          idempotencyKey: this.idempotencyKey,
        }),
      );
      this.uncertain = false;
      return result;
    } catch (error) {
      this.uncertain =
        !(error instanceof ApiError) ||
        error.status >= 500 ||
        error.status === 408;
      throw error;
    }
  }
}
export async function reviewStudentVerification(
  id: string,
  decision: "APPROVED" | "REJECTED",
) {
  if (!["APPROVED", "REJECTED"].includes(decision))
    throw new Error("승인 또는 거부를 선택해주세요.");
  const result = parseVerification(
    await fetchAPI(
      "/api/admin/student-verifications/" +
        encodeURIComponent(serverId(id)) +
        "/review",
      "PUT",
      { decision },
    ),
  );
  if (result.id !== id || result.status !== decision)
    throw new Error(
      "처리 결과를 확인하지 못했습니다. 최신 목록을 확인해주세요.",
    );
  return result;
}
export function formatVerificationDate(value: string) {
  return new Date(Date.parse(value) + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16)
    .replaceAll("-", ".")
    .replace("T", " ");
}
