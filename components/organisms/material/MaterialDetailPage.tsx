"use client";

import {
  CustomHeader,
  ActionMenu,
  ActionMenuItem,
  SelectModal,
} from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { fetchAPI, getCurrentUserId } from "@/lib/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FC, useMemo, useState } from "react";
import { MaterialTitleSection } from "./MaterialTitleSection";
import { MaterialContents } from "./MaterialContents";

export const MaterialDetailPage: FC<{ materialId: string }> = ({
  materialId,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: materialData, isLoading: materialLoading } = useQuery({
    queryKey: ["material", materialId],
    queryFn: () => fetchAPI(`/api/materials/${materialId}`, "GET"),
    enabled: !!materialId,
  });

  const fileKeys = useMemo(() => {
    if (!materialData?.id) return [];

    const imageKeys = Array.isArray(materialData?.urlKey)
      ? materialData.urlKey.map((key: string) =>
          key.includes("/") ? key : `material/${materialData.id}/${key}`,
        )
      : [];

    const pdfKeys =
      materialData?.pdfKey && typeof materialData.pdfKey === "string"
        ? [
            materialData.pdfKey.includes("/")
              ? materialData.pdfKey
              : `material/${materialData.id}/${materialData.pdfKey}`,
          ]
        : [];

    return [...imageKeys, ...pdfKeys];
  }, [materialData]);

  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["material-files", materialData?.id, fileKeys],
    queryFn: async () => {
      if (fileKeys.length === 0) return [];
      return fetchAPI("/api/files", "GET", { keys: fileKeys });
    },
    enabled: fileKeys.length > 0,
  });

  const imageUrls = useMemo(() => {
    if (!Array.isArray(filesData)) return [];
    return filesData
      .filter((file: any) => {
        const key = file?.key ?? "";
        return !key.toLowerCase().endsWith(".pdf");
      })
      .map((file: any) => file.preSignedUrl);
  }, [filesData]);

  const pdfUrl = useMemo(() => {
    if (!Array.isArray(filesData)) return "";
    const pdfFile = filesData.find((file: any) => {
      const key = file?.key ?? "";
      return key.toLowerCase().endsWith(".pdf");
    });
    return pdfFile?.preSignedUrl ?? "";
  }, [filesData]);

  const isAuthor =
    materialData &&
    currentUserId &&
    (materialData.userId ? Number(materialData.userId) === Number(currentUserId) : false);

  const deleteMutation = useMutation({
    mutationFn: () => fetchAPI(`/api/materials/${materialId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material", materialId] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      router.push("/archive?status=my-study");
    },
    onError: (error) => {
      console.error("학습자료 삭제 실패:", error);
      alert("학습자료 삭제에 실패했습니다.");
    },
  });

  const handleEdit = () => router.push(`/upload?edit=${materialId}`);
  const handleDelete = () => setShowDeleteConfirm(true);

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const menuItems: ActionMenuItem[] = isAuthor
    ? [
        { id: "edit", label: "수정", onClick: handleEdit },
        {
          id: "delete",
          label: "삭제",
          onClick: handleDelete,
          variant: "destructive",
        },
      ]
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <CustomHeader
        title="학습자료"
        showIcon
        rightButtonLabel={isAuthor ? "수정" : undefined}
        onRightButtonClick={isAuthor ? handleEdit : undefined}
      />

      {materialLoading && (
        <div className="mx-6 my-5 h-96 animate-pulse rounded bg-gray-100" />
      )}

      {materialData && (
        <>
          <div className="mx-6 flex flex-col gap-8 pb-10 pt-5">
            <div className="flex flex-col gap-6">
              <MaterialTitleSection
                title={materialData.title}
                userName={materialData.nickname ?? materialData.userNickname ?? "익명"}
                subjectName={
                  materialData.subjectName ??
                  materialData.subject?.name ??
                  ""
                }
                createdAt={materialData.createdAt}
              />
              <MaterialContents
                images={imageUrls}
                pdfUrl={pdfUrl}
                pdfName={materialData.pdfKey ?? ""}
                filesLoading={filesLoading}
              />
            </div>

            {menuItems.length > 0 && (
              <div className="flex items-center justify-end">
                <ActionMenu
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <img src="/Ellipsis.svg" alt="더보기" className="h-5 w-5" />
                    </Button>
                  }
                  items={menuItems}
                  align="end"
                  side="top"
                  showBackdrop={true}
                />
              </div>
            )}
          </div>

          <div className="border-t-[12px] border-t-[#F4F4F4] py-5" />
        </>
      )}

      <SelectModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="학습자료 삭제"
        message="정말로 이 학습자료를 삭제하시겠습니까? 삭제된 학습자료는 복구할 수 없습니다."
      />
    </div>
  );
};