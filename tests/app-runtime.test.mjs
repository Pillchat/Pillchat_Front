import test from "node:test";
import assert from "node:assert/strict";
import { loader } from "./helpers/load-ts.mjs";

test("upload ignores overlapping taps and unlocks after a failed submission", async () => {
  let reject;
  let calls = 0;
  const { useUploadForm } = loader(
    {},
    {
      react: {
        useRef: (value) => ({ current: value }),
        useState: (value) => [value, () => {}],
      },
      "react-hook-form": {
        useForm: () => ({
          control: {},
          watch: () => "",
          setValue() {},
          reset() {},
          formState: { errors: {}, isValid: true },
          handleSubmit: (callback) => () =>
            callback({ title: "test", content: "body" }),
        }),
      },
    },
  )("app/(board)/upload/_hooks/useUploadForm.ts");
  const form = useUploadForm({
    onSubmit: () => {
      calls++;
      return new Promise((_resolve, fail) => {
        reject = fail;
      });
    },
  });
  const first = form.handleUpload();
  await form.handleUpload();
  assert.equal(calls, 1);
  reject(new Error("network"));
  await assert.rejects(first, /network/);
  const second = form.handleUpload();
  assert.equal(calls, 2);
  reject(new Error("network"));
  await assert.rejects(second, /network/);
});

function nativeWindow() {
  const win = new EventTarget();
  const events = new Map();
  const back = new Map();
  const opened = [];
  win.Nachocode = {
    initAsync: async () => {},
    env: { isApp: () => true },
    event: { on: (name, callback) => events.set(name, callback) },
    backkey: {
      addEvent: (callback, id) => {
        back.set(id, callback);
        return id;
      },
      removeEvent: (id) => back.delete(id),
    },
    browser: { openLink: (...args) => opened.push(args) },
  };
  win.open = () => {
    throw new Error("Native flow must not create an empty popup");
  };
  return { win, events, back, opened };
}

test("native back closes the newest modal before the underlying practice and removes only its own handler", () => {
  const { win, back } = nativeWindow();
  const calls = [];
  const app = loader({ window: win })("lib/client/nativeApp.ts");
  const modal = app.registerNativeBack(() => calls.push("modal"), 100);
  const practice = app.registerNativeBack(() => calls.push("practice"), 10);
  const nested = app.registerNativeBack(() => calls.push("nested"), 100);
  back.get("pillchat:back")();
  nested();
  back.get("pillchat:back")();
  modal();
  back.get("pillchat:back")();
  practice();
  assert.deepEqual(calls, ["nested", "modal", "practice"]);
  assert.equal(back.size, 0);
});

test("native events install once and forward resume, keyboard and connection state", () => {
  const { win, events } = nativeWindow();
  const app = loader({ window: win, CustomEvent })("lib/client/nativeApp.ts");
  const received = [];
  for (const name of [app.APP_RESUME, app.APP_KEYBOARD, "pillchat:network"])
    win.addEventListener(name, (event) => received.push([name, event.detail]));
  app.connectNativeEvents(win.Nachocode);
  const foreground = events.get("foreground");
  app.connectNativeEvents(win.Nachocode);
  assert.equal(events.get("foreground"), foreground);
  foreground();
  events.get("keyboardshown")();
  events.get("keyboardhidden")();
  events.get("networkchanged")({ isConnected: false });
  assert.deepEqual(received, [
    [app.APP_RESUME, undefined],
    [app.APP_KEYBOARD, true],
    [app.APP_KEYBOARD, false],
    ["pillchat:network", false],
  ]);
});

test("native signed links use the external browser and reject executable/credential URLs", () => {
  const { win, opened } = nativeWindow();
  const links = loader({ window: win })("lib/client/externalLinks.ts");
  const target = links.prepareExternalOpen();
  target.open("https://files.example/signed?token=123");
  assert.deepEqual(opened, [
    ["https://files.example/signed?token=123", "external"],
  ]);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "https://user:pass@example.com",
  ])
    assert.throws(() => target.open(url));
});

test("browser reserves a popup synchronously and reports blocked or closed windows", () => {
  const popup = {
    location: {},
    closed: false,
    close() {
      this.closed = true;
    },
  };
  const win = { open: () => popup };
  const links = loader({ window: win })("lib/client/externalLinks.ts");
  const target = links.prepareExternalOpen();
  assert.equal(popup.opener, null);
  target.open("https://files.example/a.pdf");
  assert.equal(popup.location.href, "https://files.example/a.pdf");
  target.close();
  assert.throws(() => target.open("https://files.example/a.pdf"));
  win.open = () => null;
  assert.throws(() => links.prepareExternalOpen(), /차단/);
});

test("file picker accepts missing MIME for known extensions without overriding a declared type", () => {
  const { uploadContentType } = loader()("lib/client/files.ts");
  assert.equal(
    uploadContentType({ name: "강의.PDF", type: "" }),
    "application/pdf",
  );
  assert.equal(uploadContentType({ name: "사진.JPG", type: "" }), "image/jpeg");
  assert.equal(
    uploadContentType({ name: "사진.png", type: "text/html" }),
    "text/html",
  );
  assert.equal(
    uploadContentType({ name: "unknown", type: "" }),
    "application/octet-stream",
  );
});

test("authenticated file retries a 401 with fresh credentials and retains the blob until WebKit consumes it", async () => {
  const calls = [];
  let timer;
  let revoked = false;
  const anchor = {
    click() {
      assert.equal(revoked, false);
      this.clicked = true;
    },
    remove() {},
  };
  const { downloadAuthenticatedFile } = loader(
    {
      fetch: async (_url, options) => {
        calls.push(options.headers.Authorization);
        return calls.length === 1
          ? new Response(null, { status: 401 })
          : new Response("pdf");
      },
      URL: {
        createObjectURL: () => "blob:test",
        revokeObjectURL: () => {
          revoked = true;
        },
      },
      document: { createElement: () => anchor, body: { appendChild() {} } },
      setTimeout: (fn, delay) => {
        timer = fn;
        assert.equal(delay, 60_000);
      },
    },
    {
      "./fetch": {
        getValidAccessToken: async () => "old",
        recoverAccessToken: async () => "fresh",
      },
    },
  )("lib/client/files.ts");
  await downloadAuthenticatedFile("/api/exam/pdf", "시험지.pdf");
  assert.deepEqual(calls, ["Bearer old", "Bearer fresh"]);
  assert.equal(anchor.download, "시험지.pdf");
  assert.equal(anchor.clicked, true);
  assert.equal(revoked, false);
  timer();
  assert.equal(revoked, true);
});
