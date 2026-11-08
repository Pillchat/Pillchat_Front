import test from "node:test";
import assert from "node:assert/strict";
import { loader } from "./helpers/load-ts.mjs";

const ready = {
  generationId: "g1",
  packId: "p1",
  status: "READY",
  version: 3,
  sourceFileId: "s1",
  sourceFileName: "notes.txt",
  drafts: [
    {
      draftId: "d1",
      version: 2,
      state: "EDITABLE",
      card: { type: "CONCEPT", term: "질문", definition: "답변" },
    },
  ],
};
const pack = { packId: "p1", title: "학습 카드", version: 8, cardCount: 0 };

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}

function text(element) {
  if (Array.isArray(element)) return element.map(text).join("");
  if (element && typeof element === "object")
    return text(element.props?.children);
  return typeof element === "string" ? element : "";
}

function harness(
  fetchAPI,
  { query = "?generation=g1", props = {}, upload } = {},
) {
  const slots = [];
  const timers = new Set();
  let cursor = 0;
  let effects = [];
  let tree;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value) => {
          slots[index] =
            typeof value === "function" ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial) {
      return (slots[cursor++] ??= { current: initial });
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (
        previous &&
        deps.every((value, i) => Object.is(value, previous.deps[i]))
      )
        return;
      slots[index] = { deps };
      effects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  class ApiError extends Error {
    constructor(status) {
      super("API failed");
      this.status = status;
    }
  }
  const jsx = (type, props) => ({ type, props });
  const window = {
    location: {
      search: query,
      href: `http://localhost/flashcards/create${query}`,
    },
    history: {
      replaceState(_state, _title, url) {
        window.location.href = String(url);
        window.location.search = new URL(url).search;
      },
    },
  };
  const load = loader(
    {
      window,
      fetch: upload,
      document: { visibilityState: "visible" },
      navigator: { onLine: true },
      setInterval(callback) {
        timers.add(callback);
        return callback;
      },
      clearInterval: (callback) => timers.delete(callback),
    },
    {
      react: hooks,
      "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
      "lucide-react": {
        FileUp: "icon",
        FileText: "icon",
        CheckCircle2: "icon",
        CircleAlert: "icon",
      },
      "@/components/atoms/PillLoader": { PillLoader: "loader" },
      "@/components/ui/button": { Button: "button" },
      "@/lib/client/fetch": {
        fetchAPI,
        ApiError,
        getValidAccessToken: async () => "access",
        recoverAccessToken: async () => "fresh",
      },
    },
  );
  const View = load("components/learning/FlashcardGeneration.tsx").default;
  const render = () => {
    cursor = 0;
    effects = [];
    tree = View({ packId: "p1", ...props });
    effects.forEach((effect) => effect());
  };
  render();
  return {
    timers,
    find: (predicate) => nodes(tree).find(predicate),
    text: () => text(tree),
    async settle() {
      await new Promise((resolve) => setImmediate(resolve));
      render();
    },
  };
}

test("restored drafts appear before pack lookup completes and can be saved after that lookup fails", async () => {
  let rejectPack;
  const pendingPack = new Promise((_resolve, reject) => {
    rejectPack = reject;
  });
  let packReads = 0;
  let batch;
  const h = harness(async (url, method, body) => {
    if (url === "/api/flashcards/generations/g1") return ready;
    if (url === "/api/flashcard-packs/p1")
      return ++packReads === 1 ? pendingPack : pack;
    assert.equal(url, "/api/flashcard-packs/p1/cards/batch");
    assert.equal(method, "POST");
    batch = body;
    return {};
  });
  await h.settle();
  assert.match(h.text(), /생성이 완료됐어요/);
  assert.match(h.text(), /notes.txt/);
  assert.equal(h.find((node) => node.type === "textarea").props.value, "질문");

  rejectPack(new Error("pack temporarily unavailable"));
  await h.settle();
  assert.match(h.text(), /카드팩 정보를 불러오지 못했어요/);
  const save = h.find(
    (node) => node.type === "button" && text(node) === "카드팩에 저장 (1장)",
  );
  assert.equal(save.props.disabled, false);
  save.props.onClick();
  await h.settle();
  assert.equal(batch.expectedVersion, 8);
  assert.equal(batch.items[0].draftId, "d1");
  assert.match(h.text(), /카드를 저장했습니다/);
  assert.doesNotMatch(h.text(), /카드팩 정보를 불러오지 못했어요/);
});

test("polling stops on READY even when the pack lookup fails", async () => {
  let generationReads = 0;
  let packReads = 0;
  const h = harness(async (url) => {
    if (url === "/api/flashcards/generations/g1")
      return ++generationReads === 1
        ? { ...ready, status: "PROCESSING" }
        : ready;
    if (++packReads === 1) return pack;
    throw Object.assign(new Error("unavailable"), { status: 503 });
  });
  await h.settle();
  assert.equal(h.timers.size, 1);
  for (const poll of h.timers) poll();
  await h.settle();
  assert.match(h.text(), /생성이 완료됐어요/);
  assert.doesNotMatch(h.text(), /자료에서 카드를 생성하고 있어요/);
  assert.equal(h.timers.size, 0);
});

test("FAILED generation errors remain visible when pack lookup also fails", async () => {
  const h = harness(async (url) => {
    if (url === "/api/flashcards/generations/g1")
      return {
        ...ready,
        status: "FAILED",
        errorCode: "MODEL_TIMEOUT",
        drafts: [],
      };
    throw Object.assign(new Error("unavailable"), { status: 503 });
  });
  await h.settle();
  assert.match(h.text(), /카드 생성 실패/);
  assert.match(h.text(), /카드 생성 시간이 길어졌어요/);
  assert.equal(
    h.find((node) => node.props?.type === "file").props.disabled,
    false,
  );
  assert.equal(h.timers.size, 0);
});

test("a generation from another pack cannot populate the preview", async () => {
  const calls = [];
  const h = harness(async (url) => {
    calls.push(url);
    return { ...ready, packId: "another-pack" };
  });
  await h.settle();
  assert.deepEqual(calls, ["/api/flashcards/generations/g1"]);
  assert.equal(
    h.find((node) => node.type === "textarea"),
    undefined,
  );
  assert.doesNotMatch(h.text(), /생성이 완료됐어요/);
});

test("source quote mismatch explains the real failure instead of showing completion", async () => {
  const h = harness(async (url) =>
    url.includes("/generations/")
      ? {
          ...ready,
          status: "FAILED",
          stage: "PARSE",
          errorCode: "SOURCE_QUOTE_MISMATCH",
          drafts: [],
        }
      : pack,
  );
  await h.settle();
  assert.match(h.text(), /카드 생성 실패/);
  assert.match(h.text(), /근거가 원본 자료와 일치하지 않아/);
  assert.doesNotMatch(h.text(), /생성이 완료됐어요|저장 완료/);
  assert.equal(h.timers.size, 0);
});

test("a READY result with no cards never claims successful generation or enables saving", async () => {
  const h = harness(async (url) =>
    url.includes("/generations/") ? { ...ready, drafts: [] } : pack,
  );
  await h.settle();
  assert.match(h.text(), /저장할 새 카드가 없어요/);
  assert.doesNotMatch(h.text(), /생성이 완료됐어요|생성 완료 · 저장 전/);
  const save = h.find(
    (node) => node.type === "button" && text(node) === "카드팩에 저장 (0장)",
  );
  assert.equal(save.props.disabled, true);
});

test("file upload, background generation, preview and saving expose distinct states", async () => {
  let finishUpload;
  const uploadResult = new Promise((resolve) => {
    finishUpload = resolve;
  });
  let finishSave;
  const saveResult = new Promise((resolve) => {
    finishSave = resolve;
  });
  let server = { ...ready, status: "QUEUED", drafts: [] };
  let submitted;
  let savedItems;
  let listRefreshes = 0;
  const h = harness(
    async (url, method, body) => {
      if (url === "/api/flashcard-packs/p1") return pack;
      if (url === "/api/flashcard-packs/p1/generations") {
        submitted = body;
        return server;
      }
      if (url === "/api/flashcards/generations/g1") return server;
      assert.equal(url, "/api/flashcard-packs/p1/cards/batch");
      assert.equal(method, "POST");
      savedItems = body;
      return saveResult;
    },
    {
      query: "",
      props: {
        onSaved: async () => {
          listRefreshes++;
        },
      },
      upload: async (url, options) => {
        assert.equal(url, "/api/flashcards/sources");
        assert.equal(options.headers.Authorization, "Bearer access");
        assert.equal(await options.body.get("file").text(), "학습 자료");
        return uploadResult;
      },
    },
  );
  h.find((node) => node.props?.type === "file").props.onChange({
    target: {
      files: [new File(["학습 자료"], "notes.txt", { type: "text/plain" })],
    },
  });
  await h.settle();
  h.find(
    (node) => node.type === "button" && text(node) === "AI로 카드 만들기",
  ).props.onClick();
  await h.settle();
  assert.match(h.text(), /자료 업로드 중/);
  finishUpload(new Response('{"sourceFileId":"s1"}'));
  await h.settle();
  assert.equal(submitted.sourceFileId, "s1");
  assert.equal(submitted.expectedVersion, 8);
  assert.match(h.text(), /AI 카드 생성 중/);
  assert.equal(h.timers.size, 1);

  server = { ...server, status: "PROCESSING", stage: "PARSE" };
  for (const poll of h.timers) await poll();
  await h.settle();
  assert.match(h.text(), /원본 근거를 확인하고 있어요/);
  server = ready;
  for (const poll of h.timers) await poll();
  await h.settle();
  assert.match(h.text(), /1장 생성 완료 · 저장 전/);
  assert.match(h.text(), /아직 카드팩에 저장되지 않았어요/);
  assert.equal(h.timers.size, 0);
  h.find(
    (node) => node.type === "button" && text(node) === "카드팩에 저장 (1장)",
  ).props.onClick();
  await h.settle();
  assert.match(h.text(), /카드팩에 저장 중/);
  assert.equal(savedItems.items[0].card.definition, "답변");
  assert.equal(listRefreshes, 0);
  server = { ...ready, drafts: [] };
  finishSave({});
  await h.settle();
  assert.match(h.text(), /카드팩 저장 완료/);
  assert.doesNotMatch(h.text(), /저장 전|저장할 새 카드가 없어요|저장 중/);
  assert.equal(listRefreshes, 1);
});
