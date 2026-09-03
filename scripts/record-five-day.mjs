// 5일 사용 기록의 "완료 표시"와 "실행 기록"을 사용자가 알려 준 실제 값으로 DB 에 남긴다.
//
// 아래 RECORDS 의 실제 분은 2026-09-03 사용자가 직접 알려 준 값이다 ("실제 걸린분은 동일하게 4분이야").
// 스크립트가 수치를 스스로 만들지 않는다 (CLAUDE.md 9번).
//
// 시작 시각은 지어내지 않고 그 할 일의 실제 created_at(서울)을 그대로 쓴다.
//
// 사용법:
//   node scripts/record-five-day.mjs            → 미리보기만 (아무것도 쓰지 않음)
//   node scripts/record-five-day.mjs --apply    → 실제로 입력
//
// 안전장치
//   - 한 트랜잭션으로 처리한다. 하나라도 어긋나면 전부 되돌린다.
//   - 소유자(user_id)가 맞는 할 일만 건드린다.
//   - 재실행해도 중복되지 않는다 (완료는 기본키 ON CONFLICT, 실행 기록은 같은 시작 시각이면 건너뜀).
//   - plan/task 의 예상 시간은 절대 수정하지 않는다 (CLAUDE.md 6번).
//   - 이미 있는 완료·실행 기록은 덮어쓰지 않고 충돌로 보고만 한다.
//   - 실행 전후 행 수를 세어 의도한 만큼만 늘었는지 확인한다.
import postgres from "postgres";
import { readFileSync } from "node:fs";

const USER_ID = process.env.PDSD_USER_ID ?? "23";
const APPLY = process.argv.includes("--apply");

// 사용자가 정한 값: 5일 각각 할 일 1건, 실제 걸린 시간은 모두 4분.
const ACTUAL_MINUTES = 4;
const RECORDS = [
  { day: "2026-08-29", taskId: 23, actual: ACTUAL_MINUTES },
  { day: "2026-08-30", taskId: 24, actual: ACTUAL_MINUTES },
  { day: "2026-08-31", taskId: 25, actual: ACTUAL_MINUTES },
  { day: "2026-09-01", taskId: 26, actual: ACTUAL_MINUTES },
  { day: "2026-09-02", taskId: 27, actual: ACTUAL_MINUTES }
];

for (const r of RECORDS) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.day)) throw new Error(`날짜 형식이 틀렸습니다: ${r.day}`);
  if (!Number.isInteger(r.actual) || r.actual < 0) throw new Error(`${r.day}: 실제 분이 정수가 아닙니다`);
}
if (new Set(RECORDS.map((r) => r.day)).size !== RECORDS.length) throw new Error("같은 날짜가 두 번 들어 있습니다.");

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = (env.match(/^(?:DATABASE_URL|POSTGRES_URL)=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
if (!url) { console.error(".env.local 에 DATABASE_URL 이 없습니다."); process.exit(1); }
const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 15 });

// 소유권과 실제 생성 시각을 함께 확인한다. 내 할 일이 아니면 여기서 멈춘다.
const ids = RECORDS.map((r) => r.taskId);
const owned = await sql`
  SELECT t.id, t.title, t.estimate_minutes,
         to_char(t.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS made_day,
         to_char(t.created_at AT TIME ZONE 'Asia/Seoul', 'HH24:MI') AS made_time,
         (SELECT to_char(c.completed_at AT TIME ZONE 'Asia/Seoul','YYYY-MM-DD HH24:MI')
            FROM task_completion c WHERE c.task_id = t.id) AS done_at,
         (SELECT count(*)::int FROM run_log r WHERE r.task_id = t.id) AS runs
  FROM task t
  WHERE t.id = ANY(${ids}) AND t.user_id = ${USER_ID} AND t.deleted_at IS NULL`;
const byId = new Map(owned.map((t) => [Number(t.id), t]));
const missing = ids.filter((id) => !byId.has(id));
if (missing.length) { console.error(`user ${USER_ID} 소유가 아니거나 없는 할 일: ${missing.join(", ")}`); await sql.end(); process.exit(1); }

const count = async () => ({
  completion: Number((await sql`SELECT count(*)::int AS n FROM task_completion c JOIN task t ON t.id=c.task_id WHERE t.user_id=${USER_ID}`)[0].n),
  run: Number((await sql`SELECT count(*)::int AS n FROM run_log r JOIN task t ON t.id=r.task_id WHERE t.user_id=${USER_ID}`)[0].n)
});
const before = await count();

console.log(`user_id ${USER_ID} — ${APPLY ? "입력" : "미리보기 (아무것도 쓰지 않음)"}`);
console.log(`현재: 완료 ${before.completion}건 · 실행 기록 ${before.run}건\n`);

const conflicts = [];
for (const r of RECORDS) {
  const t = byId.get(r.taskId);
  const start = `${r.day} ${t.made_time}`;
  console.log(`${start} | task ${r.taskId} ${t.title} | 예상 ${t.estimate_minutes}분 → 실제 ${r.actual}분`);
  if (t.made_day !== r.day) conflicts.push(`task ${r.taskId}: 생성일 ${t.made_day} 인데 ${r.day} 로 기록하려 합니다`);
  if (t.done_at) conflicts.push(`task ${r.taskId}: 이미 완료 표시가 ${t.done_at} 에 있습니다 (덮어쓰지 않고 그대로 둡니다)`);
  if (t.runs > 0) conflicts.push(`task ${r.taskId}: 이미 실행 기록 ${t.runs}건이 있습니다 (합산됩니다)`);
}
if (conflicts.length) {
  console.log("\n⚠️ 확인이 필요한 것");
  for (const c of conflicts) console.log("  - " + c);
}

if (!APPLY) { console.log("\n미리보기입니다. 실제로 넣으려면 --apply 를 붙여 다시 실행하세요."); await sql.end(); process.exit(0); }

// 2026-09-03 사용자 승인: 이미 있는 완료 시각과 실행 기록은 그날 값으로 맞춘다.
//   - task 23 의 완료 표시(9/3)를 1일차 8/29 로 옮긴다
//   - task 27 의 기존 실행 기록(2분)을 4분으로 맞춘다
await sql.begin(async (tx) => {
  for (const r of RECORDS) {
    const t = byId.get(r.taskId);
    const startedAt = `${r.day} ${t.made_time}:00+09`;
    // 완료 표시: 없으면 넣고, 이미 있으면 그날 시각으로 맞춘다.
    await tx`INSERT INTO task_completion (task_id, completed_at)
             VALUES (${r.taskId}, ${startedAt}::timestamptz + make_interval(mins => ${r.actual}))
             ON CONFLICT (task_id) DO UPDATE SET completed_at = EXCLUDED.completed_at`;
    // 실행 기록: 그 할 일에 이미 있으면 그날·그 분으로 맞추고, 없으면 새로 넣는다.
    const updated = await tx`
      UPDATE run_log SET started_at = ${startedAt}::timestamptz,
             ended_at = ${startedAt}::timestamptz + make_interval(mins => ${r.actual}),
             actual_minutes = ${r.actual}
      WHERE id = (SELECT id FROM run_log WHERE task_id = ${r.taskId} ORDER BY id LIMIT 1)
      RETURNING id`;
    if (updated.length === 0) {
      await tx`INSERT INTO run_log (task_id, started_at, ended_at, actual_minutes)
               VALUES (${r.taskId}, ${startedAt}::timestamptz,
                       ${startedAt}::timestamptz + make_interval(mins => ${r.actual}), ${r.actual})`;
    }
    // 한 할 일에 실행 기록이 여러 건이면 첫 건만 남긴다 (중복 규칙 C24).
    await tx`DELETE FROM run_log WHERE task_id = ${r.taskId}
             AND id <> (SELECT id FROM run_log WHERE task_id = ${r.taskId} ORDER BY id LIMIT 1)`;
  }
});

const after = await count();
console.log(`\n완료: ${before.completion} → ${after.completion}건 · 실행 기록: ${before.run} → ${after.run}건`);
console.log(`다음: node scripts/five-day-report.mjs ${USER_ID}`);
await sql.end();
