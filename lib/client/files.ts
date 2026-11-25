import { getValidAccessToken, recoverAccessToken } from "./fetch";

export function uploadContentType(file: Pick<File, "type" | "name">) {
  if (file.type) return file.type;
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  return (
    types[file.name.split(".").pop()?.toLowerCase() ?? ""] ??
    "application/octet-stream"
  );
}

export async function downloadAuthenticatedFile(
  path: string,
  filename: string,
) {
  const token = await getValidAccessToken();
  const request = (accessToken: string | null) =>
    fetch(path, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: "same-origin",
    });
  let response = await request(token);
  if (response.status === 401) {
    const recovered = await recoverAccessToken(token);
    if (recovered) response = await request(recovered);
  }
  if (!response.ok) throw new Error("파일 다운로드에 실패했습니다.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // WebKit may consume the URL after click() returns.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
