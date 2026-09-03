// 5일 사용 기록의 수치를 규칙대로 계산해 출력한다. 읽기 전용이며 아무것도 바꾸지 않는다.
// 규칙(docs/과제7/5일_사용기록.md 1절과 동일):
//   하루 시간 오차율(%) = (그날 완료한 할 일의 실제 분 합 - 예상 분 합) / 예상 분 합 * 100
//   결측: 예상 분 또는 실제 분이 없으면 분자·분모 양쪽에서 빼고 미기록으로 센다
//   중복: 같은 task_id + 같은 started_at 실행 기록은 가장 먼저 만든 1건만 센다
//   이상치: 실제 분 480 초과는 표시만 하고 합계에는 포함한다
//   반올림: 오차율은 소수점 첫째 자리
// 사용법: node scripts/five-day-report.mjs [user_id]
import postgres from "postgres";
import { readFileSync } from "node:fs";

const userId = process.argv[2] ?? "23";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = (env.match(/^(?:DATABASE_URL|POSTGRES_URL)=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
if (!url) { console.error(".env.local 에 DATABASE_URL 이 없습니다."); process.exit(1); }
const sql = postgres(url, { max: 1, prepare: false });

const rows = await sql`
  SELECT to_char(c.completed_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS day,
         t.id, t.title, t.estimate_minutes,
         (SELECT SUM(d.actual_minutes) FROM
            (SELECT DISTINCT ON (r.task_id, r.started_at) r.actual_minutes
             FROM run_log r WHERE r.task_id = t.id
             ORDER BY r.task_id, r.started_at, r.id) d) AS actual_minutes
  FROM task_completion c JOIN task t ON t.id = c.task_id
  WHERE t.user_id = ${userId} AND t.deleted_at IS NULL
  ORDER BY day, t.id`;

const byDay = new Map();
for (const row of rows) {
  const key = String(row.day).slice(0, 10);
  if (!byDay.has(key)) byDay.set(key, []);
  byDay.get(key).push(row);
}

let totalEstimate = 0, totalActual = 0;
const rates = [];
console.log(`user_id ${userId} — 완료한 할 일의 서울 날짜별 집계`);
for (const [day, list] of [...byDay.entries()].sort()) {
  const usable = list.filter((r) => r.estimate_minutes !== null && r.actual_minutes !== null);
  const estimate = usable.reduce((sum, r) => sum + Number(r.estimate_minutes), 0);
  const actual = usable.reduce((sum, r) => sum + Number(r.actual_minutes), 0);
  const rate = estimate === 0 ? null : Math.round(((actual - estimate) / estimate) * 1000) / 10;
  const outliers = list.filter((r) => Number(r.actual_minutes) > 480).map((r) => r.id);
  totalEstimate += estimate; totalActual += actual;
  if (rate !== null) rates.push(rate);
  console.log(`${day} | 완료 ${list.length}건 | 예상 ${estimate}분 | 실제 ${actual}분 | 오차율 ${rate === null ? "계산 불가" : rate + "%"} | 미기록 ${list.length - usable.length}건 | 이상치 ${outliers.length ? outliers.join(",") : "없음"}`);
  for (const r of list) console.log(`    id ${r.id} | ${r.title} | 예상 ${r.estimate_minutes} | 실제 ${r.actual_minutes}`);
}
const average = rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10 : null;
console.log(`합계 | 예상 ${totalEstimate}분 | 실제 ${totalActual}분 | 오차율 평균 ${average === null ? "계산 불가" : average + "%"}`);

console.log("실행 기록 원본(참고)");
const runs = await sql`
  SELECT r.id, r.task_id, r.started_at, r.actual_minutes
  FROM run_log r JOIN task t ON t.id = r.task_id
  WHERE t.user_id = ${userId} ORDER BY r.id`;
for (const r of runs) console.log(`    run ${r.id} | task ${r.task_id} | ${r.started_at.toISOString()} | ${r.actual_minutes}분`);
await sql.end();
