import test from "node:test";
import assert from "node:assert/strict";
import { loader } from "./helpers/load-ts.mjs";
const normalize = (value) => JSON.parse(JSON.stringify(value));
const inquiry = {
  id: 31,
  title: "문의",
  content: "문의 내용",
  createdAt: "2026-10-11T10:00:00+09:00",
  status: "ANSWERED",
  attachments: [{ fileId: 91, fileName: "evidence.png" }],
  answer: {
    content: "<b>담당자의 답변</b>",
    authorName: "운영팀",
    answeredAt: "2026-10-11T11:00:00+09:00",
  },
};
const json = (value) => new Response(JSON.stringify(value));
const file = (name = "evidence.png") =>
  new File(["abc"], name, { type: "image/png" });
function setup(overrides = {}, globals = {}) {
  class ApiError extends Error {
    constructor(status, data = {}) {
      super(data.message);
      this.status = status;
    }
  }
  const api = {
    ApiError,
    getValidAccessToken: async () => "access",
    recoverAccessToken: async () => null,
    ...overrides,
  };
  return {
    ...loader(globals, { "./fetch": api })("lib/client/support.ts"),
    ApiError,
  };
}
test("support uploads actual file separately then registers JSON with attachmentIds", async () => {
  let body;
  const client = setup(
    {
      fetchAPI: async (url, method, value) => {
        assert.equal(url, "/api/support/inquiries");
        assert.equal(method, "POST");
        body = value;
        return { id: 31 };
      },
    },
    {
      fetch: async (url, options) => {
        assert.equal(url, "/api/support/attachments");
        assert.equal(options.headers.Authorization, "Bearer access");
        assert.equal(options.headers["Content-Type"], undefined);
        assert.equal(options.body.get("file").name, "evidence.png");
        assert.equal(await options.body.get("file").text(), "abc");
        assert.deepEqual([...options.body.keys()], ["file"]);
        return json({ fileId: 91 });
      },
    },
  );
  assert.equal(
    (
      await new client.SupportSubmission({
        title: " 문의 ",
        content: " 내용 ",
        files: [file()],
      }).submit()
    ).id,
    "31",
  );
  assert.deepEqual(normalize(body.attachmentIds), [91]);
  assert.equal(body.title, "문의");
  assert.match(body.idempotencyKey, /^[\da-f-]{36}$/);
  assert.equal(Object.hasOwn(body, "requestId"), false);
});
test("uncertain registration retries identical JSON and UUID without uploading attachments again", async () => {
  const bodies = [];
  let uploads = 0;
  const client = setup(
    {
      fetchAPI: async (_url, _method, body) => {
        bodies.push(body);
        if (bodies.length === 1) throw new TypeError("network");
        return { inquiryId: "31" };
      },
    },
    {
      fetch: async () => {
        uploads++;
        return json({ fileId: 91 });
      },
    },
  );
  const submission = new client.SupportSubmission({
    title: "문의",
    content: "내용",
    files: [file()],
  });
  await assert.rejects(() => submission.submit());
  assert.equal(submission.uncertain, true);
  await submission.submit();
  assert.equal(submission.uncertain, false);
  assert.equal(uploads, 1);
  assert.equal(bodies[0], bodies[1]);
});
test("partially uploaded attachments resume from last confirmed file", async () => {
  let uploads = 0;
  let ids;
  const client = setup(
    {
      fetchAPI: async (_u, _m, body) => {
        ids = body.attachmentIds;
        return { id: 31 };
      },
    },
    {
      fetch: async () => {
        uploads++;
        if (uploads === 2) throw new TypeError("network");
        return json({ fileId: uploads });
      },
    },
  );
  const submission = new client.SupportSubmission({
    title: "문의",
    content: "내용",
    files: [file("one.png"), file("two.png")],
  });
  await assert.rejects(() => submission.submit());
  await submission.submit();
  assert.deepEqual(normalize(ids), [1, 3]);
  assert.equal(uploads, 3);
});
test("support sends empty attachments and accepts 200 character titles, rejects 201", async () => {
  let calls = 0;
  const client = setup({
    fetchAPI: async (_u, _m, body) => {
      calls++;
      assert.deepEqual(normalize(body.attachmentIds), []);
      return { id: 31 };
    },
  });
  await new client.SupportSubmission({
    title: "가".repeat(200),
    content: "문의",
    files: [],
  }).submit();
  await assert.rejects(() =>
    new client.SupportSubmission({
      title: "가".repeat(201),
      content: "문의",
      files: [],
    }).submit(),
  );
  assert.equal(calls, 1);
});
test("support malformed success is not a receipt and keeps retry uncertain", async () => {
  const client = setup({ fetchAPI: async () => ({ success: true }) });
  const submission = new client.SupportSubmission({
    title: "문의",
    content: "내용",
    files: [],
  });
  await assert.rejects(() => submission.submit());
  assert.equal(submission.uncertain, true);
});
test("support attachment auth refresh resends the same multipart body", async () => {
  const bodies = [];
  const client = setup(
    { recoverAccessToken: async () => "fresh" },
    {
      fetch: async (_u, options) => {
        bodies.push(options.body);
        if (bodies.length === 1) return new Response("{}", { status: 401 });
        assert.equal(options.headers.Authorization, "Bearer fresh");
        return json({ fileId: 91 });
      },
    },
  );
  assert.equal(await client.uploadSupportAttachment(file()), 91);
  assert.equal(bodies[0], bodies[1]);
});
test("support list allows summaries without detail fields; detail uses nullable answer", async () => {
  const calls = [];
  const client = setup({
    fetchAPI: async (...args) => {
      calls.push(args);
      return args[0].endsWith("inquiries")
        ? {
            items: [
              {
                id: 31,
                title: "문의",
                createdAt: inquiry.createdAt,
                status: "RECEIVED",
              },
            ],
            hasNext: true,
          }
        : inquiry;
    },
  });
  const page = await client.readSupportInquiries(2);
  assert.equal(page.page, 2);
  assert.equal(page.hasNext, true);
  const detail = await client.readSupportInquiry("31");
  assert.equal(detail.answer.authorName, "운영팀");
  assert.equal(detail.answer.content, "<b>담당자의 답변</b>");
  assert.equal(detail.attachments[0].id, "91");
  assert.deepEqual(normalize(calls[0]), [
    "/api/support/inquiries",
    "GET",
    { page: 2, size: 20 },
  ]);
  const unanswered = setup({
    fetchAPI: async () => ({ ...inquiry, answer: null }),
  });
  assert.equal((await unanswered.readSupportInquiry("31")).answer, null);
});
test("support download uses returned downloadUrl and rejects executable URLs", async () => {
  let anchor;
  const client = setup(
    {
      fetchAPI: async () => ({
        downloadUrl: "https://files.example/signed?token=test",
      }),
    },
    {
      document: {
        createElement: () =>
          (anchor = {
            click() {
              this.clicked = true;
            },
          }),
      },
    },
  );
  await client.downloadSupportAttachment("31", {
    id: "91",
    name: "evidence.png",
  });
  assert.equal(anchor.href, "https://files.example/signed?token=test");
  assert.equal(anchor.clicked, true);
  assert.equal(anchor.rel, "noopener noreferrer");
  await assert.rejects(() =>
    setup({
      fetchAPI: async () => ({ downloadUrl: "javascript:alert(1)" }),
    }).downloadSupportAttachment("31", { id: "91", name: "x" }),
  );
});
test("support validates image 10MB and PDF/total 30MB with no mixing", () => {
  const client = setup();
  const image = { type: "image/png", size: 10 * 1024 * 1024 };
  const pdf = { type: "application/pdf", size: 30 * 1024 * 1024 };
  assert.equal(client.validateSupportFiles([pdf]), null);
  assert.equal(client.validateSupportFiles([image, image, image]), null);
  assert.ok(client.validateSupportFiles([image, pdf]));
  assert.ok(client.validateSupportFiles([{ ...pdf, size: pdf.size + 1 }]));
  assert.ok(client.validateSupportFiles([{ ...image, size: image.size + 1 }]));
  assert.ok(client.validateSupportFiles(Array(4).fill(image)));
  assert.ok(client.validateSupportFiles(Array(11).fill({ ...image, size: 1 })));
  assert.ok(client.validateSupportFiles([{ ...image, size: 0 }]));
});
test("support BFF forwards JSON and multipart with authentication and preserves failures", async () => {
  const { NextRequest } = await import("next/server.js");
  const original = process.env.NEXT_PUBLIC_API_HOST;
  process.env.NEXT_PUBLIC_API_HOST = "https://backend.example";
  try {
    for (const path of ["inquiries/[[...path]]", "attachments"]) {
      let sent;
      const route = loader({
        fetch: async (url, options) => {
          sent = { url, options };
          return new Response("{}", { status: 503 });
        },
      })(`app/api/support/${path}/route.ts`);
      const base = path.split("/")[0];
      const type =
        base === "attachments"
          ? "multipart/form-data; boundary=test"
          : "application/json";
      const response = await route.POST(
        new NextRequest(`http://localhost/api/support/${base}`, {
          method: "POST",
          headers: { authorization: "Bearer access", "content-type": type },
          body: "payload",
        }),
      );
      assert.equal(sent.url, `https://backend.example/api/support/${base}`);
      assert.equal(sent.options.headers.get("authorization"), "Bearer access");
      assert.equal(sent.options.headers.get("content-type"), type);
      assert.equal(response.status, 503);
    }
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_API_HOST;
    else process.env.NEXT_PUBLIC_API_HOST = original;
  }
});
