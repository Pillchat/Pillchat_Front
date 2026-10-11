import type { ArchiveLibraryState } from "@/lib/client/archiveLibrary";

type MaterialMetadata = {
  id?: string | number;
  userId?: string | number;
  nickname?: string;
  userNickname?: string;
  privateArchive?: boolean;
  subjectName?: string;
  subject?: { name?: string };
};

export function getMaterialMetadata(
  material: MaterialMetadata,
  profile: { nickname?: string } | undefined,
  library: ArchiveLibraryState,
  userId: string | null,
) {
  const isAuthor =
    !!userId && material.userId != null && String(material.userId) === userId;
  const category = library.folders.find(
    (folder) => folder.id === library.materialFolderIds[String(material.id)],
  );
  return {
    isAuthor,
    subjectName: material.subjectName ?? material.subject?.name ?? "",
    authorName:
      profile?.nickname?.trim() ||
      material.nickname?.trim() ||
      material.userNickname?.trim() ||
      (isAuthor ? "내 자료" : "작성자 정보 없음"),
    categoryName: isAuthor
      ? (category?.name ?? "")
      : material.privateArchive
        ? ""
        : (material.subjectName ?? material.subject?.name ?? ""),
  };
}

export function archiveMaterialPayload(
  title: string,
  content: string,
  imageKeys: string[],
  pdfKey: string | null,
  subjectId: number,
) {
  return {
    title: title.trim(),
    content: content.trim(),
    privateArchive: true,
    subjectId,
    urlKey: imageKeys,
    pdfKey,
  };
}
