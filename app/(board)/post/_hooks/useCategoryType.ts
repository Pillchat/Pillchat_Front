import { useCallback, useState } from "react";

export const CATEGORY_MAP = {
  자유게시판: { label: "자유게시판", value: "FREE" },
  홍보게시판: { label: "홍보게시판", value: "PROMOTION" },
  칼럼: { label: "칼럼", value: "COLUMN" },
} as const;

export const useCategoryType = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCategoryType = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextCategories = Object.keys(CATEGORY_MAP);
      setCategories(nextCategories);
      return nextCategories;
    } catch {
      setError("카테고리를 불러오지 못했습니다.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { categories, isLoading, error, onCategoryType };
};
