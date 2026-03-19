import { ImageCarousel } from "@/components/molecules";
import { FC } from "react";

export const BoardContents: FC<{
  content: string;
  images: string[];
  filesLoading: boolean;
  pdfUrl?: string;
  pdfName?: string;
}> = ({ content, images, filesLoading, pdfUrl, pdfName }) => {
  return (
    <div>
      <div className="whitespace-pre-wrap text-foreground">{content}</div>

      {filesLoading && (images.length > 0 || !!pdfUrl) && (
        <div className="mt-4 flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-brandSecondary">
          <span className="text-gray-500">파일 로딩 중...</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-4">
          <ImageCarousel images={images} />
        </div>
      )}

      {pdfUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#E5E5E5]">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#F8F8F8] px-4 py-3">
            <span className="truncate text-sm font-medium text-[#111111]">
              {pdfName || "첨부 PDF"}
            </span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary"
            >
              열기
            </a>
          </div>

          <embed
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            type="application/pdf"
            className="h-[480px] w-full"
          />
        </div>
      )}
    </div>
  );
};