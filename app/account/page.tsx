import { requirePageUser } from "@/lib/session";

export default async function AccountPage() {
  const user = await requirePageUser();

  return <section className="card">
    <p className="eyebrow">계정</p>
    <h1>{user.nickname}</h1>
    <p className="page-lead">아이디 {user.login_id} · {user.email}</p>

    <h2>닉네임 바꾸기</h2>
    <form className="editor-form" action="/api/account" method="post">
      <label>새 닉네임
        <input name="nickname" required maxLength={20} defaultValue={user.nickname} />
      </label>
      <div className="editor-actions"><button type="submit">바꾸기</button></div>
    </form>

    <h2>비밀번호 바꾸기</h2>
    <p className="muted">10자 이상이며 대문자·소문자·숫자·특수문자를 각각 1자 이상 포함해야 합니다.</p>
    <form className="editor-form" action="/api/auth/password" method="post">
      <label>지금 비밀번호
        <input name="current" type="password" autoComplete="current-password" required maxLength={128} />
      </label>
      <label>새 비밀번호
        <input name="next" type="password" autoComplete="new-password" required maxLength={128} />
      </label>
      <p className="muted">바꾸면 지금까지 로그인해 둔 모든 기기에서 로그아웃됩니다.</p>
      <div className="editor-actions"><button type="submit">바꾸기</button></div>
    </form>

    <h2>내 자료 내보내기</h2>
    <p className="muted">내 계정의 계획·할 일·실행 기록·돌아보기를 파일 하나로 받습니다.</p>
    <p><a href="/api/export">내보내기</a></p>

    <div className="danger-zone">
      <h2>계정 삭제</h2>
      <p className="muted">
        계정을 지우면 <strong>내 계획·할 일·실행 기록·돌아보기가 모두 함께 지워집니다.</strong>
        되돌릴 수 없습니다. 필요하면 먼저 내보내기로 받아 두세요.
      </p>
      <form action="/api/account?_method=DELETE" method="post">
        <button type="submit" className="danger">계정과 모든 자료 삭제</button>
      </form>
    </div>
  </section>;
}
