const { test } = require("node:test");
const assert = require("node:assert/strict");

test("시작·마감 시각으로 할 일 예상 분을 계산한다", async () => {
  const { taskSchedule, clockText } = await import("../lib/domain/time.ts");
  assert.deepEqual(taskSchedule("09:15", "10:45"), { startMinute: 555, endMinute: 645, minutes: 90 });
  assert.equal(clockText(555), "09:15");
  assert.throws(() => taskSchedule("10:00", "10:00"), /늦어야/);
});

test("실행 시작·종료 시각으로 자정을 넘긴 실제 분도 계산한다", async () => {
  const { runDuration } = await import("../lib/domain/time.ts");
  assert.equal(runDuration("2026-09-02T23:30", "2026-09-03T00:15").minutes, 45);
  assert.throws(() => runDuration("2026-09-02T10:00", "2026-09-02T09:59"), /늦어야/);
});
