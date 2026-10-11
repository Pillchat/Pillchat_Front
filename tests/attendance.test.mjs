import assert from "node:assert/strict";
import test from "node:test";
import { loader } from "./helpers/load-ts.mjs";
import { NextRequest } from "next/server.js";

const summary = {
  date: "2026-10-11",
  timezone: "Asia/Seoul",
  todayChecked: true,
  totalDays: 20,
  currentStreak: 3,
  longestStreak: 8,
  grade: "HANAL",
};
const loadAttendance = (fetchAPI) =>
  loader(
    {
      window: {
        get localStorage() {
          throw new Error("must not read local attendance");
        },
      },
    },
    { "@/lib/client/fetch": { fetchAPI } },
  )("lib/client/attendance.ts");

test("attendance reads the server counts and earned grade, not device history", async () => {
  const calls = [];
  const api = loadAttendance(async (...args) => {
    calls.push(args);
    return summary;
  });
  assert.deepEqual(await api.readAttendance(), summary);
  assert.deepEqual(calls, [["/api/attendance", "GET"]]);
});

test("repeated check-ins use the server's idempotent endpoint without client dates or totals", async () => {
  const calls = [];
  const api = loadAttendance(async (...args) => {
    calls.push(args);
    return summary;
  });
  assert.equal((await api.checkInAttendance()).totalDays, 20);
  assert.equal((await api.checkInAttendance()).totalDays, 20);
  assert.deepEqual(calls, [
    ["/api/attendance/check-ins", "POST"],
    ["/api/attendance/check-ins", "POST"],
  ]);
});

test("failed check-in rejects instead of creating a local success", async () => {
  const api = loadAttendance(async () => {
    throw new Error("offline");
  });
  await assert.rejects(api.checkInAttendance(), /offline/);
});

test("calendar reads the requested month from the server", async () => {
  const calls = [];
  const api = loadAttendance(async (...args) => {
    calls.push(args);
    return ["2026-09-30"];
  });
  assert.deepEqual(await api.readAttendanceCalendar("2026-09"), ["2026-09-30"]);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["/api/attendance/calendar", "GET", { month: "2026-09" }],
  ]);
});

test("attendance proxy forwards auth, method, query and backend failures", async () => {
  const calls = [];
  const load = loader({
    process: { env: { NEXT_PUBLIC_API_HOST: "https://backend.example" } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
    },
  });
  const route = load("app/api/attendance/[[...path]]/route.ts");
  const response = await route.GET(
    new NextRequest(
      "https://app.example/api/attendance/calendar?month=2026-10",
      { headers: { authorization: "Bearer test-token" } },
    ),
  );
  assert.equal(response.status, 401);
  assert.equal(
    calls[0].url,
    "https://backend.example/api/attendance/calendar?month=2026-10",
  );
  assert.equal(
    calls[0].options.headers.get("authorization"),
    "Bearer test-token",
  );
  await route.POST(
    new NextRequest("https://app.example/api/attendance/check-ins", {
      method: "POST",
    }),
  );
  assert.equal(calls[1].options.method, "POST");
});
