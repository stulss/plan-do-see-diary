import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("비밀번호 복구는 가입 정보 전체 확인 후 모든 이전 세션을 폐기한다", async () => {
  const source = await readFile(new URL("../lib/service/auth.ts", import.meta.url), "utf8");
  assert.match(source, /findByRecovery\(normalizeLoginId\(loginId\), normalizeNickname\(nickname\), normalizeEmail\(email\)\)/);
  assert.match(source, /removeAllForUser\(user\.id\)/);
});

test("공개 경로는 시작 화면과 복구 API만 열고 자료 API는 열지 않는다", async () => {
  const source = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");
  assert.match(source, /"\/recover"/);
  assert.match(source, /"\/api\/auth\/recover-password"/);
  assert.doesNotMatch(source, /PUBLIC_PATHS[^;]*"\/api\/tasks"/s);
});
