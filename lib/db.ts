import postgres, { Sql } from "postgres";

let client: Sql | undefined;

export function db(): Sql {
  // 직접 만든 DB는 DATABASE_URL, Vercel Marketplace DB는 POSTGRES_URL을 제공한다.
  // 둘 다 서버 전용 변수이며 브라우저에 노출되는 NEXT_PUBLIC_*은 사용하지 않는다.
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");
  // 서버 프로세스 안에서 연결 풀을 한 번만 만들어 요청마다 새 연결을 만들지 않는다.
  // 이 파일은 서버 코드에서만 import하며 접속 문자열을 브라우저로 전달하지 않는다.
  // Supabase/Vercel의 트랜잭션 풀러는 연결마다 prepared statement를 보존하지 않는다.
  // prepare를 끄면 다른 물리 연결로 바뀌어도 같은 SQL을 안전하게 실행할 수 있다.
  client ??= postgres(url, {
    max: 5,
    prepare: false,
    // timestamptz는 실제 순간을 UTC 기준으로 보존하고, DB가 반환하는 표기만 서울(+09:00)로 통일한다.
    connection: { TimeZone: "Asia/Seoul" }
  });
  return client;
}

export function databaseError(error: unknown): Response {
  console.error(error);
  return Response.json({ error: "저장하지 못했습니다 — 다시 시도" }, { status: 500 });
}
