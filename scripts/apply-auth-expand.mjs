import { readFile } from "node:fs/promises";
import postgres from "postgres";

const connectionUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionUrl) {
  throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");
}

const sql = postgres(connectionUrl, { max: 1, prepare: false, connect_timeout: 15 });
const root = new URL("../", import.meta.url);
const migrationPath = new URL("schema_auth.sql", root);

async function tableCounts() {
  // 자료 내용은 출력하지 않고, 적용 전후 행 개수만 비교해 기존 자료 보존을 확인한다.
  // 무료 트랜잭션 풀러에서 동시 쿼리가 지연됐던 과제 6 경험을 반영해 순차 조회한다.
  const plan = await sql`SELECT count(*)::int AS count FROM plan`;
  const task = await sql`SELECT count(*)::int AS count FROM task`;
  const review = await sql`SELECT count(*)::int AS count FROM review`;
  return { plan: plan[0].count, task: task[0].count, review: review[0].count };
}

async function migrationState() {
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('app_user', 'user_session')
  `;
  const columns = await sql`
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'user_id'
      AND table_name IN ('plan', 'task', 'review')
  `;
  return { authTables: tables.length, ownerColumns: columns.length };
}

try {
  const beforeState = await migrationState();
  const beforeCounts = await tableCounts();

  if (beforeState.authTables === 2 && beforeState.ownerColumns === 3) {
    console.log("AUTH_EXPAND=already_applied");
    console.log(`ROWS_PRESERVED=${JSON.stringify(beforeCounts)}`);
    process.exitCode = 0;
  } else if (beforeState.authTables !== 0 || beforeState.ownerColumns !== 0) {
    throw new Error(`인증 스키마가 부분 적용 상태입니다: ${JSON.stringify(beforeState)}`);
  } else {
    const migrationSql = await readFile(migrationPath, "utf8");
    // DDL 전체를 한 트랜잭션으로 묶어 중간 실패 시 부분 구조가 남지 않게 한다.
    await sql.begin(async (transaction) => {
      await transaction`SET LOCAL lock_timeout = '10s'`;
      await transaction`SET LOCAL statement_timeout = '60s'`;
      await transaction.unsafe(migrationSql);
    });

    const afterState = await migrationState();
    const afterCounts = await tableCounts();
    if (afterState.authTables !== 2 || afterState.ownerColumns !== 3) {
      throw new Error(`적용 후 구조 검증에 실패했습니다: ${JSON.stringify(afterState)}`);
    }
    if (JSON.stringify(beforeCounts) !== JSON.stringify(afterCounts)) {
      throw new Error(`기존 자료 행 개수가 바뀌었습니다: ${JSON.stringify({ beforeCounts, afterCounts })}`);
    }

    console.log("AUTH_EXPAND=applied");
    console.log(`ROWS_PRESERVED=${JSON.stringify(afterCounts)}`);
  }
} finally {
  await sql.end();
}
