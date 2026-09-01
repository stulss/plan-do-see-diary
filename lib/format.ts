export function seoulDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

export function dateOnly(value: string | Date) {
  // PostgreSQL date가 Date 객체로 와도 입력창과 화면에서는 YYYY-MM-DD만 보여준다.
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

export function priorityLabel(value: number) {
  return value === 3 ? "높음" : value === 2 ? "보통" : "낮음";
}

export function formText(form: FormData, name: string, required = true) {
  const value = String(form.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${name} 값이 필요합니다.`);
  return value;
}

export function formInt(form: FormData, name: string, required = true) {
  const text = formText(form, name, required);
  if (!text && !required) return null;
  const value = Number(text);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} 값이 올바르지 않습니다.`);
  return value;
}
