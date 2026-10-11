import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Run the real browser storage module against isolated storage for each test.
function setup(source = "../lib/review/collections.ts") {
  const values = new Map();
  const events = [];
  const exports = {};
  const window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    dispatchEvent: (event) => events.push(event.type),
  };
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(source, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  );
  vm.runInNewContext(outputText, { exports, window, Event });
  return { api: exports, values, events };
}

const question = (id, status = "incorrect") => ({
  id,
  prompt: "테스트 문제",
  subject: "약리학",
  topic: "자율신경계",
  choices: ["정답", "오답"],
  correctChoice: 0,
  selectedChoice: 1,
  status,
  unknown: false,
  bookmarked: false,
  explanation: "해설",
});
const collection = (id, questions) => ({
  id,
  source: "HANDCRAFTED",
  title: "약리학 문제 모음",
  subject: "약리학",
  totalQuestionCount: 2,
  updatedAt: "2026-10-03T00:00:00.000Z",
  questions,
});

test("retains multiple attempts and merges partial grading without duplicate questions", () => {
  const { api, events } = setup();
  assert.equal(
    api.saveReviewCollection(collection("first", [question("1")])),
    true,
  );
  api.saveReviewCollection(collection("second", [question("1")]));
  api.saveReviewCollection(
    collection("first", [
      question("1", "correct"),
      question("2", "unanswered"),
    ]),
  );
  const saved = api.readReviewCollections();
  assert.equal(saved.length, 2);
  const first = saved.find((item) => item.id === "first");
  assert.equal(first.questions.length, 2);
  assert.equal(api.reviewCounts(first).wrong, 0);
  assert.equal(api.reviewCounts(first).unanswered, 1);
  assert.equal(events.length, 3);
});

test("migrates the recent CBT result once while preserving CBT review details", () => {
  const { api, values, events } = setup();
  const result = {
    attemptId: "attempt-1",
    submittedAt: "2026-10-02T12:00:00Z",
    total: 1,
    scoresBySubject: [{ subject: "생명약학" }],
    review: [
      {
        ...question("cbt-q"),
        stem: "CBT 문제",
        flagged: true,
        unknown: true,
        memo: "내 메모",
        conceptTags: ["개념"],
        media: [],
      },
    ],
  };
  values.set("pillchat:cbt:recent-result:v2", JSON.stringify(result));
  assert.equal(api.migrateRecentCbtReview(), true);
  assert.equal(api.migrateRecentCbtReview(), true);
  const saved = api.readReviewCollections();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].source, "CBT");
  assert.equal(saved[0].questions[0].bookmarked, true);
  assert.equal(saved[0].questions[0].memo, "내 메모");
  assert.equal(events.length, 1);
});

test("preserves unreadable history and reports storage write failure", () => {
  const { api, values } = setup();
  values.set(api.REVIEW_STORAGE_KEY, "invalid-json");
  assert.equal(
    api.saveReviewCollection(collection("new", [question("1")])),
    false,
  );
  assert.equal(values.get(api.REVIEW_STORAGE_KEY), "invalid-json");
  assert.throws(() => api.readReviewCollections());
});

const cbtResult = (tutorial = false) => ({
  attemptId: tutorial ? "old-tutorial" : "real-exam",
  submittedAt: "2026-10-03T00:00:00Z",
  total: 1,
  scoresBySubject: [{ subject: tutorial ? "조작 튜토리얼" : "생명약학" }],
  review: [
    {
      ...question(tutorial ? "T-001" : "S1-001"),
      subject: tutorial ? "조작 튜토리얼" : "생명약학",
      stem: "CBT 문제",
    },
  ],
});

test("does not save tutorial results through either review storage entry point", () => {
  const { api, values, events } = setup();
  assert.equal(api.saveCbtReview(cbtResult(true)), true);
  assert.equal(
    api.saveReviewCollection({
      ...collection("cbt:old-tutorial", [question("T-001")]),
      source: "CBT",
    }),
    true,
  );
  assert.equal(values.has(api.REVIEW_STORAGE_KEY), false);
  assert.equal(events.length, 0);
  assert.equal(api.saveCbtReview(cbtResult()), true);
  assert.equal(api.readReviewCollections().length, 1);
});

test("excludes archived CBT tutorials while keeping exam and handcrafted collections", () => {
  const { api, values } = setup();
  values.set(
    api.REVIEW_STORAGE_KEY,
    JSON.stringify([
      { ...collection("cbt:tutorial", [question("T-001")]), source: "CBT" },
      { ...collection("cbt:real", [question("S1-001")]), source: "CBT" },
      collection("handcrafted:real", [question("1")]),
    ]),
  );
  const saved = api.readReviewCollections();
  assert.deepEqual(
    Array.from(saved, (item) => item.id),
    ["cbt:real", "handcrafted:real"],
  );
  assert.equal(
    saved.some((item) => item.id === "cbt:tutorial"),
    false,
  );
});

test("skips tutorial migration and can recover a previous real exam instead", () => {
  const { api, values, events } = setup();
  values.set("pillchat:cbt:recent-result:v2", JSON.stringify(cbtResult(true)));
  assert.equal(api.migrateRecentCbtReview(), true);
  assert.equal(api.readReviewCollections().length, 0);
  assert.equal(events.length, 0);
  values.set("pillchat:cbt:recent-result:v1", JSON.stringify(cbtResult()));
  assert.equal(api.migrateRecentCbtReview(), true);
  assert.equal(api.readReviewCollections()[0].id, "cbt:real-exam");
});

test("all review includes the entire handcrafted set, while wrong review excludes unattempted questions", () => {
  const { api: builder } = setup("../lib/handcrafted/review.ts");
  const { api: catalog } = setup("../lib/handcrafted/questions.ts");
  const { api } = setup();
  const saved = builder.buildHandcraftedReviewCollection(
    {
      id: "partial",
      questionIds: [1, 2, 3],
      answers: [
        { questionId: 1, selected: 1, isCorrect: false, unknown: false },
        { questionId: 2, selected: null, isCorrect: false, unknown: true },
      ],
    },
    catalog.handcraftedQuestions,
    [3],
  );
  assert.equal(saved.totalQuestionCount, 3);
  assert.equal(api.selectReviewQuestions(saved, "all").length, 3);
  assert.equal(api.selectReviewQuestions(saved, "wrong").length, 2);
  assert.equal(api.selectReviewQuestions(saved, "bookmarked")[0].id, "3");
  assert.equal(
    api.selectReviewQuestions(saved, "bookmarked")[0].status,
    "unattempted",
  );
});

test("a bookmark before grading retains the full set without creating wrong answers", () => {
  const { api: builder } = setup("../lib/handcrafted/review.ts");
  const { api: catalog } = setup("../lib/handcrafted/questions.ts");
  const { api } = setup();
  const record = { id: "ungraded", questionIds: [1, 2, 3], answers: [] };
  assert.equal(
    builder.buildHandcraftedReviewCollection(
      record,
      catalog.handcraftedQuestions,
      [],
    ),
    null,
  );
  const saved = builder.buildHandcraftedReviewCollection(
    record,
    catalog.handcraftedQuestions,
    [1],
  );
  assert.equal(saved.questions.length, 3);
  assert.equal(api.selectReviewQuestions(saved, "wrong").length, 0);
  assert.equal(api.reviewCounts(saved).bookmarked, 1);
});

test("bookmark removal updates every handcrafted collection and preserves CBT flags", () => {
  const { api, values } = setup();
  const q = { ...question("1"), bookmarked: true };
  api.saveReviewCollection(collection("one", [q]));
  api.saveReviewCollection(collection("two", [q]));
  api.saveReviewCollection({ ...collection("cbt", [q]), source: "CBT" });
  values.set(api.HANDCRAFTED_BOOKMARK_KEY, JSON.stringify([1]));
  assert.equal(api.setHandcraftedBookmark("1", false), true);
  const saved = api.readReviewCollections();
  assert.equal(
    saved
      .filter((item) => item.source === "HANDCRAFTED")
      .every((item) => !item.questions[0].bookmarked),
    true,
  );
  assert.equal(
    saved.find((item) => item.source === "CBT").questions[0].bookmarked,
    true,
  );
  assert.equal(
    api.selectReviewQuestions(
      saved.find((item) => item.source === "CBT"),
      "bookmarked",
    ).length,
    0,
  );
  assert.equal(api.setHandcraftedBookmark("1", true), true);
  assert.equal(
    api
      .readReviewCollections()
      .filter((item) => item.source === "HANDCRAFTED")
      .every((item) => item.questions[0].bookmarked),
    true,
  );
});
