import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import postgres from "postgres";

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
const connectionUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionUrl) throw new Error("DATABASE_URL 또는 POSTGRES_URL이 설정되지 않았습니다.");

const sql = postgres(connectionUrl, { max: 1, prepare: false, connect_timeout: 15 });
const suffix = randomBytes(3).toString("hex");
const sharedPassword = `Verify-${randomBytes(10).toString("base64url")}!Aa1`;
const changedPassword = `Changed-${randomBytes(10).toString("base64url")}!Aa1`;
const accounts = [
  { alias: "owner-test", login_id: `verifya_${suffix}`, nickname: `검증A${suffix}`, email: `verifya_${suffix}@example.invalid` },
  { alias: "other-test", login_id: `verifyb_${suffix}`, nickname: `검증B${suffix}`, email: `verifyb_${suffix}@example.invalid` },
];
const createdUserIds = [];

function cookieFrom(response) {
  // 쿠키 원문은 메모리에만 두며 로그·결과 파일에는 절대 넣지 않는다.
  const value = response.headers.get("set-cookie")?.split(";", 1)[0];
  if (!value) throw new Error("응답에서 세션 쿠키를 받지 못했습니다.");
  return value;
}

async function request(path, { method = "GET", cookie, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    redirect: "manual",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  return { response, data };
}

function expectStatus(label, result, expected) {
  if (result.response.status !== expected) {
    throw new Error(`${label}: HTTP ${expected} 예상, 실제 ${result.response.status}`);
  }
}

async function signUp(account) {
  const result = await request("/api/auth/signup", {
    method: "POST",
    body: { ...account, password: sharedPassword },
  });
  expectStatus(`${account.alias} 가입`, result, 201);
  createdUserIds.push(Number(result.data.id));
  return { ...account, id: Number(result.data.id), cookie: cookieFrom(result.response) };
}

async function createFixture(account) {
  const plan = await request("/api/plans", {
    method: "POST",
    cookie: account.cookie,
    body: {
      title: `__AUTH_VERIFY_PLAN_${account.alias}__`,
      start_date: "2026-09-02",
      end_date: "2026-09-02",
      priority: 2,
      success_criteria: "인증 격리 자동 검증 후 삭제",
      estimate_minutes: 1,
    },
  });
  expectStatus(`${account.alias} 계획 생성`, plan, 201);

  const task = await request("/api/tasks", {
    method: "POST",
    cookie: account.cookie,
    body: {
      plan_id: plan.data.id,
      title: `__AUTH_VERIFY_TASK_${account.alias}__`,
      note: "인증 격리 자동 검증 후 삭제",
      due_date: "2026-09-02",
      priority: 2,
      tags: "auth-verify",
      estimate_minutes: 1,
    },
  });
  expectStatus(`${account.alias} 할 일 생성`, task, 201);
  return { planId: Number(plan.data.id), taskId: Number(task.data.id) };
}

async function crossChecks(actor, target, fixture) {
  const [beforeCount] = await sql`SELECT count(*)::int AS count FROM task WHERE user_id = ${target.id}`;
  const before = await sql`
    SELECT title, deleted_at FROM task WHERE id = ${fixture.taskId} AND user_id = ${target.id}
  `;
  if (!before[0]) throw new Error("교차 검증 대상 자료를 찾지 못했습니다.");

  const read = await request(`/api/tasks/${fixture.taskId}`, { cookie: actor.cookie });
  const update = await request(`/api/tasks/${fixture.taskId}`, {
    method: "PATCH",
    cookie: actor.cookie,
    body: {
      title: "__UNAUTHORIZED_CHANGE__",
      note: "거절되어야 함",
      due_date: "2026-09-02",
      priority: 3,
      tags: "blocked",
      estimate_minutes: 999,
      user_id: actor.id,
      owner: actor.id,
    },
  });
  const remove = await request(`/api/tasks/${fixture.taskId}`, { method: "DELETE", cookie: actor.cookie });
  for (const [label, result] of [["읽기", read], ["수정", update], ["삭제", remove]]) {
    expectStatus(`${actor.alias}→${target.alias} ${label}`, result, 404);
  }

  const after = await sql`
    SELECT title, deleted_at FROM task WHERE id = ${fixture.taskId} AND user_id = ${target.id}
  `;
  const [afterCount] = await sql`SELECT count(*)::int AS count FROM task WHERE user_id = ${target.id}`;
  const unchanged = after.length === 1 && beforeCount.count === afterCount.count
    && after[0].title === before[0].title && String(after[0].deleted_at) === String(before[0].deleted_at);
  if (!unchanged) throw new Error("거절된 요청이 상대 자료를 변경했습니다.");

  const list = await request(`/api/tasks?user_id=${target.id}&owner=${target.id}`, { cookie: actor.cookie });
  expectStatus(`${actor.alias} 목록`, list, 200);
  const ids = list.data.map((row) => Number(row.id));
  if (ids.includes(fixture.taskId) || ids.length !== 1) {
    throw new Error("목록 응답에 다른 사용자의 자료가 섞였습니다.");
  }

  return {
    direction: `${actor.alias} → ${target.alias}`,
    read: read.response.status,
    update: update.response.status,
    delete: remove.response.status,
    target_unchanged: unchanged,
    target_rows_before: beforeCount.count,
    target_rows_after: afterCount.count,
    leaked_rows: 0,
    supplied_user_fields_ignored: true,
  };
}

try {
  const unauthenticated = await request("/api/tasks");
  expectStatus("미로그인 목록", unauthenticated, 401);

  const first = await signUp(accounts[0]);
  const duplicate = await request("/api/auth/signup", {
    method: "POST",
    body: { ...accounts[0], password: sharedPassword },
  });
  expectStatus("중복 가입", duplicate, 409);
  const second = await signUp(accounts[1]);

  const passwordRows = await sql`
    SELECT password_hash FROM app_user WHERE id IN (${first.id}, ${second.id}) ORDER BY id
  `;
  const hashesSafe = passwordRows.length === 2 && passwordRows.every((row) => /^\$2[aby]\$12\$/.test(row.password_hash));
  const hashesDiffer = hashesSafe && passwordRows[0].password_hash !== passwordRows[1].password_hash;
  if (!hashesDiffer) throw new Error("같은 비밀번호의 bcrypt 저장값 분리 검증에 실패했습니다.");

  const firstFixture = await createFixture(first);
  const secondFixture = await createFixture(second);
  const directions = [
    await crossChecks(first, second, secondFixture),
    await crossChecks(second, first, firstFixture),
  ];

  const wrongPassword = await request("/api/auth/login", {
    method: "POST",
    body: { login_id: first.login_id, password: `${sharedPassword}wrong` },
  });
  const missingAccount = await request("/api/auth/login", {
    method: "POST",
    body: { login_id: `missing_${suffix}`, password: sharedPassword },
  });
  expectStatus("틀린 비밀번호", wrongPassword, 401);
  expectStatus("없는 아이디", missingAccount, 401);
  const sameLoginFailure = wrongPassword.data?.error === missingAccount.data?.error;
  if (!sameLoginFailure) throw new Error("로그인 실패 문구가 서로 다릅니다.");

  const savedCookie = first.cookie;
  const beforeLogout = await request("/api/tasks", { cookie: savedCookie });
  expectStatus("로그아웃 전 요청", beforeLogout, 200);
  const logout = await request("/api/auth/logout", { method: "POST", cookie: savedCookie, body: {} });
  expectStatus("로그아웃", logout, 200);
  const afterLogout = await request("/api/tasks", { cookie: savedCookie });
  expectStatus("로그아웃 뒤 같은 세션 재사용", afterLogout, 401);

  const passwordChange = await request("/api/auth/password", {
    method: "POST",
    cookie: second.cookie,
    body: { current: sharedPassword, next: changedPassword },
  });
  expectStatus("비밀번호 변경", passwordChange, 200);
  const afterPasswordChange = await request("/api/tasks", { cookie: second.cookie });
  expectStatus("비밀번호 변경 뒤 이전 세션 재사용", afterPasswordChange, 401);
  const oldPasswordLogin = await request("/api/auth/login", {
    method: "POST",
    body: { login_id: second.login_id, password: sharedPassword },
  });
  expectStatus("변경 전 비밀번호 로그인", oldPasswordLogin, 401);
  const newPasswordLogin = await request("/api/auth/login", {
    method: "POST",
    body: { login_id: second.login_id, password: changedPassword },
  });
  expectStatus("변경한 비밀번호 로그인", newPasswordLogin, 200);

  const evidence = {
    verified_at: new Date().toISOString(),
    base_url: baseUrl,
    credentials_recorded: false,
    session_values_recorded: false,
    checks: {
      unauthenticated_api: { method: "GET", path: "/api/tasks", status: 401 },
      signup: { accounts: 2, status: 201 },
      duplicate_signup: { method: "POST", path: "/api/auth/signup", status: 409 },
      bcrypt: { cost: 12, hashes_have_bcrypt_shape: hashesSafe, same_password_hashes_differ: hashesDiffer },
      login_failure_message_same: sameLoginFailure,
      isolation: directions,
      session_revocation: {
        logout: { method: "GET", path: "/api/tasks", before: 200, old_session_after: 401 },
        password_change: { status: 200, old_session_after: 401, old_password_login: 401, new_password_login: 200 },
      },
    },
  };

  const evidenceDir = new URL("../docs/과제7/evidence/", import.meta.url);
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(new URL("auth-isolation-results.json", evidenceDir), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log("AUTH_ISOLATION=passed");
  console.log("CHECKS=unauthenticated,signup,duplicate,bcrypt,login-message,cross-user,list,logout-reuse,password-change");
} finally {
  // 성공·실패와 관계없이 일회성 계정과 연결 자료를 모두 지운다.
  if (createdUserIds.length) {
    await sql`DELETE FROM app_user WHERE id IN ${sql(createdUserIds)}`;
    const [cleanup] = await sql`SELECT count(*)::int AS remaining FROM app_user WHERE id IN ${sql(createdUserIds)}`;
    if (cleanup.remaining !== 0) throw new Error("일회성 검증 계정 정리에 실패했습니다.");
  }
  await sql.end();
}
