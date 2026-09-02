import postgres from "postgres";

// 풀러는 기존 물리 연결을 재사용할 수 있으므로 DB 기본값 변경·검증은 가능하면 직접 연결을 쓴다.
const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");

// DB 이름은 접속 문자열에서 직접 자르지 않고 서버에 물어 SQL 식별자로 안전하게 넣는다.
const admin = postgres(url, { max: 1, prepare: false });
try {
  const [{ databaseName }] = await admin`SELECT current_database() AS "databaseName"`;
  await admin`ALTER DATABASE ${admin(databaseName)} SET timezone TO 'Asia/Seoul'`;
} finally {
  await admin.end({ timeout: 5 });
}

// 새 연결을 열어 ALTER DATABASE의 기본값이 실제로 적용됐는지 확인한다.
const verify = postgres(url, { max: 1, prepare: false });
try {
  const [{ timezone, offsetSeconds }] = await verify`
    SELECT current_setting('TimeZone') AS timezone,
           EXTRACT(timezone FROM now())::integer AS "offsetSeconds"
  `;
  if (timezone !== "Asia/Seoul" || offsetSeconds !== 32400) {
    throw new Error(`서울 시간대 적용 실패: ${timezone}, offset=${offsetSeconds}`);
  }
  console.log(`DATABASE_TIMEZONE=${timezone}`);
  console.log(`UTC_OFFSET_SECONDS=${offsetSeconds}`);
} finally {
  await verify.end({ timeout: 5 });
}
