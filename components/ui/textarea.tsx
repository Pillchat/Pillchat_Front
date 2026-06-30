import * as React from "react";

import { cn } from "@/lib/utils";

const getScrollParents = (element: HTMLElement) => {
  const parents: Array<HTMLElement | Window> = [window];
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    const { overflowY } = window.getComputedStyle(parent);

    if (/(auto|scroll|overlay)/.test(overflowY)) {
      parents.push(parent);
    }

    parent = parent.parentElement;
  }

  return parents;
};

const resizeTextarea = (textarea: HTMLTextAreaElement) => {
  const scrollPositions = getScrollParents(textarea).map((parent) => {
    if (parent === window) {
      return {
        parent,
        top: window.scrollY,
        left: window.scrollX,
      };
    }

    const element = parent as HTMLElement;

    return {
      parent: element,
      top: element.scrollTop,
      left: element.scrollLeft,
    };
  });
  const textareaScrollTop = textarea.scrollTop;
  const textareaScrollLeft = textarea.scrollLeft;
  const { maxHeight } = window.getComputedStyle(textarea);
  const parsedMaxHeight =
    maxHeight && maxHeight !== "none" ? Number.parseFloat(maxHeight) : null;
  const heightLimit =
    parsedMaxHeight && Number.isFinite(parsedMaxHeight)
      ? parsedMaxHeight
      : null;

  textarea.style.height = "auto";
  textarea.style.height = `${
    heightLimit
      ? Math.min(textarea.scrollHeight, heightLimit)
      : textarea.scrollHeight
  }px`;
  textarea.style.overflowY =
    heightLimit && textarea.scrollHeight > heightLimit ? "auto" : "hidden";
  textarea.scrollTop = textareaScrollTop;
  textarea.scrollLeft = textareaScrollLeft;

  scrollPositions.forEach(({ parent, top, left }) => {
    if (parent === window) {
      window.scrollTo(left, top);
      return;
    }

    const element = parent as HTMLElement;
    element.scrollTop = top;
    element.scrollLeft = left;
  });
};

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onInput, value, defaultValue, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  React.useLayoutEffect(() => {
    if (!textareaRef.current) return;
    resizeTextarea(textareaRef.current);
  }, [value, defaultValue]);

  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full resize-none overflow-hidden rounded-xl border border-input bg-card px-3 py-4 text-body-large text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-muted disabled:text-gray-500",
        className,
      )}
      ref={setRef}
      value={value}
      defaultValue={defaultValue}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        resizeTextarea(target);
        onInput?.(e);
      }}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
