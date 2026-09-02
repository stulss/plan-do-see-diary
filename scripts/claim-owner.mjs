import postgres from "postgres";

const connectionUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionUrl) {
  throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");
}

const sql = postgres(connectionUrl, { max: 1, prepare: false, connect_timeout: 15 });

async function ownerColumnState() {
  return sql`
    SELECT table_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('plan', 'task', 'review')
      AND column_name = 'user_id'
    ORDER BY table_name
  `;
}

async function dataState(ownerId) {
  // 내용이나 계정 정보는 출력하지 않고 소유권 검증에 필요한 행 개수만 센다.
  const plan = await sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE user_id = ${ownerId})::int AS owned, count(*) FILTER (WHERE user_id IS NULL)::int AS unowned FROM plan`;
  const task = await sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE user_id = ${ownerId})::int AS owned, count(*) FILTER (WHERE user_id IS NULL)::int AS unowned FROM task`;
  const review = await sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE user_id = ${ownerId})::int AS owned, count(*) FILTER (WHERE user_id IS NULL)::int AS unowned FROM review`;
  return { plan: plan[0], task: task[0], review: review[0] };
}

try {
  const users = await sql`SELECT id FROM app_user ORDER BY id`;
  if (users.length !== 1) {
    throw new Error(`소유자 지정 전 계정이 정확히 1개여야 합니다. 현재 계정 수: ${users.length}`);
  }
  const ownerId = Number(users[0].id);
  if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
    throw new Error("소유자 계정 ID가 올바르지 않습니다.");
  }

  const beforeColumns = await ownerColumnState();
  if (beforeColumns.length !== 3) {
    throw new Error("NULL 허용 소유자 컬럼 3개가 먼저 적용되어야 합니다.");
  }

  await sql.begin(async (transaction) => {
    await transaction`SET LOCAL lock_timeout = '10s'`;
    await transaction`SET LOCAL statement_timeout = '60s'`;

    // 과제 6의 기존 자료만 소유자 계정으로 옮기고 이미 귀속된 자료는 건드리지 않는다.
    await transaction`UPDATE plan SET user_id = ${ownerId} WHERE user_id IS NULL`;
    await transaction`UPDATE task SET user_id = ${ownerId} WHERE user_id IS NULL`;
    await transaction`UPDATE review SET user_id = ${ownerId} WHERE user_id IS NULL`;

    // 인증판 배포 전 구버전 INSERT를 보호하는 임시 장치다. 배포 직후 별도 단계에서 제거한다.
    await transaction.unsafe(`ALTER TABLE plan ALTER COLUMN user_id SET DEFAULT ${ownerId}`);
    await transaction.unsafe(`ALTER TABLE task ALTER COLUMN user_id SET DEFAULT ${ownerId}`);
    await transaction.unsafe(`ALTER TABLE review ALTER COLUMN user_id SET DEFAULT ${ownerId}`);
    await transaction`ALTER TABLE plan ALTER COLUMN user_id SET NOT NULL`;
    await transaction`ALTER TABLE task ALTER COLUMN user_id SET NOT NULL`;
    await transaction`ALTER TABLE review ALTER COLUMN user_id SET NOT NULL`;
  });

  const afterColumns = await ownerColumnState();
  const afterData = await dataState(ownerId);
  const columnsLocked = afterColumns.every((column) => column.is_nullable === "NO" && column.column_default !== null);
  const dataOwned = Object.values(afterData).every((row) => row.unowned === 0 && row.total === row.owned);
  if (!columnsLocked || !dataOwned) {
    throw new Error(`소유권 적용 검증에 실패했습니다: ${JSON.stringify({ columnsLocked, afterData })}`);
  }

  console.log("OWNER_CLAIM=applied");
  console.log(`OWNED_ROWS=${JSON.stringify(afterData)}`);
} finally {
  await sql.end();
}
