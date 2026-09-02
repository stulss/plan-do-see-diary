import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import * as sessions from "@/lib/repository/session";
import type { SessionUser } from "@/lib/repository/session";

export { SESSION_COOKIE, SESSION_DAYS } from "@/lib/cookie";
import { SESSION_DAYS as DAYS } from "@/lib/cookie";
import { SESSION_COOKIE as COOKIE } from "@/lib/cookie";


// 쿠키에 담는 값은 의미 없는 난수다. 서명하지 않으므로 서명키가 존재하지 않는다.
// 서버 DB 에 이 값의 SHA-256 해시가 남아 있어야만 유효하다.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
  await sessions.create(hashToken(token), userId, expiresAt);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
  return expiresAt;
}

// 사용자를 알아내는 유일한 경로다.
// 주소·헤더·요청 본문에서 사용자 ID 를 읽는 코드는 이 프로젝트에 존재하지 않는다.
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return await sessions.findValidUser(hashToken(token));
}

// 로그아웃은 DB 행을 지우는 것이다. 브라우저에 값이 남아 있어도 다시 통하지 않는다.
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sessions.removeOne(hashToken(token));
  jar.delete(COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await sessions.removeAllForUser(userId);
  (await cookies()).delete(COOKIE);
}

// 화면용. 로그인하지 않았으면 자료 대신 로그인 화면이 나온다.
export async function requirePageUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

// API 용. 라우트는 이 응답을 그대로 돌려준다.
export function unauthorized() {
  return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
}

export function notFound(message = "찾지 못했습니다.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export type { SessionUser };
