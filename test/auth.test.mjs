import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { checkLoginId, checkNickname, checkPassword } from "../lib/domain/rules.ts";
import { buildTaskWhere } from "../lib/domain/query.ts";
import { me, publicUser } from "../lib/dto/user.ts";
import { publicTask } from "../lib/dto/records.ts";
import { dailyErrorRate, dedupeRuns, isOutlier } from "../lib/domain/metric.ts";

test("비밀번호는 조건이 하나라도 빠지면 거절된다", () => {
  // Arrange: 다 갖춘 값에서 조건을 하나씩만 뺀 표본
  const good = "Diary2026!x";
  const missing = {
    대문자: "diary2026!x",
    소문자: "DIARY2026!X",
    숫자: "DiaryPass!x",
    특수문자: "Diary2026xx",
    길이: "Di26!x"
  };
  // Act + Assert
  assert.equal(checkPassword(good), null, "다 갖춘 값은 통과해야 한다");
  for (const [name, value] of Object.entries(missing)) {
    assert.notEqual(checkPassword(value), null, `${name}가 빠졌는데 통과했다`);
  }
});

test("아이디와 닉네임은 형식 규칙을 지켜야 한다", () => {
  assert.equal(checkLoginId("owner_01"), null);
  assert.notEqual(checkLoginId("ab"), null, "4자 미만은 거절");
  assert.notEqual(checkLoginId("1owner"), null, "첫 글자가 숫자면 거절");
  assert.notEqual(checkLoginId("Owner!"), null, "허용하지 않는 문자는 거절");
  assert.equal(checkNickname("주형"), null);
  assert.notEqual(checkNickname("주"), null, "2자 미만은 거절");
});

test("할 일 조회 조건은 언제나 소유자로 시작한다", () => {
  // 목록·검색·거르기·집계가 모두 이 함수를 지난다. 여기가 뚫리면 목록이 새어 나간다.
  const plain = buildTaskWhere("7", {});
  assert.ok(plain.text.startsWith("t.user_id = $1"), plain.text);
  assert.equal(plain.values[0], "7");

  // 다른 조건이 붙어도 소유자 조건과 자리 번호가 어긋나지 않아야 한다.
  const filtered = buildTaskWhere("7", { from: "2026-09-01", priority: "3" });
  assert.ok(filtered.text.startsWith("t.user_id = $1"));
  assert.equal(filtered.values[0], "7");
  assert.ok(filtered.text.includes("$2") && filtered.text.includes("$3"), filtered.text);
});

test("응답 DTO 는 비밀번호 해시를 절대 내보내지 않는다", () => {
  const row = {
    id: "1", login_id: "owner", nickname: "주형", email: "owner@example.com",
    password_hash: "$2b$12$LEAK", created_at: new Date("2026-09-01T00:00:00Z")
  };
  assert.equal(JSON.stringify(publicUser(row)).includes("password"), false);
  assert.equal(JSON.stringify(me(row)).includes("password"), false);
  assert.equal(Object.keys(me(row)).includes("password_hash"), false);

  // 자료 DTO 도 목록에 없는 컬럼은 통과시키지 않는다.
  const task = { id: "1", plan_id: "1", title: "쓰기", user_id: "9", deleted_at: null, secret_column: "x" };
  assert.equal(Object.keys(publicTask(task)).includes("secret_column"), false);
  assert.equal(Object.keys(publicTask(task)).includes("user_id"), false);
  assert.equal(Object.keys(publicTask(task)).includes("deleted_at"), false);
});

test("할 일 목록 API는 DB 행을 DTO로 가린 뒤 응답한다", async () => {
  const source = await readFile(new URL("../app/api/tasks/route.ts", import.meta.url), "utf8");
  assert.match(source, /rows\.map\(\(row\) => \(\{\s*\.\.\.publicTask\(row\)/s);
  assert.doesNotMatch(source, /NextResponse\.json\(rows\)/);
});

test("하루 시간 오차율은 결측을 빼고 소수점 첫째 자리에서 반올림한다", () => {
  // 예상 100 + 50, 실제 130 + 50 -> (180-150)/150*100 = 20
  const result = dailyErrorRate([
    { estimate: 100, actual: 130 },
    { estimate: 50, actual: 50 },
    { estimate: null, actual: 40 },
    { estimate: 30, actual: null }
  ]);
  assert.equal(result.estimate, 150);
  assert.equal(result.actual, 180);
  assert.equal(result.missing, 2, "값이 빠진 두 건은 미기록으로 따로 센다");
  assert.equal(result.rate, 20);

  // 반올림 자리 확인: (100-90)/90*100 = 11.111... -> 11.1
  assert.equal(dailyErrorRate([{ estimate: 90, actual: 100 }]).rate, 11.1);

  // 분모가 0이면 오차율을 만들지 않는다.
  assert.equal(dailyErrorRate([{ estimate: 0, actual: 10 }]).rate, null);
  assert.equal(dailyErrorRate([]).rate, null);
});

test("이상치는 표시만 하고 합계에서 빼지 않는다", () => {
  assert.equal(isOutlier(481), true);
  assert.equal(isOutlier(480), false);
  // 이상치가 있어도 합계에 그대로 들어간다.
  assert.equal(dailyErrorRate([{ estimate: 60, actual: 600 }]).actual, 600);
});

test("같은 할 일에 같은 시작 시각인 실행 기록은 먼저 만든 1건만 센다", () => {
  const runs = [
    { id: 2, task_id: 1, started_at: "2026-09-01T09:00:00Z" },
    { id: 1, task_id: 1, started_at: "2026-09-01T09:00:00Z" },
    { id: 3, task_id: 1, started_at: "2026-09-01T13:00:00Z" }
  ];
  const kept = dedupeRuns(runs);
  assert.equal(kept.length, 2);
  assert.equal(kept[0].id, 1, "가장 먼저 만들어진 행이 남아야 한다");
});
