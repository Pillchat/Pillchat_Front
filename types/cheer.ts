export type CheerMessage = {
  id: number;
  author: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type CheerMessagePage = {
  messages: CheerMessage[];
  hasNext: boolean;
  nextCursor: number | null;
};
