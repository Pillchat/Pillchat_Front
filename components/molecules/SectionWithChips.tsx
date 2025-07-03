import { TextButton } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { ButtonSize } from "@/types";
import { map } from "lodash";
import { FC, useState } from "react";

type SectionWithChipsProps = {
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
  maxVisibleChips?: number;
  showDropdown?: boolean;
  expandedData?: Record<string, string[]>;
  showDropdownButton?: boolean;
};

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
  maxVisibleChips = 4,
  showDropdown = false,
  expandedData,
  showDropdownButton = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleItemClick = (item: string) => {
    if (selectionMode === "single") {
      onItemToggle(item);
      return;
    }
    if (
      maxSelection &&
      !selectedItems.includes(item) &&
      selectedItems.length >= maxSelection
    ) {
      return;
    }
    onItemToggle(item);
  };

  const renderChips = (items: string[], showAll: boolean = false) => {
    const displayItems =
      showAll || !showDropdown ? items : items.slice(0, maxVisibleChips);
    const hasMore =
      showDropdown &&
      items.length > maxVisibleChips &&
      !showAll &&
      !showDropdownButton;

    return (
      <>
        {map(displayItems, (item) => (
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
        {hasMore && (
          <TextButton
            onClick={() => setIsExpanded(true)}
            variant="outline"
            label={`+${items.length - maxVisibleChips}`}
            className="text-gray-500"
            size={buttonSize}
          />
        )}
      </>
    );
  };

  return (
    <div className={cn(className)}>
      {map(Object.entries(data), ([category, items]) => (
        <div key={category} className="relative flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className={categoryTitleClassName}>{category}</p>
            {showDropdownButton && (
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <span>전체보기</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          {isExpanded && showDropdown ? (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setIsExpanded(false)}
              />

              <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-h-[50vh] max-w-screen-sm overflow-y-auto rounded-t-2xl border bg-white px-6 pb-6 pt-4 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-lg font-semibold">{category}</p>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {expandedData ? (
                    map(
                      Object.entries(expandedData),
                      ([subCategory, subItems]) => (
                        <div key={subCategory} className="flex flex-col gap-2">
                          <p className="text-sm font-medium text-gray-700">
                            {subCategory}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {map(subItems, (item) => (
                              <TextButton
                                key={item}
                                onClick={() => handleItemClick(item)}
                                variant="outline"
                                label={item}
                                className={cn(
                                  selectedItems.includes(item) &&
                                    selectedChipClassName,
                                )}
                                size={buttonSize}
                              />
                            ))}
                          </div>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {map(items, (item) => (
                        <TextButton
                          key={item}
                          onClick={() => handleItemClick(item)}
                          variant="outline"
                          label={item}
                          className={cn(
                            selectedItems.includes(item) &&
                              selectedChipClassName,
                          )}
                          size={buttonSize}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              className={
                showDropdownButton
                  ? "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex gap-1 overflow-x-auto pb-2"
                  : chipContainerClassName
              }
            >
              {showDropdownButton
                ? map(items, (item) => (
                    <TextButton
                      key={item}
                      onClick={() => handleItemClick(item)}
                      variant="outline"
                      label={item}
                      className={cn(
                        "flex-shrink-0",
                        selectedItems.includes(item) && selectedChipClassName,
                      )}
                      size={buttonSize}
                    />
                  ))
                : renderChips(items, false)}
            </div>
          )}
        </div>
      ))}
      {comment && <p className="text-sm text-primary">{comment}</p>}
    </div>
  );
};
