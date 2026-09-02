import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/cookie";

// 1차 관문일 뿐이다. 쿠키가 있는지만 본다.
// 보안 판단은 여기서 하지 않는다. 실제 차단은 각 라우트의 requireUser 와 SQL 의 소유자 조건이 한다.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/recover", "/api/auth/login", "/api/auth/signup", "/api/auth/check", "/api/auth/recover-id", "/api/auth/recover-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname === path || (path !== "/" && pathname.startsWith(path + "/")))) {
    return NextResponse.next();
  }
  if (request.cookies.get(SESSION_COOKIE)) return NextResponse.next();

  // API 는 리다이렉트가 아니라 거절 응답을 돌려준다.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
