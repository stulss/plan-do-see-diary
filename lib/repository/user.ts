import { db } from "@/lib/db";

// Repository 계층은 SQL 만 안다. 쿠키·요청·응답을 모르므로 검사에서 그대로 부를 수 있다.
export interface UserRow {
  id: string;
  login_id: string;
  nickname: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export async function findByLoginId(loginId: string) {
  const rows = await db()<UserRow[]>`SELECT * FROM app_user WHERE lower(login_id) = lower(${loginId}) LIMIT 1`;
  return rows[0] ?? null;
}

export async function findById(id: string) {
  const rows = await db()<UserRow[]>`SELECT * FROM app_user WHERE id = ${id} LIMIT 1`;
  return rows[0] ?? null;
}

export async function findByRecovery(loginId: string | null, nickname: string, email: string) {
  const rows = loginId
    ? await db()<UserRow[]>`SELECT * FROM app_user WHERE lower(login_id)=lower(${loginId}) AND nickname=${nickname} AND lower(email)=lower(${email}) LIMIT 1`
    : await db()<UserRow[]>`SELECT * FROM app_user WHERE nickname=${nickname} AND lower(email)=lower(${email}) LIMIT 1`;
  return rows[0] ?? null;
}

// 중복확인 응답은 사용 가능 여부만 돌려준다. 다른 정보를 함께 내보내지 않는다.
export async function loginIdTaken(loginId: string) {
  const rows = await db()`SELECT 1 FROM app_user WHERE lower(login_id) = lower(${loginId}) LIMIT 1`;
  return rows.length > 0;
}

export async function nicknameTaken(nickname: string) {
  const rows = await db()`SELECT 1 FROM app_user WHERE lower(nickname) = lower(${nickname}) LIMIT 1`;
  return rows.length > 0;
}

export async function insert(input: { loginId: string; nickname: string; email: string; passwordHash: string }) {
  const rows = await db()<UserRow[]>`
    INSERT INTO app_user (login_id, nickname, email, password_hash)
    VALUES (${input.loginId}, ${input.nickname}, ${input.email}, ${input.passwordHash})
    RETURNING *`;
  return rows[0];
}

export async function updatePasswordHash(userId: string, passwordHash: string) {
  await db()`UPDATE app_user SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${userId}`;
}

export async function updateNickname(userId: string, nickname: string) {
  await db()`UPDATE app_user SET nickname = ${nickname}, updated_at = now() WHERE id = ${userId}`;
}

export async function removeUser(userId: string) {
  await db()`DELETE FROM app_user WHERE id = ${userId}`;
}
