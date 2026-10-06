"use client";

import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";

import {
  EllipsisVertical,
  FileImage,
  FileText,
  Plus,
  Search,
  Star,
  Tag,
  Tags,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { FloatingActionButton } from "@/components/atoms";
import {
  ActionMenu,
  type ActionMenuItem,
  AlarmHeader,
  BottomNavbar,
  SelectModal,
} from "@/components/molecules";
import { useDeleteMaterialMutation } from "@/hooks/mutations";
import { useFilesQuery, useMaterialsQuery } from "@/hooks/queries";
import {
  type ArchiveLibraryState,
  markArchiveMaterialOpened,
  readArchiveLibrary,
  subscribeArchiveLibrary,
  writeArchiveLibrary,
} from "@/lib/client/archiveLibrary";
import { getCurrentUserId } from "@/lib/client/auth";
import { useRouter } from "@/lib/navigation";
import {
  buildFileUrlMap,
  getFileKey,
  getFilePreviewUrl,
} from "@/lib/shared/filePreview";

type MaterialItem = {
  id: string | number;
  title?: string;
  content?: string;
  userId?: string | number;
  images?: unknown[];
  pdfKey?: unknown;
  createdAt?: string;
};

const resolveMaterialKey = (value: unknown, materialId: string | number) => {
  const raw = getFileKey(value as Parameters<typeof getFileKey>[0]);
  if (!raw) return "";
  return raw.includes("/") ? raw : `material/${materialId}/${raw}`;
};

const getAttachmentKeys = (item: MaterialItem) => {
  const imageKeys = Array.isArray(item.images)
    ? item.images
        .map((value) => resolveMaterialKey(value, item.id))
        .filter(Boolean)
    : [];
  const pdfKey = item.pdfKey ? resolveMaterialKey(item.pdfKey, item.id) : "";
  return [...imageKeys, ...(pdfKey ? [pdfKey] : [])];
};

const getAttachmentNames = (item: MaterialItem) =>
  getAttachmentKeys(item)
    .map((key) => key.split("/").pop() ?? key)
    .join(" ");

const getMaterialType = (item: MaterialItem) => (item.pdfKey ? "PDF" : "IMAGE");

const formatShortDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const makeFolderId = () =>
  `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const makeDemoCover = (label: string, background: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" rx="40" fill="${background}"/><circle cx="520" cy="84" r="100" fill="white" opacity=".35"/><circle cx="100" cy="420" r="140" fill="white" opacity=".25"/><text x="48" y="250" fill="#222" font-family="sans-serif" font-size="46" font-weight="700">${label}</text></svg>`,
  )}`;

const DEMO_MATERIALS: MaterialItem[] = [
  {
    id: "demo-1",
    title: "약물학 기말고사 핵심 정리",
    content: "자율신경계 약물과 심혈관계 약물의 작용기전 핵심 요약",
    pdfKey: "약물학_기말고사_핵심정리.pdf",
    createdAt: "2026-10-05T09:00:00+09:00",
  },
  {
    id: "demo-2",
    title: "실무실습 처방 검토 노트",
    content: "실습 중 자주 확인한 처방 검토 기준과 복약지도 포인트",
    images: [makeDemoCover("처방 검토", "#FFF0ED")],
    createdAt: "2026-10-03T18:20:00+09:00",
  },
  {
    id: "demo-3",
    title: "국가고시 법규 오답 정리",
    content: "약사법과 마약류 관리법에서 반복해서 틀린 내용을 정리한 자료",
    pdfKey: "국가고시_법규_오답정리.pdf",
    createdAt: "2026-09-29T14:10:00+09:00",
  },
  {
    id: "demo-4",
    title: "생약학 암기 이미지",
    content: "주요 생약의 기원 식물과 확인시험을 이미지로 정리",
    images: [makeDemoCover("생약 암기", "#EEF5FF")],
    createdAt: "2026-09-24T11:30:00+09:00",
  },
  {
    id: "demo-5",
    title: "임상약학 케이스 스터디",
    content: "당뇨와 고혈압 환자의 약물치료 케이스 스터디",
    pdfKey: "임상약학_케이스스터디.pdf",
    createdAt: "2026-09-18T16:40:00+09:00",
  },
];

const DEMO_LIBRARY: ArchiveLibraryState = {
  favoriteMaterialIds: ["demo-1", "demo-3"],
  recentItems: [
    { materialId: "demo-2", openedAt: Date.now() - 1000 * 60 * 20 },
    { materialId: "demo-1", openedAt: Date.now() - 1000 * 60 * 60 * 4 },
    { materialId: "demo-4", openedAt: Date.now() - 1000 * 60 * 60 * 24 },
  ],
  folders: [
    { id: "demo-exam", name: "시험 대비", createdAt: Date.now() - 3000 },
    { id: "demo-practice", name: "실무실습", createdAt: Date.now() - 2000 },
    { id: "demo-notes", name: "내 정리", createdAt: Date.now() - 1000 },
  ],
  materialFolderIds: {
    "demo-1": "demo-exam",
    "demo-2": "demo-practice",
    "demo-3": "demo-exam",
    "demo-4": "demo-notes",
  },
};

export default function ArchivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();
  const [query, setQuery] = useState("");
  const [libraryFilter, setLibraryFilter] = useState("all");
  const [library, setLibrary] = useState<ArchiveLibraryState>(() =>
    readArchiveLibrary(currentUserId),
  );
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [folderTarget, setFolderTarget] = useState<MaterialItem | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MaterialItem | null>(null);
  const [previewTarget, setPreviewTarget] = useState<MaterialItem | null>(null);

  const { data, isLoading, isError } = useMaterialsQuery({ enabled: !isDemo });
  const allMaterials = useMemo<MaterialItem[]>(() => {
    const raw = data?.data ?? data;
    return Array.isArray(raw) ? raw : [];
  }, [data]);
  const myMaterials = useMemo(() => {
    if (isDemo) return DEMO_MATERIALS;
    return allMaterials.filter(
      (item) => Number(item?.userId) === Number(currentUserId),
    );
  }, [allMaterials, currentUserId, isDemo]);

  useEffect(() => {
    if (isDemo) {
      setLibrary(DEMO_LIBRARY);
      return;
    }

    const syncLibrary = () => setLibrary(readArchiveLibrary(currentUserId));
    syncLibrary();
    return subscribeArchiveLibrary(syncLibrary);
  }, [currentUserId, isDemo]);

  const previewFileKeys = useMemo(
    () => [
      ...new Set(
        myMaterials.flatMap((item) =>
          Array.isArray(item.images)
            ? item.images
                .filter((value) => !getFilePreviewUrl(value as never))
                .map((value) => resolveMaterialKey(value, item.id))
                .filter(Boolean)
            : [],
        ),
      ),
    ],
    [myMaterials],
  );
  const { data: previewFilesData } = useFilesQuery({ keys: previewFileKeys });
  const previewUrlMap = useMemo(
    () => buildFileUrlMap(previewFileKeys, previewFilesData),
    [previewFileKeys, previewFilesData],
  );

  const materialMap = useMemo(
    () => new Map(myMaterials.map((item) => [String(item.id), item] as const)),
    [myMaterials],
  );
  const recentMaterials = useMemo(
    () =>
      library.recentItems
        .map((recent) => materialMap.get(recent.materialId))
        .filter((item): item is MaterialItem => Boolean(item))
        .slice(0, 5),
    [library.recentItems, materialMap],
  );

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko");

    return myMaterials.filter((item) => {
      const id = String(item.id);
      const matchesLibraryFilter =
        libraryFilter === "all" ||
        (libraryFilter === "favorites"
          ? library.favoriteMaterialIds.includes(id)
          : libraryFilter === "uncategorized"
            ? !library.materialFolderIds[id]
            : library.materialFolderIds[id] === libraryFilter);
      const categoryName = library.folders.find(
        (folder) => folder.id === library.materialFolderIds[id],
      )?.name;
      const searchableText = [
        item.title,
        item.content,
        categoryName,
        getAttachmentNames(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ko");

      return (
        matchesLibraryFilter &&
        (!normalizedQuery || searchableText.includes(normalizedQuery))
      );
    });
  }, [
    library.favoriteMaterialIds,
    library.materialFolderIds,
    libraryFilter,
    myMaterials,
    query,
  ]);

  const saveLibrary = (next: ArchiveLibraryState) => {
    setLibrary(next);
    if (isDemo) return;
    writeArchiveLibrary(next, currentUserId);
  };

  const openMaterial = (item: MaterialItem) => {
    if (isDemo) {
      saveLibrary({
        ...library,
        recentItems: [
          { materialId: String(item.id), openedAt: Date.now() },
          ...library.recentItems.filter(
            (recent) => recent.materialId !== String(item.id),
          ),
        ].slice(0, 20),
      });
      setPreviewTarget(item);
      return;
    }

    setLibrary(markArchiveMaterialOpened(item.id, currentUserId));
    router.push(`/materials/${item.id}`);
  };

  const toggleFavorite = (item: MaterialItem) => {
    const id = String(item.id);
    const isFavorite = library.favoriteMaterialIds.includes(id);
    saveLibrary({
      ...library,
      favoriteMaterialIds: isFavorite
        ? library.favoriteMaterialIds.filter((value) => value !== id)
        : [id, ...library.favoriteMaterialIds],
    });
  };

  const assignFolder = (folderId: string | null) => {
    if (!folderTarget) return;
    const id = String(folderTarget.id);
    const nextAssignments = { ...library.materialFolderIds };
    if (folderId) nextAssignments[id] = folderId;
    else delete nextAssignments[id];
    saveLibrary({ ...library, materialFolderIds: nextAssignments });
    setFolderTarget(null);
  };

  const addFolder = () => {
    const name = newFolderName.trim().slice(0, 20);
    if (!name || library.folders.some((folder) => folder.name === name)) return;
    saveLibrary({
      ...library,
      folders: [
        ...library.folders,
        { id: makeFolderId(), name, createdAt: Date.now() },
      ],
    });
    setNewFolderName("");
  };

  const deleteFolder = (folderId: string) => {
    const nextAssignments = Object.fromEntries(
      Object.entries(library.materialFolderIds).filter(
        ([, assignedFolderId]) => assignedFolderId !== folderId,
      ),
    );
    saveLibrary({
      ...library,
      folders: library.folders.filter((folder) => folder.id !== folderId),
      materialFolderIds: nextAssignments,
    });
    if (libraryFilter === folderId) setLibraryFilter("all");
  };

  const deleteMutation = useDeleteMaterialMutation({
    onSuccess: (_, deletedId) => {
      const nextAssignments = { ...library.materialFolderIds };
      delete nextAssignments[deletedId];
      saveLibrary({
        ...library,
        favoriteMaterialIds: library.favoriteMaterialIds.filter(
          (id) => id !== deletedId,
        ),
        recentItems: library.recentItems.filter(
          (item) => item.materialId !== deletedId,
        ),
        materialFolderIds: nextAssignments,
      });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setDeleteTarget(null);
    },
  });

  const getPreviewUrl = (item: MaterialItem) => {
    const firstImage = Array.isArray(item.images) ? item.images[0] : null;
    if (!firstImage) return "";
    const directUrl = getFilePreviewUrl(firstImage as never);
    if (directUrl) return directUrl;
    return previewUrlMap[resolveMaterialKey(firstImage, item.id)] ?? "";
  };

  const getCategoryName = (item: MaterialItem) => {
    const folderId = library.materialFolderIds[String(item.id)];
    return library.folders.find((folder) => folder.id === folderId)?.name;
  };

  const getMenuItems = (item: MaterialItem): ActionMenuItem[] => [
    {
      id: "folder",
      label: "카테고리 지정",
      onClick: () => setFolderTarget(item),
    },
    {
      id: isDemo ? "preview" : "rename",
      label: isDemo ? "미리보기" : "이름 변경",
      onClick: () =>
        isDemo
          ? setPreviewTarget(item)
          : router.push(`/upload?edit=${item.id}`),
    },
    ...(isDemo
      ? []
      : [
          {
            id: "delete",
            label: "삭제",
            variant: "destructive" as const,
            onClick: () => setDeleteTarget(item),
          },
        ]),
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <AlarmHeader hideBottomBorder />

      <main className="flex-1 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        <header className="px-6 pb-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-headline-large text-foreground">아카이브</h1>
              <p className="mt-1 text-body-small text-muted-foreground">
                내 학습자료를 모아보고 정리해요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFolderManagerOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-full border border-border px-3 text-label-medium text-foreground active:bg-muted"
            >
              <Tags className="h-4 w-4" aria-hidden="true" />
              카테고리
            </button>
          </div>

          <label className="mt-5 flex h-11 items-center gap-2 rounded-xl bg-[#F6F6F6] px-3">
            <Search
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="파일명, 제목, 내용 검색"
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground"
                aria-label="검색어 지우기"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          {isDemo && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-label-medium text-primary">
                  샘플 데이터로 미리보는 중
                </p>
                <p className="mt-0.5 text-label-small text-muted-foreground">
                  변경 사항은 실제 자료에 저장되지 않아요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.replace("/archive")}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-label-small text-primary"
              >
                종료
              </button>
            </div>
          )}
        </header>

        {recentMaterials.length > 0 && !query && libraryFilter === "all" && (
          <section className="border-t-[10px] border-[#F7F7F7] py-5">
            <div className="mb-3 flex items-center justify-between px-6">
              <h2 className="text-title-medium text-foreground">
                최근 열어본 자료
              </h2>
              <span className="text-label-small text-muted-foreground">
                최대 5개
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentMaterials.map((item) => (
                <button
                  key={`recent-${item.id}`}
                  type="button"
                  onClick={() => openMaterial(item)}
                  className="w-32 shrink-0 text-left active:scale-[0.98]"
                >
                  <MaterialPreview
                    url={getPreviewUrl(item)}
                    type={getMaterialType(item)}
                    className="aspect-[4/3] w-full"
                  />
                  <p className="mt-2 truncate text-label-medium text-foreground">
                    {item.title || "제목 없음"}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="border-t-[10px] border-[#F7F7F7] pt-5">
          <div className="flex gap-2 overflow-x-auto px-6 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip
              active={libraryFilter === "all"}
              onClick={() => setLibraryFilter("all")}
              label="전체 자료"
            />
            <FilterChip
              active={libraryFilter === "favorites"}
              onClick={() => setLibraryFilter("favorites")}
              label="즐겨찾기"
              icon={<Star className="h-3.5 w-3.5" />}
            />
            <FilterChip
              active={libraryFilter === "uncategorized"}
              onClick={() => setLibraryFilter("uncategorized")}
              label="미분류"
              icon={<Tag className="h-3.5 w-3.5" />}
            />
            {library.folders.map((folder) => (
              <FilterChip
                key={folder.id}
                active={libraryFilter === folder.id}
                onClick={() => setLibraryFilter(folder.id)}
                label={folder.name}
                icon={<Tag className="h-3.5 w-3.5" />}
              />
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
            <h2 className="text-title-medium text-foreground">
              {libraryFilter === "favorites"
                ? "즐겨찾기"
                : libraryFilter === "uncategorized"
                  ? "미분류"
                  : (library.folders.find(
                      (folder) => folder.id === libraryFilter,
                    )?.name ?? "전체 자료")}
            </h2>
            <span className="text-label-small text-muted-foreground">
              {filteredMaterials.length}개
            </span>
          </div>

          {isLoading && !isDemo ? (
            <LoadingIndicator label="자료를 불러오는 중..." />
          ) : isError && !isDemo ? (
            <EmptyState
              title="자료를 불러오지 못했어요."
              description="잠시 후 다시 시도해 주세요."
            />
          ) : filteredMaterials.length === 0 ? (
            <EmptyState
              title={query ? "검색 결과가 없어요." : "보관된 자료가 없어요."}
              description={
                query
                  ? "다른 검색어나 필터를 사용해 보세요."
                  : "PDF나 이미지 학습자료를 추가해 보세요."
              }
              actionLabel={query || isDemo ? undefined : "자료 업로드"}
              onAction={() => router.push("/upload")}
              secondaryActionLabel={
                !query && !isDemo ? "샘플 데이터로 미리보기" : undefined
              }
              onSecondaryAction={() => router.push("/archive?demo=1")}
            />
          ) : (
            <div className="divide-y divide-border/70 px-6">
              {filteredMaterials.map((item) => {
                const id = String(item.id);
                const isFavorite = library.favoriteMaterialIds.includes(id);
                const categoryName = getCategoryName(item);

                return (
                  <article key={id} className="flex gap-3 py-4">
                    <button
                      type="button"
                      onClick={() => openMaterial(item)}
                      className="flex min-w-0 flex-1 gap-3 text-left active:opacity-70"
                    >
                      <MaterialPreview
                        url={getPreviewUrl(item)}
                        type={getMaterialType(item)}
                        className="h-20 w-20 shrink-0"
                      />

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary">
                            {getMaterialType(item)}
                          </span>
                          <span className="truncate text-label-small text-muted-foreground">
                            {categoryName ?? "미분류"}
                          </span>
                        </div>
                        <h3 className="mt-1.5 truncate text-title-small text-foreground">
                          {item.title || "제목 없음"}
                        </h3>
                        <div className="mt-1.5 flex min-w-0 items-center gap-2 text-label-small text-muted-foreground">
                          {item.createdAt && (
                            <span className="shrink-0">
                              {formatShortDate(item.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-start gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-full active:bg-muted"
                        aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            isFavorite
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                      <ActionMenu
                        trigger={
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                            aria-label="자료 메뉴"
                          >
                            <EllipsisVertical className="h-5 w-5" />
                          </button>
                        }
                        items={getMenuItems(item)}
                        align="end"
                        showBackdrop
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <FloatingActionButton
        mainIcon={<Plus aria-hidden="true" className="h-6 w-6" />}
        size="lg"
        bottom={152}
        right={24}
        expandDirection="up"
        actions={[
          {
            id: "upload-material",
            label: "학습자료 올리기",
            icon: <Upload aria-hidden="true" className="h-5 w-5" />,
            onClick: () => router.push("/upload"),
          },
        ]}
      />
      <BottomNavbar />

      {isFolderManagerOpen && (
        <BottomSheet
          title="카테고리 관리"
          onClose={() => setIsFolderManagerOpen(false)}
        >
          <div className="flex gap-2">
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addFolder();
              }}
              maxLength={20}
              placeholder="새 카테고리 이름"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border px-3 text-base outline-none focus:border-primary md:text-sm"
            />
            <button
              type="button"
              onClick={addFolder}
              disabled={!newFolderName.trim()}
              className="h-11 rounded-xl bg-primary px-4 text-label-medium text-primary-foreground disabled:opacity-40"
            >
              추가
            </button>
          </div>

          <div className="mt-5 divide-y divide-border/70">
            {library.folders.length === 0 ? (
              <p className="py-8 text-center text-body-small text-muted-foreground">
                아직 만든 카테고리가 없어요.
              </p>
            ) : (
              library.folders.map((folder) => {
                const count = Object.values(library.materialFolderIds).filter(
                  (folderId) => folderId === folder.id,
                ).length;
                return (
                  <div key={folder.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-large text-foreground">
                        {folder.name}
                      </p>
                      <p className="text-label-small text-muted-foreground">
                        자료 {count}개
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteFolder(folder.id)}
                      className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                      aria-label={`${folder.name} 카테고리 삭제`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </BottomSheet>
      )}

      {folderTarget && (
        <BottomSheet
          title="카테고리 지정"
          onClose={() => setFolderTarget(null)}
        >
          <button
            type="button"
            onClick={() => assignFolder(null)}
            className="flex w-full items-center gap-3 border-b border-border/70 py-3 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6F6F6]">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-label-large">카테고리 없음</span>
          </button>
          {library.folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => assignFolder(folder.id)}
              className="flex w-full items-center gap-3 border-b border-border/70 py-3 text-left last:border-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Tag className="h-5 w-5" />
              </div>
              <span className="min-w-0 flex-1 truncate text-label-large">
                {folder.name}
              </span>
              {library.materialFolderIds[String(folderTarget.id)] ===
                folder.id && (
                <span className="text-label-small text-primary">선택됨</span>
              )}
            </button>
          ))}
          {library.folders.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setFolderTarget(null);
                setIsFolderManagerOpen(true);
              }}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary text-label-medium text-primary"
            >
              <Tags className="h-4 w-4" />새 카테고리 만들기
            </button>
          )}
        </BottomSheet>
      )}

      {previewTarget && (
        <BottomSheet
          title="자료 미리보기"
          onClose={() => setPreviewTarget(null)}
        >
          <MaterialPreview
            url={getPreviewUrl(previewTarget)}
            type={getMaterialType(previewTarget)}
            className="aspect-[16/9] w-full"
          />
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-1 text-label-small font-semibold text-primary">
                {getMaterialType(previewTarget)}
              </span>
              <span className="text-label-small text-muted-foreground">
                {getCategoryName(previewTarget) ?? "미분류"}
              </span>
            </div>
            <h3 className="mt-3 text-title-large text-foreground">
              {previewTarget.title}
            </h3>
            <p className="mt-2 whitespace-pre-line text-body-medium text-muted-foreground">
              {previewTarget.content || "작성된 내용이 없습니다."}
            </p>
            <p className="mt-4 text-label-small text-muted-foreground">
              {getAttachmentNames(previewTarget)}
            </p>
          </div>
        </BottomSheet>
      )}

      <SelectModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(String(deleteTarget.id));
        }}
        title="학습자료 삭제"
        message={`‘${deleteTarget?.title ?? "선택한 자료"}’을 삭제하시겠습니까?\n삭제한 자료는 복구할 수 없습니다.`}
      />
    </div>
  );
}

function MaterialPreview({
  url,
  type,
  className,
}: {
  url: string;
  type: "PDF" | "IMAGE";
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl bg-[#F6F6F6] ${className}`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : type === "PDF" ? (
        <FileText className="h-7 w-7 text-primary" />
      ) : (
        <FileImage className="h-7 w-7 text-primary" />
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-small transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-white text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FileText className="h-7 w-7" />
      </div>
      <p className="mt-4 text-title-small text-foreground">{title}</p>
      <p className="mt-1 text-body-small text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-full bg-primary px-5 py-2.5 text-label-medium text-primary-foreground"
        >
          {actionLabel}
        </button>
      )}
      {secondaryActionLabel && onSecondaryAction && (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="mt-3 text-label-medium text-primary underline underline-offset-4"
        >
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
}

function BottomSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="닫기"
      />
      <div className="relative mx-auto max-h-[75dvh] w-full max-w-app overflow-y-auto rounded-t-2xl bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-headline-small text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F6F6]"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
