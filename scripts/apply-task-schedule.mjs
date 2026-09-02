import postgres from "postgres";

const connectionUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionUrl) throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");

const sql = postgres(connectionUrl, { max: 1, prepare: false, connect_timeout: 15 });
const constraintNames = ["task_start_minute_range", "task_end_minute_range", "task_schedule_pair"];

async function state() {
  const columns = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'task'
      AND column_name IN ('start_minute', 'end_minute')
    ORDER BY column_name
  `;
  const constraints = await sql`
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.task'::regclass AND conname IN ${sql(constraintNames)}
    ORDER BY conname
  `;
  const [rows] = await sql`SELECT count(*)::int AS count FROM task`;
  return { columns: columns.map((row) => row.column_name), constraints: constraints.map((row) => row.conname), rows: rows.count };
}

try {
  const before = await state();
  if (before.columns.length === 1) throw new Error("시간 컬럼이 일부만 적용되어 자동 마이그레이션을 중단합니다.");

  await sql.begin(async (transaction) => {
    await transaction`SET LOCAL lock_timeout = '10s'`;
    await transaction`SET LOCAL statement_timeout = '60s'`;

    // 기존 할 일은 NULL 일정으로 그대로 보존하고 새 일정만 분 단위로 채운다.
    if (before.columns.length === 0) {
      await transaction`ALTER TABLE task ADD COLUMN start_minute integer`;
      await transaction`ALTER TABLE task ADD COLUMN end_minute integer`;
    }
    if (!before.constraints.includes("task_start_minute_range")) {
      await transaction`ALTER TABLE task ADD CONSTRAINT task_start_minute_range CHECK (start_minute BETWEEN 0 AND 1439)`;
    }
    if (!before.constraints.includes("task_end_minute_range")) {
      await transaction`ALTER TABLE task ADD CONSTRAINT task_end_minute_range CHECK (end_minute BETWEEN 1 AND 1439)`;
    }
    if (!before.constraints.includes("task_schedule_pair")) {
      await transaction`ALTER TABLE task ADD CONSTRAINT task_schedule_pair CHECK (
        (start_minute IS NULL AND end_minute IS NULL)
        OR (start_minute IS NOT NULL AND end_minute IS NOT NULL
          AND end_minute > start_minute AND estimate_minutes = end_minute - start_minute)
      )`;
    }
  });

  const after = await state();
  const complete = after.columns.length === 2 && after.constraints.length === 3 && after.rows === before.rows;
  if (!complete) throw new Error(`시간 일정 마이그레이션 검증 실패: ${JSON.stringify({ before, after })}`);
  console.log(`TASK_SCHEDULE=${before.columns.length === 0 || before.constraints.length < 3 ? "applied" : "already_applied"}`);
  console.log(`TASK_ROWS_PRESERVED=${after.rows}`);
} finally {
  await sql.end();
}
