import { ImageCarousel } from "@/components/molecules";
import { FC } from "react";

export const BoardContents: FC<{
  content: string;
  images: string[];
  filesLoading: boolean;
}> = ({ content, images, filesLoading }) => {
  return (
    <div>
      <div className="whitespace-pre-wrap text-foreground">{content}</div>
      {filesLoading && images && images.length > 0 && (
        <div className="mt-4 flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-brandSecondary">
          <span className="text-gray-500">이미지 로딩 중...</span>
        </div>
      )}
      {images && images.length > 0 && (
        <div className="mt-4">
          <ImageCarousel images={images} />
        </div>
      )}
    </div>
  );
};