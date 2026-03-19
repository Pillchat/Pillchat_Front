import { fetchAPI } from "@/lib/functions";

export const uploadBoardFiles = async (
  imageFiles: File[],
  pdfFile: File | null,
) => {
  const files = [...imageFiles, ...(pdfFile ? [pdfFile] : [])];

  if (files.length === 0) return [];

  const params = new URLSearchParams();
  params.append("type", "board");
  files.forEach((file) => params.append("files", file.name));

  const presignedList = await fetchAPI(
    `/api/files?${params.toString()}`,
    "POST",
  );

  await Promise.all(
    presignedList.map(async ({ preSignedUrl }: { preSignedUrl: string }, index: number) => {
      const file = files[index];

      const uploadRes = await fetch(preSignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`${file.name} 업로드에 실패했습니다.`);
      }
    }),
  );

  return presignedList.map((item: { key: string }) => item.key);
};