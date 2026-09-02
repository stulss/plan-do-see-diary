import postgres from "postgres";

const connectionUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionUrl) throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");
const sql = postgres(connectionUrl, { max: 1, prepare: false, connect_timeout: 15 });

try {
  const [before] = await sql`SELECT count(*)::int AS count FROM task`;
  const [column] = await sql`SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='task' AND column_name='start_date'`;
  const [dueColumn] = await sql`SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='task' AND column_name='due_date'`;
  const [constraint] = await sql`SELECT 1 FROM pg_constraint WHERE conrelid='public.task'::regclass AND conname='task_date_range'`;
  const [planColumn] = await sql`SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='task' AND column_name='plan_id'`;
  await sql.begin(async (tx) => {
    await tx`SET LOCAL lock_timeout='10s'`;
    await tx`SET LOCAL statement_timeout='60s'`;
    if (!column) {
      await tx`ALTER TABLE task ADD COLUMN start_date date`;
      await tx`UPDATE task SET start_date=due_date WHERE start_date IS NULL`;
      await tx`ALTER TABLE task ALTER COLUMN start_date SET NOT NULL`;
    }
    if (dueColumn?.is_nullable === "YES") await tx`ALTER TABLE task ALTER COLUMN due_date SET NOT NULL`;
    if (!constraint) await tx`ALTER TABLE task ADD CONSTRAINT task_date_range CHECK (start_date <= due_date)`;
    if (planColumn?.is_nullable === "NO") await tx`ALTER TABLE task ALTER COLUMN plan_id DROP NOT NULL`;
  });
  const [after] = await sql`SELECT count(*)::int AS count, count(*) FILTER (WHERE start_date IS NULL)::int AS missing_start FROM task`;
  if (after.count !== before.count || after.missing_start !== 0) throw new Error("할 일 날짜 범위 마이그레이션 검증에 실패했습니다.");
  console.log(`TASK_DATE_RANGE=${column && constraint && planColumn?.is_nullable === "YES" && dueColumn?.is_nullable === "NO" ? "already_applied" : "applied"}`);
  console.log(`TASK_ROWS_PRESERVED=${after.count}`);
} finally { await sql.end(); }
