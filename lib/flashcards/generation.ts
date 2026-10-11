import {
  ApiError,
  fetchAPI,
  getValidAccessToken,
  recoverAccessToken,
} from "@/lib/client/fetch";
import { LearningCommands } from "@/lib/learning/api";
export type GeneratedCard = { type: string; [key: string]: string };
export type CardDraft = {
  draftId: string;
  version: number;
  state: string;
  card: GeneratedCard;
  sourceRefs: {
    quote: string;
    pageNumber?: number;
    sourceVerificationStatus: string;
  }[];
};
export type CardGeneration = {
  generationId: string;
  packId: string;
  status: string;
  stage: string;
  version: number;
  sourceFileId?: string;
  sourceFileName?: string;
  errorCode?: string;
  drafts?: CardDraft[];
};
export type GenerationPack = {
  packId: string;
  title: string;
  version: number;
  cardCount: number;
};

export async function uploadFlashcardSource(
  file: File,
  idempotencyKey: string,
) {
  const form = new FormData();
  form.append("file", file);
  form.append(
    "metadata",
    new Blob([JSON.stringify({ idempotencyKey })], {
      type: "application/json",
    }),
  );
  const token = await getValidAccessToken();
  if (!token) throw new ApiError(401, {});
  const upload = (accessToken: string) =>
    fetch("/api/flashcards/sources", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
  let response = await upload(token);
  if (response.status === 401) {
    const next = await recoverAccessToken(token);
    if (next) response = await upload(next);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data);
  if (data.sourceFileId == null)
    throw new Error("원본 등록 결과를 확인하지 못했습니다.");
  return String(data.sourceFileId);
}

/** A single review operation resumes at its last confirmed stage on retry. */
export class FlashcardReview {
  private commands = new LearningCommands();
  private updated: CardGeneration | null = null;
  private pack: GenerationPack | null = null;
  private saved = false;
  constructor(
    private original: CardGeneration,
    private edits: Record<string, GeneratedCard>,
    private removed: string[],
  ) {}
  async saveChanges(): Promise<CardGeneration> {
    if (this.updated) return this.updated;
    if (this.original.status !== "READY")
      throw new Error("생성이 완료된 후 저장해주세요.");
    const updates = (this.original.drafts ?? [])
      .filter(
        (d) =>
          d.state === "EDITABLE" &&
          this.edits[d.draftId] &&
          !this.removed.includes(d.draftId),
      )
      .map((d) => ({
        draftId: d.draftId,
        expectedVersion: d.version,
        card: this.edits[d.draftId],
      }));
    if (updates.length || this.removed.length) {
      this.updated = this.commands.pending
        ? await this.commands.retry<CardGeneration>()
        : await this.commands.send<CardGeneration>(
            `/api/flashcards/generations/${this.original.generationId}/drafts`,
            "PATCH",
            {
              expectedVersion: this.original.version,
              updates,
              removedDraftIds: this.removed,
            },
          );
    } else this.updated = this.original;
    return this.updated;
  }
  async finalize(): Promise<CardGeneration> {
    const generation = await this.saveChanges();
    if (this.saved) return generation;
    const items = (generation.drafts ?? [])
      .filter((d) => d.state === "EDITABLE")
      .map((d) => ({
        clientItemId: d.draftId,
        draftId: d.draftId,
        expectedVersion: d.version,
        card: d.card,
      }));
    // Even when every draft was excluded, persist those removals above.
    if (!items.length) return generation;
    this.pack ??= await fetchAPI(
      `/api/flashcard-packs/${generation.packId}`,
      "GET",
    );
    if (!this.pack) throw new Error("카드팩을 불러오지 못했습니다.");
    if (this.commands.pending) await this.commands.retry();
    else
      await this.commands.send(
        `/api/flashcard-packs/${generation.packId}/cards/batch`,
        "POST",
        { expectedVersion: this.pack.version, items },
      );
    this.saved = true;
    return generation;
  }
}
