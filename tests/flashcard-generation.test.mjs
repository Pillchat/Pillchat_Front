import test from "node:test";
import assert from "node:assert/strict";
import { loader } from "./helpers/load-ts.mjs";
const normal = (value) => JSON.parse(JSON.stringify(value));
const initial = {
  generationId: "g1",
  packId: "p1",
  status: "READY",
  version: 3,
  drafts: [
    {
      draftId: "d1",
      version: 2,
      state: "EDITABLE",
      card: { type: "CONCEPT", term: "질문", definition: "답변" },
    },
    {
      draftId: "d2",
      version: 1,
      state: "EDITABLE",
      card: { type: "CONCEPT", term: "제외", definition: "제외" },
    },
  ],
};
const updated = {
  ...initial,
  version: 4,
  drafts: [
    {
      ...initial.drafts[0],
      version: 3,
      card: { ...initial.drafts[0].card, definition: "수정한 답변" },
    },
    { ...initial.drafts[1], version: 2, state: "REMOVED" },
  ],
};
function setup(fetchAPI, globals = {}) {
  class ApiError extends Error {
    constructor(status) {
      super("error");
      this.status = status;
    }
  }
  return {
    ...loader(globals, {
      "@/lib/client/fetch": {
        fetchAPI,
        ApiError,
        getValidAccessToken: async () => "access",
        recoverAccessToken: async () => "fresh",
      },
    })("lib/flashcards/generation.ts"),
    ApiError,
  };
}
test("finalizing review patches edits and removals before batch with updated draft and pack versions", async () => {
  const calls = [];
  const client = setup(async (url, method, body) => {
    calls.push({ url, method, body });
    if (method === "PATCH") return updated;
    if (method === "GET") return { packId: "p1", version: 8 };
    return {};
  });
  await new client.FlashcardReview(initial, { d1: updated.drafts[0].card }, [
    "d2",
  ]).finalize();
  assert.deepEqual(
    calls.map((c) => c.method),
    ["PATCH", "GET", "POST"],
  );
  assert.equal(calls[0].body.expectedVersion, 3);
  assert.equal(calls[0].body.updates[0].expectedVersion, 2);
  assert.deepEqual(normal(calls[0].body.removedDraftIds), ["d2"]);
  assert.equal(calls[2].body.expectedVersion, 8);
  assert.equal(calls[2].body.items.length, 1);
  assert.equal(calls[2].body.items[0].expectedVersion, 3);
  assert.equal(calls[2].body.items[0].card.definition, "수정한 답변");
});
test("uncertain patch retry keeps UUID and body; uncertain batch retry never sends batch body as PATCH", async () => {
  const calls = [];
  let patchFailed = false,
    batchFailed = false;
  const client = setup(async (url, method, body) => {
    calls.push({ url, method, body });
    if (method === "PATCH") {
      if (!patchFailed) {
        patchFailed = true;
        throw new TypeError("network");
      }
      return updated;
    }
    if (method === "GET") return { packId: "p1", version: 8 };
    if (!batchFailed) {
      batchFailed = true;
      throw new TypeError("network");
    }
    return {};
  });
  const review = new client.FlashcardReview(
    initial,
    { d1: updated.drafts[0].card },
    ["d2"],
  );
  await assert.rejects(() => review.finalize());
  await assert.rejects(() => review.finalize());
  await review.finalize();
  assert.deepEqual(
    calls.map((c) => c.method),
    ["PATCH", "PATCH", "GET", "POST", "POST"],
  );
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(calls[3].body, calls[4].body);
  assert.notEqual(calls[1].body.idempotencyKey, calls[4].body.idempotencyKey);
});
test("excluding every draft persists exclusion without submitting an empty batch", async () => {
  const calls = [];
  const client = setup(async (url, method, body) => {
    calls.push({ method, body });
    return {
      ...initial,
      version: 4,
      drafts: initial.drafts.map((d) => ({ ...d, state: "REMOVED" })),
    };
  });
  await new client.FlashcardReview(initial, {}, ["d1", "d2"]).finalize();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "PATCH");
  assert.deepEqual(normal(calls[0].body.removedDraftIds), ["d1", "d2"]);
});
test("non-ready generations cannot be finalized", async () => {
  const client = setup(() => assert.fail("must not submit"));
  await assert.rejects(() =>
    new client.FlashcardReview(
      { ...initial, status: "FAILED" },
      {},
      [],
    ).finalize(),
  );
});
test("source upload retries preserve metadata UUID and attach bearer, including token recovery", async () => {
  const requests = [];
  const client = setup(() => {}, {
    fetch: async (_url, options) => {
      requests.push(options);
      if (requests.length === 1) return new Response("{}", { status: 401 });
      return new Response('{"sourceFileId":91}');
    },
  });
  const file = new File(["text"], "notes.txt", { type: "text/plain" });
  assert.equal(await client.uploadFlashcardSource(file, "same-key"), "91");
  await client.uploadFlashcardSource(file, "same-key");
  assert.equal(requests[0].body, requests[1].body);
  assert.equal(requests[1].headers.Authorization, "Bearer fresh");
  assert.equal(
    await requests[0].body.get("metadata").text(),
    await requests[2].body.get("metadata").text(),
  );
  assert.equal(requests[0].body.get("metadata").type, "application/json");
  assert.equal(await requests[2].body.get("file").text(), "text");
});
