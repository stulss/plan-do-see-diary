// test 계정의 5일치 할 일을 읽기 전용으로 나열한다. 아무것도 바꾸지 않는다.
// 사용자가 "그날 실제로 몇 분 걸렸는지"를 떠올리기 위한 목록이다.
import postgres from "postgres";
import { readFileSync } from "node:fs";

const userId = process.argv[2] ?? "23";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = (env.match(/^(?:DATABASE_URL|POSTGRES_URL)=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
if (!url) { console.error(".env.local 에 DATABASE_URL 이 없습니다."); process.exit(1); }
const sql = postgres(url, { max: 1, prepare: false });

const rows = await sql`
  SELECT t.id, t.title, t.estimate_minutes, t.start_minute, t.end_minute,
         (t.created_at AT TIME ZONE 'Asia/Seoul')::date AS created_day,
         t.due_date,
         EXISTS (SELECT 1 FROM task_completion c WHERE c.task_id = t.id) AS done,
         COALESCE((SELECT SUM(r.actual_minutes) FROM run_log r WHERE r.task_id = t.id), 0) AS actual
  FROM task t
  WHERE t.user_id = ${userId} AND t.deleted_at IS NULL
  ORDER BY created_day, t.id`;

console.log(`user_id ${userId} — 할 일 ${rows.length}건 (읽기 전용)\n`);
console.log("생성일(서울)  | id | 제목                 | 예상분 | 마감일     | 완료 | 기록된 실제분");
console.log("-".repeat(88));
for (const r of rows) {
  const day = String(r.created_day).slice(0, 10);
  const due = String(r.due_date).slice(0, 10);
  console.log(
    `${day} | ${String(r.id).padStart(2)} | ${String(r.title).padEnd(20).slice(0, 20)} | ${String(r.estimate_minutes ?? "-").padStart(5)} | ${due} | ${r.done ? " O " : " - "} | ${r.actual || "-"}`
  );
}
await sql.end();
