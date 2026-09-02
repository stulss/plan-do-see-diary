"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordField } from "@/app/form-controls";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ login_id: form.get("login_id"), password: form.get("password") })
    });
    if (response.ok) {
      window.location.href = "/";
      return;
    }
    const data = await response.json().catch(() => ({ error: "로그인하지 못했습니다." }));
    setError(data.error ?? "로그인하지 못했습니다.");
    setBusy(false);
  }

  return <section className="card">
    <p className="eyebrow">플랜두씨 다이어리</p>
    <h1>로그인</h1>
    <p className="page-lead">기록은 로그인한 계정 안에만 보입니다.</p>

    <form className="editor-form" onSubmit={submit}>
      <label>아이디
        <input name="login_id" autoComplete="username" required maxLength={20} />
      </label>
      <PasswordField />
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="editor-actions">
        <button type="submit" disabled={busy}>{busy ? "확인하는 중" : "로그인"}</button>
        <Link href="/signup">계정 만들기</Link>
      </div>
      <Link className="auth-help-link" href="/recover">아이디·비밀번호 찾기</Link>
    </form>
  </section>;
}
