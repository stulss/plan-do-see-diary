import { NextRequest, NextResponse } from "next/server";

export async function requestValues(request: NextRequest) {
  // 로그인 없는 공개 API이므로 지나치게 큰 요청을 먼저 거절해 메모리와 DB를 보호한다.
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_768) throw new Error("요청 내용이 너무 깁니다.");
  if (request.headers.get("content-type")?.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries()) as Record<string, unknown>;
}

export function value(body: Record<string, unknown>, key: string, required = true, maxLength = 2_000) {
  const result = String(body[key] ?? "").trim();
  if (required && !result) throw new Error(`${key} 값이 필요합니다.`);
  if (result.length > maxLength) throw new Error(`${key} 값은 ${maxLength}자 이하여야 합니다.`);
  return result;
}

export function integer(body: Record<string, unknown>, key: string, required = true) {
  const text = value(body, key, required);
  if (!text && !required) return null;
  const result = Number(text);
  if (!Number.isInteger(result) || result < 0) throw new Error(`${key} 값이 올바르지 않습니다.`);
  return result;
}

export function result(request: NextRequest, data: unknown, location: string, status = 201) {
  // API 호출은 JSON을 받고, HTML form 제출은 사용자가 보던 화면으로 돌아간다.
  return request.headers.get("content-type")?.includes("application/json")
    ? NextResponse.json(data, { status })
    : NextResponse.redirect(new URL(location, request.url), 303);
}

export function idParam(id: string) {
  if (!/^\d+$/.test(id)) throw new Error("올바르지 않은 ID입니다.");
  return id;
}
