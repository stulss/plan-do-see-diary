import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { requestValues, result, value } from "@/lib/http";
import { changeNickname } from "@/lib/service/auth";
import { destroyAllSessions, getSessionUser, unauthorized } from "@/lib/session";

// 계정과 그 계정의 자료를 한 트랜잭션에서 지운다.
// 중간에 실패하면 아무것도 지워지지 않는다. task 가 plan 을 RESTRICT 로 참조하므로 순서가 중요하다.
async function deleteAccount(userId: string) {
  await db().begin(async (tx) => {
    await tx`DELETE FROM run_log r USING task t WHERE t.id = r.task_id AND t.user_id = ${userId}`;
    await tx`DELETE FROM task_completion c USING task t WHERE t.id = c.task_id AND t.user_id = ${userId}`;
    await tx`DELETE FROM task WHERE user_id = ${userId}`;
    await tx`DELETE FROM plan WHERE user_id = ${userId}`;
    await tx`DELETE FROM review WHERE user_id = ${userId}`;
    await tx`DELETE FROM app_user WHERE id = ${userId}`;
  });
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    await deleteAccount(user.id);
    await destroyAllSessions(user.id);
    return result(request, { deleted: true }, "/login", 200);
  } catch (error) { return databaseError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (request.nextUrl.searchParams.get("_method") === "DELETE") return await DELETE(request);

    const body = await requestValues(request);
    const outcome = await changeNickname(user.id, value(body, "nickname", true, 20));
    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    return result(request, outcome.value, "/account", 200);
  } catch (error) { return databaseError(error); }
}
