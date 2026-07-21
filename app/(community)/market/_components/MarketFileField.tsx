"use client";

import { FileText, ImagePlus, X } from "lucide-react";
import { useId, useRef } from "react";

interface MarketFileFieldProps {
  label: string;
  description: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  kind?: "image" | "file";
  required?: boolean;
  disabled?: boolean;
  existingLabel?: string;
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export function MarketFileField({
  label,
  description,
  accept,
  file,
  onChange,
  kind = "file",
  required = false,
  disabled = false,
  existingLabel,
}: MarketFileFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = kind === "image" ? ImagePlus : FileText;

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-1 text-title-small text-foreground">
        <span>{label}</span>
        {required && <span className="text-primary">*</span>}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-28 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border px-3 py-4 text-center disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`${label}${required ? " 필수" : ""} 파일 선택`}
        aria-required={required}
        aria-describedby={`${inputId}-description`}
      >
        <Icon
          aria-hidden="true"
          className="h-8 w-8 text-brand"
          strokeWidth={1.5}
        />
        <span className="mt-2 max-w-full truncate text-label-medium text-foreground">
          {file?.name ?? existingLabel ?? "파일 선택"}
        </span>
        {file && (
          <span className="mt-1 text-label-small text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
        )}
      </button>

      <div className="mt-1.5 flex min-h-5 items-start justify-between gap-2">
        <p
          id={`${inputId}-description`}
          className="text-label-small text-muted-foreground"
        >
          {description}
        </p>
        {file && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="flex shrink-0 items-center gap-0.5 text-label-small text-primary disabled:opacity-60"
            aria-label={`${label} 선택 취소`}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            취소
          </button>
        )}
      </div>
    </div>
  );
}
