import { db } from "@/lib/db";

// 이 표에는 쿠키 원문이 아니라 그 값의 SHA-256 해시만 들어간다.
// 로그아웃은 행을 지우는 것이며, 그래서 이전 쿠키 값이 곧바로 무효가 된다.
export interface SessionUser {
  id: string;
  login_id: string;
  nickname: string;
  email: string;
}

export async function create(tokenHash: string, userId: string, expiresAt: Date) {
  await db()`INSERT INTO user_session (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`;
}

// 만료 확인을 SQL 안에서 한다. 애플리케이션이 시각 비교를 빠뜨릴 자리를 없앤다.
export async function findValidUser(tokenHash: string) {
  const rows = await db()<SessionUser[]>`
    SELECT u.id, u.login_id, u.nickname, u.email
    FROM user_session s JOIN app_user u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash} AND s.expires_at > now()
    LIMIT 1`;
  return rows[0] ?? null;
}

export async function removeOne(tokenHash: string) {
  await db()`DELETE FROM user_session WHERE token_hash = ${tokenHash}`;
}

// 비밀번호를 바꾸면 그 사람의 세션을 전부 끊는다 (T07-C114).
export async function removeAllForUser(userId: string) {
  await db()`DELETE FROM user_session WHERE user_id = ${userId}`;
}

export async function removeExpired() {
  await db()`DELETE FROM user_session WHERE expires_at <= now()`;
}
