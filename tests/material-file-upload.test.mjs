import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { loader } from "./helpers/load-ts.mjs";

// Exercise the route through serverFetch, including backend error serialization.
const loadRoute = (fetch) =>
  loader({
    fetch,
    Error,
    process: { env: { NEXT_PUBLIC_API_HOST: "https://backend.example" } },
  })("app/api/files/route.ts");

test("material file URL request forwards ordered names, byte sizes and authorization", async () => {
  const names = ["약물학 노트 + 정리.png", "강의자료.pdf"];
  const sizes = [3072, 1234567];
  const query = new URLSearchParams({ type: "material" });
  names.forEach((name) => query.append("files", name));
  sizes.forEach((size) => query.append("fileSizes", String(size)));
  let called = false;
  const route = loadRoute(async (url, options) => {
    called = true;
    const params = new URL(url).searchParams;
    assert.deepEqual(params.getAll("files"), names);
    assert.deepEqual(params.getAll("fileSizes"), sizes.map(String));
    assert.equal(params.get("type"), "material");
    assert.equal(options.headers.Authorization, "Bearer access");
    assert.equal(options.method, "POST");
    return Response.json([
      { key: "material/a", preSignedUrl: "https://files.example/a" },
    ]);
  });
  const response = await route.POST(
    new NextRequest(`http://localhost/api/files?${query}`, {
      method: "POST",
      headers: { authorization: "Bearer access" },
    }),
  );
  assert.equal(called, true);
  assert.equal(response.status, 200);
  assert.equal((await response.json())[0].key, "material/a");
});

test("file proxy preserves backend validation, authentication and capacity errors", async () => {
  for (const method of ["POST", "GET"]) {
    for (const status of [400, 401, 403, 413, 500]) {
      const error = {
        code: "UPLOAD_REJECTED",
        message: "fileSizes를 확인해주세요.",
        details: { field: "fileSizes" },
      };
      const route = loadRoute(async () => Response.json(error, { status }));
      const response = await route[method](
        new NextRequest(
          "http://localhost/api/files?type=material&files=note.pdf&keys=material/note.pdf",
          { method },
        ),
      );
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), error);
    }
  }
});

test("file proxy reports connection failure as 503 and retains local request validation", async () => {
  const route = loadRoute(async () => {
    throw new TypeError("offline");
  });
  const offline = await route.POST(
    new NextRequest(
      "http://localhost/api/files?type=material&files=note.pdf&fileSizes=1024",
      { method: "POST" },
    ),
  );
  assert.equal(offline.status, 503);
  const invalid = await route.POST(
    new NextRequest("http://localhost/api/files?type=material", {
      method: "POST",
    }),
  );
  assert.equal(invalid.status, 400);
});
