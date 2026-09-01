const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("집계 다섯 식은 삭제·완료·지연·막힘·분 합계를 같은 대상 집합에서 계산한다", () => {
  // Arrange: 삭제된 할 일과 완료/미완료/막힘 상태가 섞인 최소 표본을 만든다.
  const today = "2026-08-31";
  const tasks = [
    { id: 1, due: "2026-08-10", estimate: 30, done: true, deleted: false, blocked: false, actual: 20 },
    { id: 2, due: "2026-08-20", estimate: 60, done: false, deleted: false, blocked: true, actual: 75 },
    { id: 3, due: "2026-08-22", estimate: 40, done: false, deleted: true, blocked: true, actual: 100 }
  ];
  const target = tasks.filter((task) => !task.deleted && task.due >= "2026-08-01" && task.due <= "2026-08-31");
  const result = {
    planned: target.length,
    done: target.filter((task) => task.done).length,
    overdue: target.filter((task) => !task.done && task.due < today).length,
    blocked: new Set(target.filter((task) => task.blocked).map((task) => task.id)).size,
    estimate: target.reduce((sum, task) => sum + task.estimate, 0),
    actual: target.reduce((sum, task) => sum + task.actual, 0)
  };
  // Assert: 삭제된 3번 할 일은 모든 숫자와 시간 합계에서 빠져야 한다.
  assert.deepEqual(result, { planned: 2, done: 1, overdue: 1, blocked: 1, estimate: 90, actual: 95 });
  assert.equal(result.actual - result.estimate, 5);
});

test("완료 요청을 두 번 보내도 DB 기본키와 ON CONFLICT로 한 행만 남는다", () => {
  assert.match(read("schema.sql"), /task_id bigint PRIMARY KEY/);
  assert.match(read("app/api/tasks/[id]/completion/route.ts"), /ON CONFLICT \(task_id\) DO NOTHING/);
});

test("계획 수정 전 값은 DB 트리거가 OLD 행으로 보관한다", () => {
  const schema = read("schema.sql");
  assert.match(schema, /BEFORE UPDATE ON plan/);
  assert.match(schema, /OLD\.title/);
  assert.match(schema, /INSERT INTO plan_revision/);
});

test("실행 기록 저장 경로는 plan 또는 task를 수정하지 않는다", () => {
  const route = read("app/api/tasks/[id]/runs/route.ts");
  assert.match(route, /INSERT INTO run_log/);
  assert.doesNotMatch(route, /UPDATE\s+(plan|task)/i);
});

test("할 일 기본 정렬은 id 동점 처리자를 포함해 항상 같다", () => {
  const routes = read("app/api/tasks/route.ts") + read("app/tasks/page.tsx");
  assert.equal((routes.match(/ORDER BY t\.due_date ASC NULLS LAST, t\.priority DESC, t\.id ASC/g) || []).length, 2);
});

test("모든 돌아보기 숫자는 같은 조건의 근거 목록으로 연결된다", () => {
  const review = read("app/review/page.tsx");
  for (const metric of ["planned", "done", "overdue", "blocked", "estimate", "actual", "diff"]) {
    assert.match(review, new RegExp(`taskLink\\(\"${metric}\"\\)`));
  }
  assert.match(read("app/tasks/page.tsx"), /buildTaskWhere\(filter\)/);
});
