interface StrokeBtnProps {
  content: string;
  colorClass: string;
}

export function StrokeButton({ content, colorClass }: StrokeBtnProps) {
  return (
    <button
      className={`h-[52px] w-full rounded-[12px] bg-white text-[18px] font-medium text-${colorClass} border border-${colorClass} `}
    >
      {content}
    </button>
  );
}
