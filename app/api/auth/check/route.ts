import { NextRequest, NextResponse } from "next/server";
import { requestValues, value } from "@/lib/http";
import { availability } from "@/lib/service/auth";

// 아이디·닉네임의 사용 가능 여부만 돌려준다. 다른 정보는 함께 내보내지 않는다.
// 이메일은 이 경로로 확인해 주지 않는다. 누가 가입했는지 캐낼 수 있기 때문이다.
export async function POST(request: NextRequest) {
  try {
    const body = await requestValues(request);
    const outcome = await availability(value(body, "field"), value(body, "value", true, 100));
    return outcome.ok
      ? NextResponse.json(outcome.value)
      : NextResponse.json({ error: outcome.error }, { status: outcome.status });
  } catch (error) {
    console.error("auth/check 실패", (error as Error).message);
    return NextResponse.json({ error: "확인하지 못했습니다 — 다시 시도" }, { status: 500 });
  }
}
