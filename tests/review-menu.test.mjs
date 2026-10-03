import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path, dependencies = require) {
  const exports = {};
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  );
  vm.runInNewContext(outputText, { exports, require: dependencies });
  return exports;
}
const labels = load("../types/review.ts");
const { default: menu } = load(
  "../app/(questionbank)/questionbank/_components/ActionSheet.tsx",
  (name) => {
    if (name === "@/types/review") return labels;
    // Test menu choices independently of the icon library's module packaging.
    if (name === "lucide-react")
      return { Bookmark: "svg", RotateCcw: "svg", CircleX: "svg", X: "svg" };
    return require(name);
  },
);
function nodes(element) {
  if (!element) return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return typeof element === "object"
    ? [element, ...nodes(element.props?.children)]
    : [];
}
function text(element) {
  if (element == null || typeof element === "boolean") return "";
  if (Array.isArray(element)) return element.map(text).join("");
  return typeof element === "object"
    ? text(element.props?.children)
    : String(element);
}
function actions(props) {
  return nodes(
    menu({
      isOpen: true,
      onClose() {},
      onSelectMode() {},
      totalCount: 3,
      wrongCount: 1,
      ...props,
    }),
  ).filter((node) => node.type === "button");
}

test("CBT offers only all and wrong review, including submitted unanswered questions", () => {
  const buttons = actions({ allowBookmarks: false, unansweredCount: 1 });
  assert.equal(buttons.length, 2);
  assert.match(text(buttons[0]), /전체 문제 복습3문제/);
  assert.match(text(buttons[1]), /오답 문제 복습.*2문제/);
  assert.equal(
    buttons.some((button) => text(button).includes("북마크")),
    false,
  );
});

test("handcrafted review has three modes and disables an empty bookmark selection", () => {
  const buttons = actions({ bookmarkedCount: 0 });
  assert.equal(buttons.length, 3);
  const bookmarks = buttons.find((button) =>
    text(button).includes("북마크 문제 복습"),
  );
  assert.equal(bookmarks.props.disabled, true);
  assert.match(text(bookmarks), /0문제/);
});
