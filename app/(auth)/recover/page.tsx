"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PasswordField } from "@/app/form-controls";

async function post(path: string, form: HTMLFormElement) {
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
  return { ok: response.ok, data: await response.json().catch(() => ({ error: "요청을 처리하지 못했습니다." })) };
}

export default function RecoverPage() {
  const [idMessage, setIdMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  async function findId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIdMessage("확인하는 중…");
    const result = await post("/api/auth/recover-id", event.currentTarget);
    setIdMessage(result.ok ? `아이디: ${result.data.login_id}` : result.data.error);
  }
  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordMessage("변경하는 중…");
    const result = await post("/api/auth/recover-password", event.currentTarget);
    setPasswordMessage(result.ok ? "비밀번호를 변경했습니다. 다시 로그인하세요." : result.data.error);
  }

  return <section className="auth-stack">
    <div className="card"><p className="eyebrow">ACCOUNT HELP</p><h1>계정 찾기</h1><p className="page-lead">가입할 때 입력한 정보가 모두 일치해야 합니다.</p></div>
    <form className="editor-form" onSubmit={findId}><h2>아이디 찾기</h2><label>닉네임<input name="nickname" required maxLength={20} /></label><label>이메일<input name="email" type="email" required maxLength={200} /></label><button>아이디 확인</button>{idMessage && <p className="notice" role="status">{idMessage}</p>}</form>
    <form className="editor-form" onSubmit={resetPassword}><h2>비밀번호 다시 설정</h2><label>아이디<input name="login_id" required maxLength={20} /></label><label>닉네임<input name="nickname" required maxLength={20} /></label><label>이메일<input name="email" type="email" required maxLength={200} /></label><PasswordField name="new_password" label="새 비밀번호" autoComplete="new-password" /><button>비밀번호 변경</button>{passwordMessage && <p className="notice" role="status">{passwordMessage}</p>}</form>
    <Link href="/login">로그인으로 돌아가기</Link>
  </section>;
}
