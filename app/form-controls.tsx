"use client";

import { useRef, useState } from "react";

export function PasswordField({ name = "password", label = "비밀번호", autoComplete = "current-password" }: { name?: string; label?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <label>{label}<span className="password-control">
    <input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required maxLength={128} />
    <button type="button" className="field-button" aria-pressed={visible} onClick={() => setVisible((value) => !value)}>{visible ? "숨기기" : "보기"}</button>
  </span></label>;
}

export function DateInput({ name, defaultValue, required = true }: { name: string; defaultValue?: string; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return <input ref={ref} type="date" name={name} required={required} defaultValue={defaultValue}
    onClick={() => ref.current?.showPicker?.()} />;
}

export function SubmitButton({ children, pendingText = "처리하는 중…", disabled = false }: { children: React.ReactNode; pendingText?: string; disabled?: boolean }) {
  return <button type="submit" disabled={disabled} data-pending-text={pendingText}>{children}</button>;
}
