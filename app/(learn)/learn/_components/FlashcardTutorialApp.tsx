"use client";

import { BadgeCheck } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { AppShell, PracticeHeader } from "@/components/molecules";
import type { FlashcardCollectionMap } from "@/lib/flashcards/collections";
import { useRouter } from "@/lib/navigation";
import type { ConceptFlashcard, Flashcard } from "@/types/flashcard";

import {
  FlashcardLibraryPanel,
  type FlashcardStudyAction,
  type FlashcardStudyActionIntent,
  type FlashcardStudyControls,
} from "./FlashcardLibraryPanel";
import { FlashcardTutorialOverlay } from "./FlashcardTutorialOverlay";

type TutorialStep = "packs" | "flip" | "next" | "skip" | "complete";

const INITIAL_PACK = "생물 기초";
const PRACTICE_PACK = "암기 연습";
const collectionByCardId: FlashcardCollectionMap = {
  "tutorial-cell": INITIAL_PACK,
  "tutorial-dna": INITIAL_PACK,
  "tutorial-flashcard": PRACTICE_PACK,
  "tutorial-repeat": PRACTICE_PACK,
};

const steps: Record<
  TutorialStep,
  {
    number: number;
    targetSelector: string;
    title: string;
    description: string;
  }
> = {
  packs: {
    number: 1,
    targetSelector: '[data-flashcard-tutorial="packs"]',
    title: "다른 카드팩을 골라보세요",
    description: "‘암기 연습’ 카드팩을 눌러 공부할 카드를 선택해 보세요.",
  },
  flip: {
    number: 2,
    targetSelector: '[data-flashcard-tutorial="card"]',
    title: "카드를 눌러보세요",
    description: "정답이 나타나고, 이 카드는 ‘알고있음’으로 기록돼요.",
  },
  next: {
    number: 3,
    targetSelector: '[data-flashcard-tutorial="card"]',
    title: "왼쪽으로 넘겨보세요",
    description: "정답을 확인했으면 카드를 왼쪽으로 밀어 다음 카드로 가세요.",
  },
  skip: {
    number: 4,
    targetSelector: '[data-flashcard-tutorial="card"]',
    title: "모르는 카드는 바로 넘기기",
    description:
      "이번 카드는 누르지 말고 왼쪽으로 밀어보세요. ‘모름’으로 기록돼요.",
  },
  complete: {
    number: 5,
    targetSelector: '[data-flashcard-tutorial="results"]',
    title: "이제 직접 공부해 보세요",
    description:
      "누른 카드는 ‘알고있음’, 바로 넘긴 카드는 ‘모름’으로 기록됐어요. 예제 연습은 내 카드에 저장되지 않아요.",
  },
};

function createSampleCards(): ConceptFlashcard[] {
  const base = {
    type: "concept" as const,
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    state: "learning" as const,
    due: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
  };

  return [
    {
      ...base,
      id: "tutorial-cell",
      createdAt: 4,
      term: "세포",
      definition: "생물의 몸을 이루는 기본 단위",
    },
    {
      ...base,
      id: "tutorial-dna",
      createdAt: 3,
      term: "DNA",
      definition: "유전 정보를 담고 있는 물질",
    },
    {
      ...base,
      id: "tutorial-flashcard",
      createdAt: 2,
      term: "플래시카드",
      definition: "앞면의 질문을 보고, 뒷면의 정답을 확인하며 공부하는 카드",
    },
    {
      ...base,
      id: "tutorial-repeat",
      createdAt: 1,
      term: "반복 학습",
      definition: "배운 내용을 여러 번 다시 확인하며 기억하는 공부 방법",
    },
  ];
}

export function FlashcardTutorialApp() {
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>(createSampleCards);
  const [selectedCollection, setSelectedCollection] = useState(INITIAL_PACK);
  const [step, setStep] = useState<TutorialStep>("packs");
  const [session, setSession] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const advanceLock = useRef(false);
  const studyControlsRef = useRef<FlashcardStudyControls>(null);
  const guide = steps[step];

  const exit = () => router.replace("/flashcards");
  const restart = () => {
    advanceLock.current = false;
    setAdvancing(false);
    setCards(createSampleCards());
    setSelectedCollection(INITIAL_PACK);
    setStep("packs");
    setSession((previous) => previous + 1);
  };

  const advanceGuide = async () => {
    if (advanceLock.current || step === "complete") return;
    advanceLock.current = true;
    setAdvancing(true);
    try {
      if (step === "packs") {
        setSelectedCollection(PRACTICE_PACK);
        setStep("flip");
      } else if (step === "flip") {
        await studyControlsRef.current?.flip();
      } else {
        await studyControlsRef.current?.swipe("left");
      }
    } finally {
      advanceLock.current = false;
      setAdvancing(false);
    }
  };

  const allowStudyAction = (action: FlashcardStudyActionIntent) => {
    if (step === "flip") return action.type === "flip";
    if (step === "next") {
      return (
        action.type === "swipe" && action.direction === "left" && action.flipped
      );
    }
    if (step === "skip") {
      return (
        action.type === "swipe" &&
        action.direction === "left" &&
        !action.flipped
      );
    }
    return false;
  };

  const handleStudyAction = (action: FlashcardStudyAction) => {
    if (step === "flip" && action.type === "flip") {
      setStep("next");
    } else if (
      step === "next" &&
      action.type === "swipe" &&
      action.direction === "left" &&
      action.flipped &&
      action.nextCardId !== null
    ) {
      setStep("skip");
    } else if (
      step === "skip" &&
      action.type === "swipe" &&
      action.direction === "left" &&
      !action.flipped &&
      action.nextCardId === null
    ) {
      setStep("complete");
    }
  };

  const isCurrentTarget = (target: EventTarget | null) =>
    step !== "complete" &&
    target instanceof Element &&
    Boolean(target.closest(guide.targetSelector));

  const guardPracticeClicks = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (
      (target instanceof Element && target.closest("a[href]")) ||
      !isCurrentTarget(target)
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const guardPracticeKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (
      ["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key) &&
      !isCurrentTarget(event.target)
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <AppShell bottomNav={false} bottomSpacing="none">
      <PracticeHeader
        title="AI 플래시카드"
        backHref="/flashcards"
        onBack={exit}
        separator={false}
        rightSlot={
          <button
            type="button"
            onClick={restart}
            aria-label="사용법 다시 시작"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <BadgeCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </button>
        }
      />
      <main
        className="px-4 pb-[calc(14rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-[calc(16rem+env(safe-area-inset-bottom))]"
        onClickCapture={guardPracticeClicks}
        onAuxClickCapture={guardPracticeClicks}
        onKeyDownCapture={guardPracticeKeys}
      >
        <FlashcardLibraryPanel
          key={session}
          cards={cards}
          collectionByCardId={collectionByCardId}
          selectedCollection={selectedCollection}
          onSelectCollection={(name) => {
            if (step !== "packs" || name === selectedCollection) return;
            setSelectedCollection(name);
            setStep("flip");
          }}
          onDelete={async (cardId) => {
            setCards((previous) =>
              previous.filter((card) => card.id !== cardId),
            );
          }}
          onRate={() => Promise.resolve()}
          onStudyAction={handleStudyAction}
          allowStudyAction={allowStudyAction}
          studyControlsRef={studyControlsRef}
        />
      </main>
      <FlashcardTutorialOverlay
        targetSelector={guide.targetSelector}
        stepNumber={guide.number}
        totalSteps={5}
        title={guide.title}
        description={guide.description}
        onExit={exit}
        completed={step === "complete"}
        onFinish={exit}
        onRestart={restart}
        onNext={() => void advanceGuide()}
        nextDisabled={advancing}
      />
    </AppShell>
  );
}
