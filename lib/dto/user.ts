import type { UserRow } from "@/lib/repository/user";

// 응답에 나갈 필드를 화이트리스트로 고정한다.
// DB 행을 그대로 반환하면 나중에 추가되는 컬럼이 자동으로 응답에 실려 나간다.
export const publicUser = (row: { id: string; nickname: string }) => ({
  id: row.id,
  nickname: row.nickname
});

// 본인 계정 화면 전용. password_hash 는 어떤 경우에도 포함하지 않는다.
export const me = (row: Pick<UserRow, "id" | "login_id" | "nickname" | "email"> & { created_at?: Date }) => ({
  id: row.id,
  login_id: row.login_id,
  nickname: row.nickname,
  email: row.email,
  created_at: row.created_at
});
