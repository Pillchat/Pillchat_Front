interface SolidBtnProps {
  content: string;
  bgColorClass?: string;
  disabled?: boolean;
}

export function SolidButton({
  content,
  bgColorClass = "bg-gray-500",
  disabled,
}: SolidBtnProps) {
  return (
    <button
      className={`h-[52px] w-full rounded-[12px] px-4 py-2 text-[18px] font-medium text-white ${bgColorClass}`}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
