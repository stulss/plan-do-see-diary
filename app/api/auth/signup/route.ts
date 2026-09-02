import { NextRequest, NextResponse } from "next/server";
import { requestValues, result, value } from "@/lib/http";
import { signUp } from "@/lib/service/auth";
import { createSession } from "@/lib/session";
import { publicUser } from "@/lib/dto/user";

export async function POST(request: NextRequest) {
  try {
    const body = await requestValues(request);
    // 비밀번호는 다듬지 않고 그대로 넘긴다. 앞뒤 공백을 지우면 입력한 값과 달라진다.
    const outcome = await signUp({
      loginId: value(body, "login_id", true, 20),
      nickname: value(body, "nickname", true, 20),
      email: value(body, "email", true, 200),
      password: String(body.password ?? "")
    });
    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });

    await createSession(outcome.value.id);
    return result(request, publicUser(outcome.value), "/");
  } catch (error) {
    // 요청 본문을 통째로 남기지 않는다. 비밀번호가 로그에 들어가기 때문이다.
    console.error("auth/signup 실패", (error as Error).message);
    return NextResponse.json({ error: "가입하지 못했습니다 — 다시 시도" }, { status: 500 });
  }
}
