import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "플랜두씨 다이어리", description: "계획, 실행, 돌아보기를 잇는 다이어리" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // 로그인한 사람에게만 메뉴를 보인다. 다만 이것은 표시일 뿐이고,
  // 실제 차단은 각 화면의 requirePageUser 와 API 의 소유자 조건이 한다.
  const user = await getSessionUser();

  return <html lang="ko"><body>
    <header><div className="header-inner">
      <Link href="/" className="brand">플랜두씨</Link>
      {user ? <>
        <nav aria-label="주요 메뉴">
          <Link href="/">플래너</Link><Link href="/plans">계획</Link><Link href="/tasks">할 일</Link>
          <Link href="/review">돌아보기</Link><Link href="/api/export">내보내기</Link><Link href="/account">계정</Link>
        </nav>
        <form action="/api/auth/logout" method="post" className="inline">
          <span className="muted">{user.nickname}</span>
          <button type="submit" className="compact-action">로그아웃</button>
        </form>
      </> : <nav aria-label="주요 메뉴"><Link href="/login">로그인</Link><Link href="/signup">계정 만들기</Link></nav>}
    </div></header>
    <main>{children}</main>
  </body></html>;
}
