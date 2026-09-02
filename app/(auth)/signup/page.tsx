"use client";

import Link from "next/link";
import { useState } from "react";
import { passwordChecklist } from "@/lib/domain/rules";

type Availability = { text: string; ok: boolean } | null;

export default function SignupPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [loginIdState, setLoginIdState] = useState<Availability>(null);
  const [nicknameState, setNicknameState] = useState<Availability>(null);
  const rules = passwordChecklist(password);

  // 화면의 중복확인은 편의다. 실제로 막는 것은 DB 유니크 인덱스이며,
  // 확인과 제출 사이에 남이 먼저 가입한 경우는 서버가 409 로 걸러 준다.
  async function check(field: "login_id" | "nickname", value: string, set: (state: Availability) => void) {
    if (!value) return set(null);
    const response = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ field, value })
    });
    const data = await response.json().catch(() => null);
    if (!data) return set(null);
    if (data.reason) return set({ text: data.reason, ok: false });
    set(data.available ? { text: "사용할 수 있습니다.", ok: true } : { text: "이미 사용 중입니다.", ok: false });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        login_id: form.get("login_id"), nickname: form.get("nickname"),
        email: form.get("email"), password: form.get("password")
      })
    });
    if (response.ok) {
      window.location.href = "/";
      return;
    }
    const data = await response.json().catch(() => ({ error: "가입하지 못했습니다." }));
    setError(data.error ?? "가입하지 못했습니다.");
    setBusy(false);
  }

  const mark = (state: Availability) =>
    state ? <span className={state.ok ? "badge" : "error"}>{state.text}</span> : null;

  return <section className="card">
    <p className="eyebrow">플랜두씨 다이어리</p>
    <h1>계정 만들기</h1>
    <p className="page-lead">아이디와 닉네임은 다른 사람과 겹칠 수 없습니다.</p>

    <form className="editor-form" onSubmit={submit}>
      <label>아이디
        <input name="login_id" autoComplete="username" required maxLength={20}
          onBlur={(event) => check("login_id", event.target.value, setLoginIdState)} />
      </label>
      {mark(loginIdState)}

      <label>닉네임
        <input name="nickname" required maxLength={20}
          onBlur={(event) => check("nickname", event.target.value, setNicknameState)} />
      </label>
      {mark(nicknameState)}

      <label>이메일
        <input name="email" type="email" autoComplete="email" required maxLength={200} />
      </label>

      <label>비밀번호
        <input name="password" type="password" autoComplete="new-password" required maxLength={128}
          value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <ul className="muted">
        <li>{rules.length ? "O" : "X"} 10자 이상</li>
        <li>{rules.upper ? "O" : "X"} 영문 대문자 1자 이상</li>
        <li>{rules.lower ? "O" : "X"} 영문 소문자 1자 이상</li>
        <li>{rules.digit ? "O" : "X"} 숫자 1자 이상</li>
        <li>{rules.symbol ? "O" : "X"} 특수문자 1자 이상</li>
      </ul>

      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="editor-actions">
        <button type="submit" disabled={busy}>{busy ? "만드는 중" : "가입하기"}</button>
        <Link href="/login">로그인으로</Link>
      </div>
    </form>
  </section>;
}
