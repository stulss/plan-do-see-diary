"use client";

import { useEffect } from "react";

export function FormPending() {
  useEffect(() => {
    const pending = (event: SubmitEvent) => {
      // 클라이언트가 직접 처리하는 폼은 각 화면 상태를 쓰고, 기본 제출 폼만 즉시 표시한다.
      if (event.defaultPrevented) return;
      const form = event.target as HTMLFormElement;
      const button = event.submitter as HTMLButtonElement | null;
      if (!form?.checkValidity() || !button) return;
      form.setAttribute("aria-busy", "true");
      button.disabled = true;
      button.textContent = button.dataset.pendingText || "처리 중…";
    };
    document.addEventListener("submit", pending);
    return () => document.removeEventListener("submit", pending);
  }, []);
  return null;
}
