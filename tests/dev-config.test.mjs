import assert from "node:assert/strict";
import test from "node:test";
import { loader } from "./helpers/load-ts.mjs";

function directory(phase, args = [], env = {}) {
  const config = loader({ process: { argv: ["node", "next", ...args], env } })(
    "next.config.ts",
  ).default;
  return config(phase).distDir;
}

test("development servers and production builds have independent chunk directories", () => {
  assert.equal(directory("phase-development-server"), ".next-dev");
  assert.equal(
    directory("phase-development-server", ["dev", "--port", "3002"]),
    ".next-dev-3002",
  );
  assert.equal(
    directory("phase-development-server", ["dev", "-p", "3003"]),
    ".next-dev-3003",
  );
  assert.equal(
    directory("phase-development-server", ["dev", "--port=3004"]),
    ".next-dev-3004",
  );
  assert.equal(
    directory("phase-production-build", ["build"], { PORT: "3002" }),
    ".next",
  );
});

test("CLI port overrides environment while server workers use the port actually bound", () => {
  assert.equal(
    directory("phase-development-server", [], { PORT: "3005" }),
    ".next-dev-3005",
  );
  assert.equal(
    directory("phase-development-server", ["--port", "3002"], { PORT: "3005" }),
    ".next-dev-3002",
  );
  assert.equal(
    directory("phase-development-server", ["--port", "3002"], {
      PORT: "3006",
      NEXT_PRIVATE_WORKER: "1",
    }),
    ".next-dev-3006",
  );
});
