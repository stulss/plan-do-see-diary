import { NextRequest, NextResponse } from "next/server";
import { requestValues, result } from "@/lib/http";
import { changePassword } from "@/lib/service/auth";
import { destroyAllSessions, getSessionUser, unauthorized } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await requestValues(request);
    const outcome = await changePassword(user.id, String(body.current ?? ""), String(body.next ?? ""));
    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });

    // 바꾼 본인의 세션도 함께 끊는다. 다시 로그인해야 한다.
    await destroyAllSessions(user.id);
    return result(request, outcome.value, "/login", 200);
  } catch (error) {
    console.error("auth/password 실패", (error as Error).message);
    return NextResponse.json({ error: "바꾸지 못했습니다 — 다시 시도" }, { status: 500 });
  }
}
