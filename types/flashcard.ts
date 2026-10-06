export type CardType = "concept" | "relation" | "compare" | "blind";

export type CardState = "learning" | "due" | "graduated";

export type Rating = "again" | "hard" | "good" | "easy";

export interface BaseFlashcard {
  id: string;
  packId?: string;
  type: CardType;
  createdAt: number;
  updatedAt?: number;
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  state: CardState;
  due: number;
  lastReviewed?: number;
  lastRating?: Rating | null;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  weak?: boolean;
}

export interface ConceptFlashcard extends BaseFlashcard {
  type: "concept";
  term: string;
  definition: string;
}

export interface RelationFlashcard extends BaseFlashcard {
  type: "relation";
  trigger: string;
  effect: string;
  mechanism: string;
}

export interface CompareFlashcard extends BaseFlashcard {
  type: "compare";
  nameA: string;
  nameB: string;
  common: string;
  difference: string;
}

export interface BlindMask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: Array<{
    x: number;
    y: number;
  }>;
}

export interface BlindFlashcard extends BaseFlashcard {
  type: "blind";
  title: string;
  imageUrl: string;
  masks: BlindMask[];
}

export type Flashcard =
  | ConceptFlashcard
  | RelationFlashcard
  | CompareFlashcard
  | BlindFlashcard;

export interface ReviewLog {
  cardId: string;
  rating: Rating;
  at: number;
  intervalAfter: number;
}

export type FlashcardDraft =
  | {
      type: "concept";
      term: string;
      definition: string;
    }
  | {
      type: "relation";
      trigger: string;
      effect: string;
      mechanism: string;
    }
  | {
      type: "compare";
      nameA: string;
      nameB: string;
      common: string;
      difference: string;
    }
  | {
      type: "blind";
      title: string;
      imageUrl: string;
      imageFile?: File;
      masks: BlindMask[];
    };
