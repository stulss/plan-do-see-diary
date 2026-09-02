import { compare, hash } from "bcryptjs";
import * as users from "@/lib/repository/user";
import * as sessions from "@/lib/repository/session";
import {
  checkEmail, checkLoginId, checkNickname, checkPassword,
  normalizeEmail, normalizeLoginId, normalizeNickname
} from "@/lib/domain/rules";

export const BCRYPT_COST = 12;

// 로그인 실패는 아이디가 없을 때와 비밀번호만 틀렸을 때가 완전히 같아야 한다 (T07-C99).
export const LOGIN_FAILED = "아이디 또는 비밀번호가 올바르지 않습니다.";

// 계정이 없을 때도 비교를 한 번 돌려 응답 시간으로 계정 존재 여부가 새지 않게 한다.
// 이 값은 비밀이 아니다. 아무 문자열의 bcrypt 해시이며 어떤 계정과도 연결되지 않는다.
const DUMMY_HASH = "$2b$12$LkaNGVMQ.CnRYTuLyPZsMuTZwNvO1MLqeN75t4pO0OBx0RPI1E3va";

export type Fail = { ok: false; status: number; error: string };
export type Ok<T> = { ok: true; value: T };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

function duplicateMessage(error: unknown): string | null {
  const constraint = (error as { constraint_name?: string })?.constraint_name;
  if ((error as { code?: string })?.code !== "23505") return null;
  if (constraint === "app_user_login_id_key") return "이미 사용 중인 아이디입니다.";
  if (constraint === "app_user_nickname_key") return "이미 사용 중인 닉네임입니다.";
  if (constraint === "app_user_email_key") return "이미 가입된 이메일입니다.";
  return "이미 사용 중인 값입니다.";
}

export async function signUp(input: { loginId: string; nickname: string; email: string; password: string }) {
  const problem =
    checkLoginId(input.loginId) ?? checkNickname(input.nickname) ??
    checkEmail(input.email) ?? checkPassword(input.password);
  if (problem) return fail(400, problem);

  try {
    // 화면의 중복확인은 편의일 뿐이다. 실제로 막는 것은 DB 유니크 인덱스이며,
    // 확인과 제출 사이에 남이 먼저 가입한 경우도 여기서 걸린다.
    const user = await users.insert({
      loginId: normalizeLoginId(input.loginId),
      nickname: normalizeNickname(input.nickname),
      email: normalizeEmail(input.email),
      passwordHash: await hash(input.password, BCRYPT_COST)
    });
    return { ok: true as const, value: user };
  } catch (error) {
    const duplicate = duplicateMessage(error);
    if (duplicate) return fail(409, duplicate);
    throw error;
  }
}

export async function signIn(loginId: string, password: string) {
  const user = await users.findByLoginId(normalizeLoginId(loginId ?? ""));
  const matched = await compare(password ?? "", user?.password_hash ?? DUMMY_HASH);
  if (!user || !matched) return fail(401, LOGIN_FAILED);
  return { ok: true as const, value: user };
}

// 아이디와 닉네임만 확인해 준다. 이메일까지 열어 주면 누가 가입했는지 캐낼 수 있다.
export async function availability(field: string, value: string) {
  if (field === "login_id") {
    const problem = checkLoginId(value);
    if (problem) return { ok: true as const, value: { available: false, reason: problem } };
    return { ok: true as const, value: { available: !(await users.loginIdTaken(normalizeLoginId(value))) } };
  }
  if (field === "nickname") {
    const problem = checkNickname(value);
    if (problem) return { ok: true as const, value: { available: false, reason: problem } };
    return { ok: true as const, value: { available: !(await users.nicknameTaken(normalizeNickname(value))) } };
  }
  return fail(400, "확인할 수 없는 항목입니다.");
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await users.findById(userId);
  if (!user) return fail(401, LOGIN_FAILED);
  if (!(await compare(current ?? "", user.password_hash))) return fail(401, LOGIN_FAILED);
  const problem = checkPassword(next);
  if (problem) return fail(400, problem);

  await users.updatePasswordHash(userId, await hash(next, BCRYPT_COST));
  // 비밀번호를 바꾸면 이전에 발급한 세션이 전부 무효가 된다 (T07-C114).
  await sessions.removeAllForUser(userId);
  return { ok: true as const, value: { changed: true } };
}

export async function changeNickname(userId: string, nickname: string) {
  const problem = checkNickname(nickname);
  if (problem) return fail(400, problem);
  try {
    await users.updateNickname(userId, normalizeNickname(nickname));
    return { ok: true as const, value: { nickname: normalizeNickname(nickname) } };
  } catch (error) {
    const duplicate = duplicateMessage(error);
    if (duplicate) return fail(409, duplicate);
    throw error;
  }
}

export async function recoverLoginId(nickname: string, email: string) {
  const problem = checkNickname(nickname) ?? checkEmail(email);
  if (problem) return fail(400, problem);
  const user = await users.findByRecovery(null, normalizeNickname(nickname), normalizeEmail(email));
  return user ? { ok: true as const, value: { login_id: user.login_id } } : fail(404, "일치하는 계정을 찾지 못했습니다.");
}

export async function recoverPassword(loginId: string, nickname: string, email: string, next: string) {
  const problem = checkLoginId(loginId) ?? checkNickname(nickname) ?? checkEmail(email) ?? checkPassword(next);
  if (problem) return fail(400, problem);
  const passwordHash = await hash(next, BCRYPT_COST);
  const user = await users.findByRecovery(normalizeLoginId(loginId), normalizeNickname(nickname), normalizeEmail(email));
  if (!user) return fail(404, "입력한 정보와 일치하는 계정을 찾지 못했습니다.");
  await users.updatePasswordHash(user.id, passwordHash);
  await sessions.removeAllForUser(user.id);
  return { ok: true as const, value: { changed: true } };
}
