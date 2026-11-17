import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { loader } from "./helpers/load-ts.mjs";

const snapshot = {
  id: "9007199254740997",
  userName: "학생",
  status: "PENDING",
  submittedAt: "2026-11-16T14:30:00+09:00",
  imageUrl: "https://files.example.test/private",
};
class ApiError extends Error {
  constructor(status, data) {
    super(data.message);
    this.status = status;
  }
}
const api = (fetchAPI, globals = {}, auth = {}) =>
  loader(globals, {
    "./auth": { getCurrentUserId: auth.getCurrentUserId ?? (() => "owner") },
    "./fetch": {
      ApiError,
      fetchAPI,
      getValidAccessToken: async () => "token",
      recoverAccessToken: async () => "new-token",
      ...auth,
    },
  })("lib/client/studentVerification.ts");

test("student images reject empty, oversized and active content before upload", () => {
  const client = api();
  assert.equal(
    client.validateStudentIdImage({
      name: "student.png",
      type: "image/png",
      size: 1,
    }),
    null,
  );
  for (const file of [
    { name: "student.svg", type: "image/svg+xml", size: 1 },
    { name: "student.png", type: "image/png", size: 0 },
    { name: "student.jpg", type: "image/jpeg", size: 10 * 1024 * 1024 + 1 },
  ])
    assert.ok(client.validateStudentIdImage(file));
});

test("a lost registration response reuses both uploaded file and request key", async () => {
  const calls = [];
  let uploads = 0;
  const client = api(
    async (url, method, body) => {
      calls.push({ url, method, body });
      if (calls.length === 1) throw new Error("lost response");
      return snapshot;
    },
    {
      fetch: async (url, options) => {
        uploads++;
        assert.equal(url, "/api/student-verifications/attachments");
        assert.equal(options.headers.Authorization, "Bearer token");
        assert.equal(options.headers["Content-Type"], undefined);
        assert.equal(options.body.get("file").name, "student.png");
        return Response.json({ fileId: "9007199254740995" });
      },
    },
  );
  const file = new File(["image"], "student.png", { type: "image/png" });
  const submission = new client.StudentVerificationSubmission(file);
  await assert.rejects(submission.submit(), /lost response/);
  assert.equal(submission.uncertain, true);
  assert.equal((await submission.submit()).id, snapshot.id);
  assert.equal(submission.uncertain, false);
  assert.equal(uploads, 1);
  assert.equal(calls[0].body.fileId, "9007199254740995");
  assert.equal(calls[0].body.idempotencyKey, calls[1].body.idempotencyKey);
});

test("attachment refresh retries once without a multipart content-type override", async () => {
  const tokens = [];
  const client = api(async () => snapshot, {
    fetch: async (url, options) => {
      tokens.push(options.headers.Authorization);
      return tokens.length === 1
        ? Response.json({}, { status: 401 })
        : Response.json({ fileId: "8" });
    },
  });
  await new client.StudentVerificationSubmission(
    new File(["image"], "student.png", { type: "image/png" }),
  ).submit();
  assert.deepEqual(tokens, ["Bearer token", "Bearer new-token"]);
});

test("private reads validate IDs, status and image URL; no request is null", async () => {
  assert.equal(await api(async () => null).readMyStudentVerification(), null);
  assert.equal(
    (await api(async () => snapshot).readMyStudentVerification()).id,
    snapshot.id,
  );
  for (const bad of [
    { ...snapshot, id: 9007199254740997 },
    { ...snapshot, imageUrl: "javascript:alert(1)" },
    { ...snapshot, status: "UNKNOWN" },
  ])
    await assert.rejects(api(async () => bad).readMyStudentVerification());
  const list = api(async (url, method, params) => {
    assert.deepEqual(JSON.parse(JSON.stringify(params)), { page: 2, size: 20 });
    return { items: [snapshot], page: 2, hasNext: true };
  });
  assert.equal((await list.readPendingStudentVerifications(2)).hasNext, true);
  await assert.rejects(
    api(async () => ({
      items: [{ ...snapshot, status: "APPROVED" }],
      page: 0,
      hasNext: false,
    })).readPendingStudentVerifications(),
  );
  assert.equal(
    api().formatVerificationDate(snapshot.submittedAt),
    "2026.11.16 14:30",
  );
});

test("review uses the protected API and validates the persisted decision", async () => {
  const client = api(async (url, method, body) => {
    assert.equal(
      url,
      "/api/admin/student-verifications/" + snapshot.id + "/review",
    );
    assert.equal(method, "PUT");
    assert.equal(body.decision, "APPROVED");
    return { ...snapshot, status: "APPROVED" };
  });
  assert.equal(
    (await client.reviewStudentVerification(snapshot.id, "APPROVED")).status,
    "APPROVED",
  );
  await assert.rejects(
    api(async () => snapshot).reviewStudentVerification(
      snapshot.id,
      "APPROVED",
    ),
  );
  await assert.rejects(
    client.reviewStudentVerification(snapshot.id, "PENDING"),
  );
});

test("proxy preserves auth, binary multipart body, query and no-store even with Next route context", async () => {
  const previous = process.env.NEXT_PUBLIC_API_HOST;
  process.env.NEXT_PUBLIC_API_HOST = "https://backend.example.test";
  try {
    for (const [route, url, method] of [
      [
        "app/api/student-verifications/[[...path]]/route.ts",
        "/api/student-verifications/attachments",
        "POST",
      ],
      [
        "app/api/admin/student-verifications/[[...path]]/route.ts",
        "/api/admin/student-verifications?page=2",
        "GET",
      ],
      [
        "app/api/admin/student-verifications/[[...path]]/route.ts",
        "/api/admin/student-verifications/7/review",
        "PUT",
      ],
    ]) {
      const boundary = "test-boundary";
      const body = "arbitrary multipart binary body";
      const load = loader(
        {
          fetch: async (target, options) => {
            assert.equal(target, "https://backend.example.test" + url);
            assert.equal(options.headers.get("authorization"), "Bearer token");
            if (method !== "GET")
              assert.equal(Buffer.from(options.body).toString(), body);
            return Response.json({ message: "denied" }, { status: 403 });
          },
        },
        {
          "next/server": {
            NextRequest,
            NextResponse: (await import("next/server.js")).NextResponse,
          },
        },
      );
      const request = new NextRequest("https://frontend.test" + url, {
        method,
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "multipart/form-data; boundary=" + boundary,
        },
        ...(method === "GET" ? {} : { body }),
      });
      const response = await load(route)[method](request, {
        params: Promise.resolve({ path: [] }),
      });
      assert.equal(response.status, 403);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
  } finally {
    process.env.NEXT_PUBLIC_API_HOST = previous;
  }
});

test("a selected student ID cannot be uploaded after the signed-in account changes", async () => {
  let owner = "alice";
  let uploads = 0;
  let registrations = 0;
  const client = api(
    async () => {
      registrations++;
      return snapshot;
    },
    {
      fetch: async () => {
        uploads++;
        return Response.json({ fileId: "8" });
      },
    },
    {
      getCurrentUserId: () => owner,
      getValidAccessToken: async () => {
        owner = "bob";
        return "bob-token";
      },
    },
  );
  const selected = new client.StudentVerificationSubmission(
    new File(["image"], "student.png", { type: "image/png" }),
  );
  await assert.rejects(selected.submit(), /로그인 정보가 변경/);
  assert.equal(uploads, 0);
  assert.equal(registrations, 0);
});

test("native images without a MIME type keep their inferred type in multipart upload", async () => {
  for (const [name, type] of [
    ["학생증.JPG", "image/jpeg"],
    ["학생증.png", "image/png"],
    ["학생증.WEBP", "image/webp"],
  ]) {
    const file = new File(["image"], name, { type: "" });
    let uploads = 0;
    const client = api(async () => snapshot, {
      fetch: async (_url, options) => {
        uploads++;
        const uploaded = options.body.get("file");
        assert.equal(uploaded.name, name);
        assert.equal(uploaded.type, type);
        assert.equal(await uploaded.text(), "image");
        assert.equal(options.headers["Content-Type"], undefined);
        return Response.json({ fileId: "8" });
      },
    });
    assert.equal(client.validateStudentIdImage(file), null);
    await new client.StudentVerificationSubmission(file).submit();
    assert.equal(uploads, 1);
  }
  const client = api();
  for (const file of [
    { name: "student.HEIC", type: "", size: 10 },
    { name: "student.png", type: "text/html", size: 10 },
  ])
    assert.ok(client.validateStudentIdImage(file));
});
