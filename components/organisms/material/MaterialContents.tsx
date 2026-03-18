"use client";

import { ImageCarousel } from "@/components/molecules";
import { FC } from "react";

export const MaterialContents: FC<{
  images: string[];
  pdfUrl: string;
  pdfName: string;
  filesLoading: boolean;
}> = ({ images, pdfUrl, pdfName, filesLoading }) => {
  return (
    <div className="flex flex-col gap-4">
      {filesLoading && (
        <div className="flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-brandSecondary">
          <span className="text-gray-500">파일 로딩 중...</span>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <ImageCarousel images={images} />
        </div>
      )}

      {pdfUrl && (
        <div className="flex flex-col gap-2 rounded-lg border border-[#E5E7EB] p-4">
          <p className="text-sm font-medium text-foreground">첨부된 PDF</p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-primary underline"
          >
            {pdfName || "PDF 열기"}
          </a>
          <div className="h-[500px] overflow-hidden rounded-md border">
            <embed
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              type="application/pdf"
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      {!filesLoading && images.length === 0 && !pdfUrl && (
        <div className="text-sm text-muted-foreground">
          첨부된 파일이 없습니다.
        </div>
      )}
    </div>
  );
};
