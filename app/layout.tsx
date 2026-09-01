import Link from "next/link";
import "./globals.css";

export const metadata = { title: "플랜두씨 다이어리", description: "계획, 실행, 돌아보기를 잇는 다이어리" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>
    <header><div className="header-inner"><Link href="/" className="brand">플랜두씨</Link><nav aria-label="주요 메뉴">
      <Link href="/">플래너</Link><Link href="/plans">계획</Link><Link href="/tasks">할 일</Link><Link href="/review">돌아보기</Link><Link href="/api/export">내보내기</Link>
    </nav></div></header>
    <main>{children}</main>
  </body></html>;
}
