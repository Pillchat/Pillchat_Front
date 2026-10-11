import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
const jotai = require("jotai");

function setup() {
  const exports = {};
  const source = readFileSync(
    new URL("../store/quizSession.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  vm.runInNewContext(outputText, {
    exports,
    require: (name) =>
      name === "jotai"
        ? jotai
        : { fetchAPI: async () => ({ isBookmarked: false }) },
  });
  const store = jotai.createStore();
  store.set(exports.initQuizSessionAtom, {
    sessionId: 1,
    sourceType: "REVIEW",
    title: "AI 복습",
    reviewMode: "all",
    bookmarkedQuestionIds: [1],
    questions: [
      {
        id: 1,
        questionType: "MULTIPLE_CHOICE",
        passage: "문제",
        choices: [{ id: "A", text: "정답" }],
        subject: "약리학",
      },
    ],
  });
  return { api: exports, store };
}

test("AI review starts with saved bookmarks without treating them as graded answers", () => {
  const { api, store } = setup();
  assert.equal(store.get(api.isCurrentBookmarkedAtom), true);
  assert.equal(store.get(api.quizSessionAtom).gradingState, "unanswered");
  assert.equal(store.get(api.quizSessionAtom).reviewMode, "all");
  assert.equal(
    store.get(api.quizSessionAtom).results[1].correctAnswer,
    undefined,
  );
});

test("grading a correct AI answer preserves its manually saved bookmark", () => {
  const { api, store } = setup();
  store.set(api.selectChoiceAtom, "A");
  store.set(api.applyGradeResultAtom, {
    questionId: 1,
    isCorrect: true,
    correctAnswer: "정답",
    explanation: "해설",
    userAnswer: "정답",
  });
  assert.equal(store.get(api.isCurrentBookmarkedAtom), true);
  assert.equal(store.get(api.quizSessionAtom).gradingState, "graded");
  store.set(api.toggleBookmarkAtom);
  assert.equal(store.get(api.isCurrentBookmarkedAtom), false);
});
