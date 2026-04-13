"use client";

import { useEffect, useCallback } from "react";

const WATERMARK_ID = "__pillchat_wm__";

/** Canvas API로 워터마크 패턴 이미지 생성 */
function createWatermarkPattern(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  canvas.width = 200;
  canvas.height = 150;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((-30 * Math.PI) / 180);
  ctx.fillText("Pillchat", 0, 0);

  return canvas.toDataURL();
}

/** 워터마크 DOM 요소 생성/복구 */
function applyWatermark(dataUrl: string) {
  let el = document.getElementById(WATERMARK_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = WATERMARK_ID;
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
  }

  const s = el.style;
  s.setProperty("position", "fixed", "important");
  s.setProperty("inset", "0", "important");
  s.setProperty("z-index", "9999", "important");
  s.setProperty("pointer-events", "none", "important");
  s.setProperty("user-select", "none", "important");
  s.setProperty("background-image", `url("${dataUrl}")`, "important");
  s.setProperty("background-repeat", "repeat", "important");
  s.setProperty("display", "block", "important");
  s.setProperty("opacity", "1", "important");
  s.setProperty("visibility", "visible", "important");
}

const Watermark = () => {
  const restore = useCallback(() => {
    const dataUrl = createWatermarkPattern();
    if (dataUrl) applyWatermark(dataUrl);
  }, []);

  useEffect(() => {
    restore();

    // MutationObserver: 워터마크가 제거/수정되면 자동 복구
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          for (const node of m.removedNodes) {
            if (node instanceof HTMLElement && node.id === WATERMARK_ID) {
              restore();
              return;
            }
          }
        }
        if (
          m.type === "attributes" &&
          m.target instanceof HTMLElement &&
          m.target.id === WATERMARK_ID
        ) {
          restore();
          return;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });

    return () => {
      observer.disconnect();
      document.getElementById(WATERMARK_ID)?.remove();
    };
  }, [restore]);

  return null;
};

export default Watermark;
