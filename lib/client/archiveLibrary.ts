export type ArchiveFolder = {
  id: string;
  name: string;
  createdAt: number;
};

export type ArchiveRecentItem = {
  materialId: string;
  openedAt: number;
};

export type ArchiveLibraryState = {
  favoriteMaterialIds: string[];
  recentItems: ArchiveRecentItem[];
  folders: ArchiveFolder[];
  materialFolderIds: Record<string, string>;
  materialSizeBytes: Record<string, number>;
};

export const MAX_ARCHIVE_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;

const ARCHIVE_LIBRARY_STORAGE_KEY = "yakchat:archive-library";
const ARCHIVE_LIBRARY_EVENT = "yakchat:archive-library-change";

const EMPTY_ARCHIVE_LIBRARY: ArchiveLibraryState = {
  favoriteMaterialIds: [],
  recentItems: [],
  folders: [],
  materialFolderIds: {},
  materialSizeBytes: {},
};

const getStorageKey = (userId?: string | number | null) =>
  `${ARCHIVE_LIBRARY_STORAGE_KEY}:${userId ?? "guest"}`;

export const readArchiveLibrary = (
  userId?: string | number | null,
): ArchiveLibraryState => {
  if (typeof window === "undefined") return EMPTY_ARCHIVE_LIBRARY;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return EMPTY_ARCHIVE_LIBRARY;

    const parsed = JSON.parse(raw) as Partial<ArchiveLibraryState>;

    return {
      favoriteMaterialIds: Array.isArray(parsed.favoriteMaterialIds)
        ? parsed.favoriteMaterialIds.map(String)
        : [],
      recentItems: Array.isArray(parsed.recentItems)
        ? parsed.recentItems
            .filter((item) => item?.materialId && item?.openedAt)
            .map((item) => ({
              materialId: String(item.materialId),
              openedAt: Number(item.openedAt),
            }))
            .slice(0, 20)
        : [],
      folders: Array.isArray(parsed.folders)
        ? parsed.folders
            .filter((folder) => folder?.id && folder?.name)
            .map((folder) => ({
              id: String(folder.id),
              name: String(folder.name),
              createdAt: Number(folder.createdAt) || Date.now(),
            }))
        : [],
      materialFolderIds:
        parsed.materialFolderIds && typeof parsed.materialFolderIds === "object"
          ? Object.fromEntries(
              Object.entries(parsed.materialFolderIds).map(([key, value]) => [
                String(key),
                String(value),
              ]),
            )
          : {},
      materialSizeBytes:
        parsed.materialSizeBytes && typeof parsed.materialSizeBytes === "object"
          ? Object.fromEntries(
              Object.entries(parsed.materialSizeBytes)
                .map(([key, value]) => [String(key), Number(value)] as const)
                .filter(([, value]) => Number.isFinite(value) && value >= 0),
            )
          : {},
    };
  } catch {
    return EMPTY_ARCHIVE_LIBRARY;
  }
};

export const getArchiveStorageUsageBytes = (state: ArchiveLibraryState) =>
  Object.values(state.materialSizeBytes).reduce(
    (total, size) => total + (Number.isFinite(size) ? size : 0),
    0,
  );

export const getKnownFileSizeBytes = (value: unknown): number | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const candidates = [
    record.totalFileSize,
    record.totalSizeBytes,
    record.fileSize,
    record.sizeBytes,
    record.byteSize,
    record.contentLength,
  ];
  const size = candidates
    .map(Number)
    .find((candidate) => Number.isFinite(candidate) && candidate >= 0);

  return size ?? null;
};

export const writeArchiveLibrary = (
  state: ArchiveLibraryState,
  userId?: string | number | null,
) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(ARCHIVE_LIBRARY_EVENT));
};

export const markArchiveMaterialOpened = (
  materialId: string | number,
  userId?: string | number | null,
) => {
  const id = String(materialId);
  const state = readArchiveLibrary(userId);
  const nextState: ArchiveLibraryState = {
    ...state,
    recentItems: [
      { materialId: id, openedAt: Date.now() },
      ...state.recentItems.filter((item) => item.materialId !== id),
    ].slice(0, 20),
  };

  writeArchiveLibrary(nextState, userId);
  return nextState;
};

export const subscribeArchiveLibrary = (listener: () => void) => {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(ARCHIVE_LIBRARY_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(ARCHIVE_LIBRARY_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};
