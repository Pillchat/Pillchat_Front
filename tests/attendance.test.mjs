import assert from "node:assert/strict";
import test from "node:test";
import { loader, storage } from "./helpers/load-ts.mjs";

const today = new Date(2026, 9, 8, 23, 59);
const tomorrow = new Date(2026, 9, 9, 0, 1);
const loadAttendance = (localStorage) =>
  loader({ window: { localStorage } })("lib/client/attendance.ts");

test("check-in survives reload and counts each calendar day only once", () => {
  const localStorage = storage();
  const api = loadAttendance(localStorage);
  assert.equal(api.readAttendance(today).days, 0);
  assert.equal(api.checkInAttendance(today).days, 1);

  const reloaded = loadAttendance(localStorage);
  assert.equal(reloaded.readAttendance(today).completed, true);
  assert.equal(reloaded.checkInAttendance(today).days, 1);
  assert.equal(reloaded.readAttendance(tomorrow).completed, false);
  assert.equal(reloaded.readAttendance(tomorrow).days, 1);
  assert.equal(reloaded.checkInAttendance(tomorrow).days, 2);
  assert.equal(reloaded.readAttendance(tomorrow).completed, true);
});

test("uses local calendar components even when the UTC date is different", () => {
  const api = loadAttendance(storage());
  const localDate = {
    getFullYear: () => 2026,
    getMonth: () => 9,
    getDate: () => 9,
    toISOString: () => "2026-10-08T15:01:00.000Z",
  };
  assert.equal(api.getAttendanceDate(localDate), "2026-10-09");
});

test("a stale tab rereads saved check-ins instead of losing previous days", () => {
  const localStorage = storage();
  const first = loadAttendance(localStorage);
  const second = loadAttendance(localStorage);
  second.readAttendance(today);
  first.checkInAttendance(today);
  assert.equal(second.checkInAttendance(today).days, 1);
  assert.equal(second.checkInAttendance(tomorrow).days, 2);
  assert.equal(first.readAttendance(tomorrow).days, 2);
});

test("invalid storage recovers, and duplicate or invalid dates are not counted", () => {
  const localStorage = storage();
  const api = loadAttendance(localStorage);
  for (const raw of ["{broken", "null", '{"days":99}']) {
    localStorage.setItem(api.ATTENDANCE_STORAGE_KEY, raw);
    assert.equal(api.readAttendance(today).days, 0);
    assert.equal(api.checkInAttendance(today).days, 1);
  }
  localStorage.setItem(
    api.ATTENDANCE_STORAGE_KEY,
    JSON.stringify(["2026-10-08", "2026-10-08", "2026-02-30", null, 123]),
  );
  assert.equal(api.readAttendance(today).days, 1);
});

test("storage failures do not return a successful check-in", () => {
  const localStorage = storage();
  const api = loadAttendance(localStorage);
  localStorage.setItem = () => {
    throw new Error("QuotaExceededError");
  };
  assert.throws(() => api.checkInAttendance(today), /QuotaExceededError/);
  assert.equal(api.readAttendance(today).completed, false);

  localStorage.getItem = () => {
    throw new Error("SecurityError");
  };
  assert.throws(() => api.checkInAttendance(today), /SecurityError/);
});

test("reading on the server does not access browser storage", () => {
  const api = loader()("lib/client/attendance.ts");
  assert.equal(api.readAttendance(today).days, 0);
  assert.equal(api.readAttendance(today).completed, false);
});
