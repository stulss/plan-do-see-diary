import { NextRequest } from "next/server";
import { result } from "@/lib/http";
import { destroySession } from "@/lib/session";

// 서버의 세션 행을 지운다. 브라우저에 쿠키 값이 남아 있어도 다시 통하지 않는다.
export async function POST(request: NextRequest) {
  await destroySession();
  return result(request, { signedOut: true }, "/login", 200);
}
