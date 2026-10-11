import type { Flashcard } from "@/types/flashcard";

export default function FlashcardContents({ cards }: { cards: Flashcard[] }) {
  return (
    <section aria-label="현재 카드 목록" className="space-y-3">
      <h2 className="text-base font-bold" aria-live="polite">
        저장된 카드 {cards.length}장
      </h2>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 저장된 카드가 없어요. 생성한 초안을 검토하고 저장해 주세요.
        </p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {cards.map((card, index) => (
            <li key={card.id}>
              <details className="rounded-xl border bg-white p-3">
                <summary className="cursor-pointer break-words text-sm font-semibold">
                  {index + 1}.{" "}
                  {card.type === "concept"
                    ? card.term
                    : card.type === "relation"
                      ? card.trigger
                      : card.type === "compare"
                        ? `${card.nameA} / ${card.nameB}`
                        : card.title}
                </summary>
                {card.type === "blind" ? (
                  <div className="mt-3">
                    <p className="text-xs">가림막 {card.masks.length}개</p>
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="max-h-60 w-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-brand">
                    {card.type === "concept"
                      ? card.definition
                      : card.type === "relation"
                        ? `${card.effect}\n${card.mechanism}`
                        : `공통점: ${card.common}\n차이점: ${card.difference}`}
                  </p>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
