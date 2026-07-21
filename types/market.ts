export type MarketItemType = "WORKBOOK" | "VARIANT" | "VIDEO" | "ETC";

export type MarketGrade =
  | "GRADE_1"
  | "GRADE_2"
  | "GRADE_3"
  | "GRADE_4"
  | "GRADE_5"
  | "GRADE_6";

export type MarketPageParams = {
  page?: number;
  size?: number;
  sort?: string[];
};

export type MarketListParams = MarketPageParams & {
  subjectId?: number;
  grade?: MarketGrade;
};

export type MarketSort = {
  sorted: boolean;
  empty: boolean;
  unsorted: boolean;
};

export type MarketPageable = {
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  offset: number;
  sort: MarketSort;
  unpaged: boolean;
};

export type MarketPage<T> = {
  totalPages: number;
  totalElements: number;
  pageable: MarketPageable;
  first: boolean;
  size: number;
  content: T[];
  number: number;
  sort: MarketSort;
  numberOfElements: number;
  last: boolean;
  empty: boolean;
};

export type MarketItemCard = {
  id: number;
  title: string;
  price: number;
  itemType: MarketItemType;
  subjectName: string;
  subjectId: number;
  grade: MarketGrade;
  sellerId: number;
  sellerNickname: string;
  coverImageUrl?: string | null;
  averageRating: number;
  purchaseCount: number;
  likeCount: number;
  liked: boolean;
  scrapped: boolean;
};

export type MarketItemDetail = MarketItemCard & {
  content?: string | null;
  tags: string[];
  hasSample: boolean;
  commentCount: number;
  createdAt: string;
};

export type MarketItemCreateRequest = {
  title: string;
  content?: string;
  itemType: MarketItemType;
  subjectId: number;
  grade: MarketGrade;
  price: number;
  tags: string[];
  materialFileId: number;
  sampleFileId?: number;
  coverFileId?: number;
};

export type MarketItemUpdateRequest = MarketItemCreateRequest;

export type MarketComment = {
  id: number;
  content: string;
  userId: number;
  nickname: string;
  createdAt: string;
  modifiedAt?: string | null;
};

export type MarketCommentRequest = {
  content: string;
};

export type MarketToggleResponse = {
  active: boolean;
  count: number;
};
