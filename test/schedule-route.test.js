import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("드래그 날짜 변경은 로그인 사용자 소유의 할 일만 수정한다", async () => {
  const source = await readFile(new URL("../app/api/tasks/[id]/date/route.ts", import.meta.url), "utf8");
  assert.match(source, /WHERE id=.*AND user_id=.*AND deleted_at IS NULL/s);
  assert.match(source, /SET start_date=.*due_date=.*updated_at=now\(\)/s);
});

test("할 일은 계획 없이도 만들 수 있고 선택한 계획은 소유자를 확인한다", async () => {
  const source = await readFile(new URL("../app/api/tasks/route.ts", import.meta.url), "utf8");
  assert.match(source, /planId === null/);
  assert.match(source, /FROM plan p WHERE p\.id=.*AND p\.user_id=/s);
});

test("예상·실제 시간은 클라이언트가 보낸 분 값을 믿지 않고 서버에서 계산한다", async () => {
  const task = await readFile(new URL("../app/api/tasks/route.ts", import.meta.url), "utf8");
  const run = await readFile(new URL("../app/api/tasks/[id]/runs/route.ts", import.meta.url), "utf8");
  assert.match(task, /taskSchedule\(value\(body, "start_time"\), value\(body, "end_time"\)\)/);
  assert.doesNotMatch(task, /integer\(body, "estimate_minutes"/);
  assert.match(run, /runDuration\(value\(body, "started_at"\), value\(body, "ended_at"\)\)/);
  assert.doesNotMatch(run, /integer\(body, "actual_minutes"/);
});
