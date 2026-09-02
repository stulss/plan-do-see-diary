import { NextRequest, NextResponse } from "next/server";
import { requestValues, result, value } from "@/lib/http";
import { signIn } from "@/lib/service/auth";
import { createSession } from "@/lib/session";
import { publicUser } from "@/lib/dto/user";

export async function POST(request: NextRequest) {
  try {
    const body = await requestValues(request);
    const outcome = await signIn(value(body, "login_id", true, 20), String(body.password ?? ""));
    // 아이디가 없을 때와 비밀번호만 틀렸을 때의 문구와 상태코드가 완전히 같다 (T07-C99).
    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });

    await createSession(outcome.value.id);
    return result(request, publicUser(outcome.value), "/", 200);
  } catch (error) {
    console.error("auth/login 실패", (error as Error).message);
    return NextResponse.json({ error: "로그인하지 못했습니다 — 다시 시도" }, { status: 500 });
  }
}
