import postgres from "postgres";

const connectionUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionUrl) throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");

const sql = postgres(connectionUrl, { max: 1, prepare: false, connect_timeout: 15 });

async function columnState() {
  return sql`
    SELECT table_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('plan', 'task', 'review')
      AND column_name = 'user_id'
    ORDER BY table_name
  `;
}

try {
  const before = await columnState();
  if (before.length !== 3 || before.some((column) => column.is_nullable !== "NO")) {
    throw new Error("소유자 컬럼 3개가 모두 NOT NULL인 상태에서만 기본값을 제거할 수 있습니다.");
  }

  const defaults = before.filter((column) => column.column_default !== null).length;
  if (defaults !== 0 && defaults !== 3) {
    throw new Error("소유자 기본값이 일부 표에만 남아 있어 자동 처리를 중단합니다.");
  }

  if (defaults === 3) {
    await sql.begin(async (transaction) => {
      await transaction`SET LOCAL lock_timeout = '10s'`;
      await transaction`SET LOCAL statement_timeout = '60s'`;
      // 인증판 배포 뒤에는 user_id를 빠뜨린 INSERT가 조용히 소유자에게 붙지 않게 한다.
      await transaction`ALTER TABLE plan ALTER COLUMN user_id DROP DEFAULT`;
      await transaction`ALTER TABLE task ALTER COLUMN user_id DROP DEFAULT`;
      await transaction`ALTER TABLE review ALTER COLUMN user_id DROP DEFAULT`;
    });
  }

  const after = await columnState();
  if (after.length !== 3 || after.some((column) => column.is_nullable !== "NO" || column.column_default !== null)) {
    throw new Error("소유자 기본값 제거 뒤 검증에 실패했습니다.");
  }

  console.log(`OWNER_DEFAULTS=${defaults === 3 ? "removed" : "already_removed"}`);
  console.log("OWNER_COLUMNS=not_null_without_default");
} finally {
  await sql.end();
}
