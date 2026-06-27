import { Lock, MessageCircle, Star } from "lucide-react";

import { AppShell, CustomHeader, PreviewModal } from "@/components/molecules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const reviews = [
  {
    author: "약대생 민지",
    rating: 5,
    body: "중간고사 직전에 보기 좋게 정리되어 있어서 회독용으로 편했어요.",
    createdAt: "2일 전",
  },
  {
    author: "익명_약대생",
    rating: 4,
    body: "표 정리가 많아서 헷갈리는 개념 비교할 때 도움이 됩니다.",
    createdAt: "5일 전",
  },
];

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell bottomSpacing="cta">
      <CustomHeader title="자료 상세" />

      <main className="px-6 pb-8 pt-4">
        <section className="rounded-lg bg-primary-980 px-6 py-10 text-center">
          <div className="text-5xl">📚</div>
          <h1 className="mt-5 text-headline-medium text-foreground">
            학습자료 미리보기
          </h1>
          <p className="mt-2 text-body-medium text-muted-foreground">
            자료 ID: {id}
          </p>
          <PreviewModal title="학습자료 미리보기" priceLabel="4,900원" />
        </section>

        <section className="mt-7 flex items-center justify-around border-y border-border py-4">
          <span className="flex items-center gap-1 text-title-small text-foreground">
            <Star
              aria-hidden="true"
              className="h-4 w-4 text-brand"
              strokeWidth={1.5}
            />
            4.8
          </span>
          <span className="flex items-center gap-1 text-title-small text-foreground">
            <MessageCircle
              aria-hidden="true"
              className="h-4 w-4 text-brand"
              strokeWidth={1.5}
            />
            후기 12
          </span>
          <span className="flex items-center gap-1 text-title-small text-foreground">
            <Lock
              aria-hidden="true"
              className="h-4 w-4 text-brand"
              strokeWidth={1.5}
            />
            구매 후 열람
          </span>
        </section>

        <Tabs defaultValue="intro" className="mt-7">
          <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="intro" className="h-9 rounded-lg">
              소개
            </TabsTrigger>
            <TabsTrigger value="reviews" className="h-9 rounded-lg">
              후기
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intro" className="mt-5">
            <section>
              <h2 className="text-headline-small text-foreground">자료 소개</h2>
              <p className="mt-3 text-body-medium text-muted-foreground">
                실제 상세 API와 결제 시스템이 연결되기 전까지 동작하는 마켓 상세
                MVP입니다. 이후 맛보기 슬라이드, 후기, 구매 권한 처리를
                연결합니다.
              </p>
            </section>

            <section className="mt-6 rounded-lg border border-border p-4">
              <h3 className="text-title-large text-foreground">포함 내용</h3>
              <ul className="mt-3 space-y-2 text-body-medium text-muted-foreground">
                <li>핵심 개념 요약과 비교표</li>
                <li>시험 전 확인용 체크 문항</li>
                <li>첨부 파일과 구매 권한 연결 예정 영역</li>
              </ul>
            </section>
          </TabsContent>

          <TabsContent value="reviews" className="mt-5">
            <section>
              <h2 className="text-headline-small text-foreground">후기 작성</h2>
              <div className="mt-3 rounded-lg border border-border p-4">
                <div className="flex gap-1" aria-label="별점 선택">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      aria-label={`${score}점`}
                      className="text-brand"
                    >
                      <Star
                        aria-hidden="true"
                        className="h-8 w-8 fill-brand"
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className="mt-3 min-h-24 w-full rounded-xl border border-input bg-card px-4 py-3 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring"
                  placeholder="자료를 사용한 후기를 남겨주세요."
                />
                <button
                  type="button"
                  disabled
                  className="mt-3 h-[3.625rem] w-full rounded-xl bg-gray-100 text-label-large text-gray-500"
                >
                  등록하기
                </button>
              </div>
            </section>

            <section
              className="mt-6 flex flex-col gap-3"
              aria-label="후기 목록"
            >
              {reviews.map((review) => (
                <article
                  key={`${review.author}-${review.createdAt}`}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-title-small text-foreground">
                      {review.author}
                    </strong>
                    <time className="text-body-small text-muted-foreground">
                      {review.createdAt}
                    </time>
                  </div>
                  <div className="mt-2 flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star
                        key={index}
                        aria-hidden="true"
                        className="h-4 w-4 fill-brand text-brand"
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-body-medium text-muted-foreground">
                    {review.body}
                  </p>
                </article>
              ))}
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 bg-card px-6 py-3">
        <button
          type="button"
          className="h-[3.625rem] w-full rounded-xl bg-primary text-label-large text-primary-foreground active:scale-[0.98]"
        >
          4,900원 · 구매하기
        </button>
      </div>
    </AppShell>
  );
}
