import { TextButton } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { ButtonSize } from "@/types";
import { map } from "lodash";
import { FC } from "react";

interface SectionWithChipsProps {
  data: Record<string, string[]>;
  selectedItems: string[];
  onItemToggle: (item: string) => void;
  buttonSize?: ButtonSize;
  maxSelection?: number;
  selectionMode?: "single" | "multiple";
  categoryTitleClassName?: string;
  className?: string;
  chipContainerClassName?: string;
  selectedChipClassName?: string;
  comment?: string;
}

export const SectionWithChips: FC<SectionWithChipsProps> = ({
  data,
  selectedItems,
  onItemToggle,
  maxSelection,
  buttonSize = "sm",
  selectionMode = "multiple",
  categoryTitleClassName = "text-xs font-normal text-foreground",
  className = "flex flex-col gap-6",
  chipContainerClassName = "flex flex-wrap gap-1",
  selectedChipClassName = "border-primary bg-accent text-primary",
  comment,
}) => {
  const handleItemClick = (item: string) => {
    // 단일 선택 모드일 때
    if (selectionMode === "single") {
      onItemToggle(item);
      return;
    }

    // 다중 선택 모드일 때
    // 최대 선택 개수 제한이 있을 때 체크
    if (
      maxSelection &&
      !selectedItems.includes(item) &&
      selectedItems.length >= maxSelection
    ) {
      return;
    }
    onItemToggle(item);
  };

  return (
    <div className={cn(className)}>
      {map(Object.entries(data), ([category, items]) => (
        <div key={category} className="flex flex-col gap-1">
          <p className={categoryTitleClassName}>{category}</p>
          <div className={chipContainerClassName}>
            {map(items, (item) => (
              <TextButton
                key={item}
                onClick={() => handleItemClick(item)}
                variant="outline"
                label={item}
                className={cn(
                  selectedItems.includes(item) && selectedChipClassName,
                )}
                size={buttonSize}
              />
            ))}
          </div>
        </div>
      ))}
      {comment && <p className="text-sm text-primary">{comment}</p>}
    </div>
  );
};
