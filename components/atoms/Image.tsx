"use client";

import { FC, useState } from "react";
import { cn } from "@/lib/utils";

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  boxClassName?: string;
}

export const Image: FC<ImageProps> = ({ src, alt, className }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center rounded-lg bg-brandSecondary",
          "h-16 w-16",
          className,
        )}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn("h-16 w-16 rounded-lg object-cover", className)}
    />
  );
};
