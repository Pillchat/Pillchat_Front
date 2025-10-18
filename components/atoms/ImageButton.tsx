"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { fetchAPI, getCurrentUserId } from "@/lib/functions";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  s3Key?: string;
  uploadStatus: "pending" | "uploading" | "success" | "error";
}

interface ImageButtonProps {
  className?: string;
  questionId?: string;
  onImagesChange?: (images: UploadedImage[]) => void;
  maxImages?: number;
  initialImages?: Array<{ url: string; key: string; name?: string }>;
}

export interface ImageButtonRef {
  uploadAll: (realQuestionId?: string) => Promise<void>;
}

export const ImageButton = forwardRef<ImageButtonRef, ImageButtonProps>(
  (
    { className, questionId, onImagesChange, maxImages = 10, initialImages },
    ref,
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const userId = getCurrentUserId();

    // 초기 이미지 로드
    useEffect(() => {
      if (initialImages && initialImages.length > 0 && images.length === 0) {
        const existingImages: UploadedImage[] = initialImages.map(
          (img, index) => ({
            id: `existing-${index}`,
            file: new File([], img.name || `image-${index}`, {
              type: "image/jpeg",
            }), // 더미 파일
            preview: img.url,
            s3Key: img.key,
            uploadStatus: "success" as const,
          }),
        );

        setImages(existingImages);
        onImagesChange?.(existingImages);
      }
    }, [initialImages]); // onImagesChange 의존성 제거하여 무한 루프 방지

    const handleFileSelect = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const files = Array.from(event.target.files || []);

      if (files.length + images.length > maxImages) {
        alert(`최대 ${maxImages}장까지 업로드할 수 있습니다.`);
        return;
      }

      const newImages: UploadedImage[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        uploadStatus: "pending" as const,
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);

      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const uploadToS3 = async (
      imagesToUpload: UploadedImage[],
      actualQuestionId?: string,
    ) => {
      const targetQuestionId = actualQuestionId || questionId;
      if (!targetQuestionId) {
        console.error("Question ID is required for upload");
        return;
      }

      try {
        // 여러 파일의 presigned URL을 한 번에 가져오기
        const fileNames = imagesToUpload.map((img) => img.file.name);

        const response = await fetchAPI(`/api/files`, "POST", {
          type: "question",
          userId: userId,
          files: fileNames,
          questionId: targetQuestionId,
        });

        // 응답이 배열인지 확인
        if (!response || !Array.isArray(response)) {
          throw new Error("Invalid response format from presigned URL API");
        }

        // 각 파일을 S3에 업로드
        const uploadPromises = imagesToUpload.map(async (image) => {
          // key에서 파일명 추출하여 매칭 (예: "question/8/chiikawa.webp" → "chiikawa.webp")
          const presignedData = response.find((item) => {
            const keyFileName = item.key.split("/").pop(); // key에서 마지막 부분(파일명) 추출
            return keyFileName === image.file.name;
          });

          if (!presignedData?.preSignedUrl) {
            throw new Error(
              `No presigned URL found for file: ${image.file.name}`,
            );
          }

          const uploadResponse = await fetch(presignedData.preSignedUrl, {
            method: "PUT",
            body: image.file,
            headers: {
              "Content-Type": image.file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${image.file.name} to S3`);
          }

          return {
            imageId: image.id,
            s3Key: presignedData.key,
            fileName: image.file.name,
          };
        });

        const results = await Promise.all(uploadPromises);
        return results;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    };

    const handleUploadAll = async (realQuestionId?: string) => {
      const pendingImages = images.filter(
        (img) => img.uploadStatus === "pending",
      );

      if (pendingImages.length === 0) {
        return;
      }

      // 모든 pending 이미지를 uploading 상태로 변경
      setImages((prev) =>
        prev.map((img) =>
          pendingImages.some((pending) => pending.id === img.id)
            ? { ...img, uploadStatus: "uploading" }
            : img,
        ),
      );

      try {
        // 여러 파일을 한 번에 업로드
        const uploadResults = await uploadToS3(pendingImages, realQuestionId);

        if (uploadResults) {
          // 업로드 성공한 이미지들의 상태 업데이트
          setImages((prev) =>
            prev.map((img) => {
              const result = uploadResults.find((r) => r.imageId === img.id);
              if (result) {
                return { ...img, uploadStatus: "success", s3Key: result.s3Key };
              }
              return img;
            }),
          );
        }
      } catch (error) {
        console.error("Upload failed:", error);
        // 업로드 실패한 이미지들을 error 상태로 변경
        setImages((prev) =>
          prev.map((img) =>
            pendingImages.some((pending) => pending.id === img.id)
              ? { ...img, uploadStatus: "error" }
              : img,
          ),
        );
      }
    };

    const removeImage = (imageId: string) => {
      setImages((prev) => {
        const imageToRemove = prev.find((img) => img.id === imageId);
        if (imageToRemove) {
          URL.revokeObjectURL(imageToRemove.preview);
        }
        const updatedImages = prev.filter((img) => img.id !== imageId);
        onImagesChange?.(updatedImages);
        return updatedImages;
      });
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    // ref를 통해 외부에서 uploadAll 함수를 호출할 수 있도록 함
    useImperativeHandle(ref, () => ({
      uploadAll: handleUploadAll,
    }));

    return (
      <div className="flex gap-3">
        {/* 업로드 버튼 */}
        <div
          className={cn(
            "flex h-[3.75rem] w-[3.75rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-secondary transition-colors hover:bg-secondary/80",
            className,
          )}
          onClick={handleButtonClick}
        >
          <Button
            variant="textOnly"
            size="icon"
            className="pointer-events-none h-5 w-5"
          >
            <img src="/Camera_muted.svg" alt="camera" width={20} height={20} />
          </Button>
          <p className="text-xs font-medium text-border">
            {images.length} / {maxImages}
          </p>
        </div>

        {/* 숨겨진 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* 이미지 미리보기 */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((image) => (
              <div key={image.id} className="group relative">
                <div className="relative h-[3.75rem] w-[3.75rem] overflow-hidden rounded-md bg-gray-100">
                  <img
                    src={image.preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />

                  {/* 업로드 상태 표시 */}
                  {image.uploadStatus === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}

                  {image.uploadStatus === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/50">
                      <span className="text-xs text-white">Error</span>
                    </div>
                  )}

                  {image.uploadStatus === "success" && (
                    <div className="absolute right-1 top-1">
                      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
                        <svg
                          className="h-2 w-2 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

ImageButton.displayName = "ImageButton";
