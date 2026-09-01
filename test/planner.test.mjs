import test from "node:test";
import assert from "node:assert/strict";
import { getPlannerWindow, shiftAnchor } from "../lib/planner.ts";

test("주간 플래너는 월요일부터 일요일까지 7일을 만든다", () => {
  const result = getPlannerWindow("week", "2026-08-31");
  assert.equal(result.focusStart, "2026-08-31");
  assert.equal(result.focusEnd, "2026-09-06");
  assert.equal(result.days.length, 7);
});

test("월간 플래너는 앞뒤 날짜를 포함한 6주 격자를 만든다", () => {
  const result = getPlannerWindow("month", "2026-08-31");
  assert.equal(result.focusStart, "2026-08-01");
  assert.equal(result.focusEnd, "2026-08-31");
  assert.equal(result.days.length, 42);
  assert.equal(result.visibleStart, "2026-07-27");
  assert.equal(result.visibleEnd, "2026-09-06");
});

test("일간·주간·월간 이동은 각각 하루·7일·한 달 단위다", () => {
  assert.equal(shiftAnchor("day", "2026-08-31", 1), "2026-09-01");
  assert.equal(shiftAnchor("week", "2026-08-31", 1), "2026-09-07");
  assert.equal(shiftAnchor("month", "2026-08-31", 1), "2026-09-01");
});
