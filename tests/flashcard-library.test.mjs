import assert from "node:assert/strict";
import test from "node:test";
import { loader } from "./helpers/load-ts.mjs";
const { flashcardGroups, flashcardReviewDate } = loader()(
  "lib/flashcards/library.ts",
);
const cards = [
  {
    id: "a",
    packId: "1",
    type: "concept",
    term: "질문 A",
    definition: "정답 A",
    createdAt: 2,
    lastReviewed: Date.parse("2026-10-29T15:30:00Z"),
  },
  {
    id: "b",
    packId: "1",
    type: "concept",
    term: "질문 B",
    definition: "정답 B",
    createdAt: 1,
  },
];
test("pack IDs keep same titles separate, retain empty packs and aggregate actual reviews", () => {
  const groups = flashcardGroups(cards, {}, [
    { packId: "1", title: "같은 이름" },
    { packId: "2", title: "같은 이름" },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].progress, 50);
  assert.equal(groups[0].reviewedCount, 1);
  assert.equal(groups[1].cards.length, 0);
  assert.equal(groups[1].progress, 0);
  assert.equal(groups[1].lastReviewed, null);
  assert.match(flashcardReviewDate(groups[0].lastReviewed), /2026.*10.*30/);
  assert.equal(flashcardReviewDate(null), "학습 전");
});
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function viewer(onRate) {
  let slots = [],
    cursor = 0,
    controls,
    tree;
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots))
        slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return slots[i] ?? (slots[i] = { current: initial });
    },
    useMemo(fn) {
      return fn();
    },
    useEffect() {},
    useImperativeHandle(ref, fn) {
      controls = fn();
    },
  };
  const Empty = () => null;
  const load = loader(
    {},
    {
      react: hooks,
      "lucide-react": Object.fromEntries(
        [
          "Check",
          "List",
          "Plus",
          "RotateCcw",
          "Shuffle",
          "Sparkles",
          "Trash2",
          "X",
        ].map((key) => [key, Empty]),
      ),
      "next/link": Empty,
      "@/components/atoms/LoadingIndicator": { LoadingIndicator: Empty },
      "@/components/atoms/PillLoader": { PillLoader: Empty },
      "@/components/ui/button": { Button: Empty },
      "./FlashcardStack": { FlashcardStack: Empty },
    },
  );
  const { FlashcardLibraryPanel } = load(
    "app/(learn)/learn/_components/FlashcardLibraryPanel.tsx",
  );
  const panel = FlashcardLibraryPanel({
    cards,
    collectionByCardId: { a: "팩", b: "팩" },
    selectedCollection: null,
    onSelectCollection() {},
    onDelete() {},
    onRate,
  });
  const pack = nodes(panel).find(
    (node) =>
      typeof node.type === "function" && node.type.name === "PackViewer",
  );
  slots = [];
  const render = () => {
    cursor = 0;
    tree = pack.type({ ...pack.props, onBusyChange() {} });
    return tree;
  };
  render();
  return {
    render,
    get controls() {
      return controls;
    },
    text: () => JSON.stringify(tree),
    find: (fn) => nodes(tree).find(fn),
  };
}
test("flipping and swiping do not grade; explicit buttons record and revisit skipped cards", async () => {
  const calls = [];
  const view = viewer(async (card, rating) => calls.push([card.id, rating]));
  await view.controls.flip();
  view.render();
  await view.controls.swipe("left");
  view.render();
  assert.equal(calls.length, 0);
  await view.controls.rate("again");
  view.render();
  assert.deepEqual(calls, [["b", "again"]]);
  await view.controls.rate("good");
  view.render();
  assert.deepEqual(calls, [
    ["b", "again"],
    ["a", "good"],
  ]);
  assert.match(view.text(), /학습 완료/);
});
test("failed rating leaves the card available and concurrent presses cannot double-submit", async () => {
  let reject,
    calls = 0;
  const view = viewer(() => {
    calls++;
    return new Promise((_, r) => {
      reject = r;
    });
  });
  const pending = view.controls.rate("good");
  await view.controls.rate("again");
  assert.equal(calls, 1);
  reject(new Error("offline"));
  await pending;
  view.render();
  assert.match(view.text(), /학습 기록을 저장하지 못했어요/);
  assert.equal(view.find((node) => node.props?.role === "alert") != null, true);
});
