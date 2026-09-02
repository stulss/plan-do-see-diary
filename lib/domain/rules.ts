// 가입 입력 규칙. DB 와 HTTP 를 모르는 순수 함수라 그대로 단위 검사할 수 있다.
// 화면에서도 같은 규칙을 안내하지만, 최종 판단은 언제나 서버에서 이 함수가 한다.

export const LOGIN_ID_RULE = "아이디는 4~20자의 영문 소문자·숫자·밑줄이며 첫 글자는 영문이어야 합니다.";
export const NICKNAME_RULE = "닉네임은 2~20자여야 합니다.";
export const EMAIL_RULE = "이메일 형식이 올바르지 않습니다.";
export const PASSWORD_RULE =
  "비밀번호는 10자 이상이며 대문자·소문자·숫자·특수문자를 각각 1자 이상 포함해야 합니다.";

// 아이디는 대소문자를 무시하고 비교하므로 저장 전에 소문자로 맞춘다.
export const normalizeLoginId = (raw: string) => raw.trim().toLowerCase();
export const normalizeEmail = (raw: string) => raw.trim().toLowerCase();
export const normalizeNickname = (raw: string) => raw.trim();

export function checkLoginId(raw: string): string | null {
  return /^[a-z][a-z0-9_]{3,19}$/.test(normalizeLoginId(raw)) ? null : LOGIN_ID_RULE;
}

export function checkNickname(raw: string): string | null {
  const value = normalizeNickname(raw);
  return value.length >= 2 && value.length <= 20 ? null : NICKNAME_RULE;
}

export function checkEmail(raw: string): string | null {
  const value = normalizeEmail(raw);
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value) && value.length <= 200 ? null : EMAIL_RULE;
}

// 조건을 하나라도 못 채우면 같은 안내 문구를 돌려준다.
// 가입 단계에서는 계정 존재 여부가 새지 않으므로 무엇이 빠졌는지 구체적으로 알려도 안전하다.
export function checkPassword(raw: string): string | null {
  if (typeof raw !== "string") return PASSWORD_RULE;
  if (raw.length < 10 || raw.length > 128) return PASSWORD_RULE;
  if (!/[A-Z]/.test(raw)) return PASSWORD_RULE;
  if (!/[a-z]/.test(raw)) return PASSWORD_RULE;
  if (!/[0-9]/.test(raw)) return PASSWORD_RULE;
  // 영문·숫자·공백이 아닌 문자를 특수문자로 본다.
  if (!/[^A-Za-z0-9\s]/.test(raw)) return PASSWORD_RULE;
  return null;
}

// 빠진 조건을 화면에 하나씩 보여 주기 위한 목록. 검사 통과 여부는 checkPassword 가 결정한다.
export function passwordChecklist(raw: string) {
  return {
    length: raw.length >= 10 && raw.length <= 128,
    upper: /[A-Z]/.test(raw),
    lower: /[a-z]/.test(raw),
    digit: /[0-9]/.test(raw),
    symbol: /[^A-Za-z0-9\s]/.test(raw)
  };
}
