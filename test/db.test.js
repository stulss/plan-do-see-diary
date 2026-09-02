import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("DB 연결은 timestamptz를 서울 시간대로 표시한다", async () => {
  const source = await readFile(new URL("../lib/db.ts", import.meta.url), "utf8");
  assert.match(source, /connection:\s*{\s*TimeZone:\s*"Asia\/Seoul"\s*}/);
});
