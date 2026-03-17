"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

export type UploadPreviewItem = {
  id: string;
  type: "image" | "pdf";
  file?: File;
  name: string;
  previewUrl: string;
  source: "new" | "existing";
  urlKey?: string;
};

const MAX_IMAGE_COUNT = 10;

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const usePostFiles = () => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const [imageItems, setImageItems] = useState<UploadPreviewItem[]>([]);
  const [pdfItem, setPdfItem] = useState<UploadPreviewItem | null>(null);
  const [existingItems, setExistingItems] = useState<UploadPreviewItem[]>([]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const registerObjectUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  };

  const revokeObjectUrl = (url: string) => {
    URL.revokeObjectURL(url);
    objectUrlsRef.current = objectUrlsRef.current.filter(
      (item) => item !== url,
    );
  };

  const openImagePicker = () => {
    if (pdfItem) {
      alert("PDF가 선택된 상태에서는 이미지를 업로드할 수 없습니다.");
      return;
    }
    imageInputRef.current?.click();
  };

  const openPdfPicker = () => {
    if (imageItems.length > 0 || existingItems.length > 0) {
      alert("이미지가 선택된 상태에서는 PDF를 업로드할 수 없습니다.");
      return;
    }
    pdfInputRef.current?.click();
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (pdfItem) {
      alert("PDF가 선택된 상태에서는 이미지를 업로드할 수 없습니다.");
      e.target.value = "";
      return;
    }

    if (selectedFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const remainCount =
      MAX_IMAGE_COUNT - (existingItems.length + imageItems.length);

    if (remainCount <= 0) {
      alert("이미지는 최대 10장까지 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    const acceptedFiles = selectedFiles.slice(0, remainCount);

    if (acceptedFiles.length < selectedFiles.length) {
      alert("이미지는 최대 10장까지 업로드할 수 있습니다.");
    }

    const nextItems = acceptedFiles.map((file) => ({
      id: makeId(),
      type: "image" as const,
      file,
      name: file.name,
      previewUrl: registerObjectUrl(file),
      source: "new" as const,
    }));

    setImageItems((prev) => [...prev, ...nextItems]);
    e.target.value = "";
  };

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = Array.from(e.target.files ?? []).find(
      (item) => item.type === "application/pdf",
    );

    if (imageItems.length > 0 || existingItems.length > 0) {
      alert("이미지가 선택된 상태에서는 PDF를 업로드할 수 없습니다.");
      e.target.value = "";
      return;
    }

    if (!file) {
      e.target.value = "";
      return;
    }

    if (pdfItem) {
      revokeObjectUrl(pdfItem.previewUrl);
    }

    const nextPdfItem: UploadPreviewItem = {
      id: makeId(),
      type: "pdf",
      file,
      name: file.name,
      previewUrl: registerObjectUrl(file),
      source: "new",
    };

    setPdfItem(nextPdfItem);
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    if (pdfItem?.id === id) {
      revokeObjectUrl(pdfItem.previewUrl);
      setPdfItem(null);
      return;
    }

    if (existingItems.some((item) => item.id === id)) {
      setExistingItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    setImageItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        revokeObjectUrl(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearFiles = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setImageItems([]);
    setPdfItem(null);
    setExistingItems([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }, []);

  const setExistingPreviewItems = useCallback((items: UploadPreviewItem[]) => {
    setExistingItems(items);
  }, []);

  const previewItems = useMemo(() => {
    if (existingItems.length > 0 || imageItems.length > 0) {
      return [...existingItems, ...imageItems];
    }
    if (pdfItem) return [pdfItem];
    return [];
  }, [existingItems, imageItems, pdfItem]);

  return {
    imageInputRef,
    pdfInputRef,
    openImagePicker,
    openPdfPicker,
    handleImageChange,
    handlePdfChange,
    removeItem,
    clearFiles,
    previewItems,
    imageFiles: imageItems
      .map((item) => item.file)
      .filter((file): file is File => !!file),
    pdfFile: pdfItem?.file ?? null,
    hasFiles: previewItems.length > 0,
    setExistingPreviewItems,
    remainingExistingKeys: existingItems
      .map((item) => item.urlKey)
      .filter((key): key is string => !!key),
  };
};
