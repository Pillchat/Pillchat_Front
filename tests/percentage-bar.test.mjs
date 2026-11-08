import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./helpers/load-ts.mjs";

const { PercentageBar } = loader()("components/atoms/PercentageBar.tsx");

test("percentage bars expose the actual fraction and keep out-of-range values inside the track", () => {
  for (const [value, expected] of [
    [0, 0],
    [33.3, 33.3],
    [100, 100],
    [-10, 0],
    [120, 100],
  ]) {
    const html = renderToStaticMarkup(
      createElement(PercentageBar, { value, label: "학습 진행률" }),
    );
    assert.match(html, /aria-label="학습 진행률"/);
    assert.match(html, /max="100"/);
    assert.ok(html.includes(`value="${expected}"`));
  }
});

test("missing or invalid percentages never look like zero or an indeterminate loading bar", () => {
  for (const value of [undefined, null, NaN, Infinity, -Infinity]) {
    assert.equal(
      renderToStaticMarkup(
        createElement(PercentageBar, { value, label: "정답률" }),
      ),
      "",
    );
  }
});
