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
  const pressedInsideInput = useRef(false);
  return <input ref={ref} type="date" name={name} required={required} defaultValue={defaultValue}
    // label 글자를 누른 합성 클릭은 제외하고, 보이는 입력 박스를 직접 누를 때만 달력을 연다.
    onPointerDown={() => { pressedInsideInput.current = true; }}
    onClick={() => {
      if (pressedInsideInput.current) ref.current?.showPicker?.();
      pressedInsideInput.current = false;
    }} />;
}

export function SubmitButton({ children, pendingText = "처리하는 중…", disabled = false }: { children: React.ReactNode; pendingText?: string; disabled?: boolean }) {
  return <button type="submit" disabled={disabled} data-pending-text={pendingText}>{children}</button>;
}
