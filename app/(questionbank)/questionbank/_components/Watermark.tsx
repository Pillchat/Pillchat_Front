"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { nicknameAtom, idAtom } from "@/store/profile";

const Watermark = () => {
  const nickname = useAtomValue(nicknameAtom);
  const id = useAtomValue(idAtom);

  const text = useMemo(() => {
    if (nickname && id) return `${nickname} (${id})`;
    if (nickname) return nickname;
    return "";
  }, [nickname, id]);

  if (!text) return null;

  // SVG 기반 반복 워터마크 패턴
  const svgText = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160">` +
      `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ` +
      `font-family="sans-serif" font-size="14" fill="#000" opacity="0.08" ` +
      `transform="rotate(-30, 150, 80)">${text}</text>` +
      `</svg>`,
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,${svgText}")`,
        backgroundRepeat: "repeat",
      }}
      aria-hidden="true"
    />
  );
};

export default Watermark;
