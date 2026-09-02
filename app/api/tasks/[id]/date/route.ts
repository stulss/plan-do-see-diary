import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, requestValues, value } from "@/lib/http";
import { calendarDate } from "@/lib/domain/time";
import { getSessionUser, notFound, unauthorized } from "@/lib/session";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const body = await requestValues(request);
    const dueDate = calendarDate(value(body, "due_date"));
    // 날짜 범위 길이를 유지한 채 마감일을 드롭한 날짜로 옮긴다.
    const rows = await db()`UPDATE task SET start_date=${dueDate}::date - (due_date - start_date), due_date=${dueDate}, updated_at=now()
      WHERE id=${idParam((await params).id)} AND user_id=${user.id} AND deleted_at IS NULL
      RETURNING id, due_date`;
    return rows[0] ? NextResponse.json(rows[0]) : notFound("할 일을 찾지 못했습니다.");
  } catch (error) { return databaseError(error); }
}
