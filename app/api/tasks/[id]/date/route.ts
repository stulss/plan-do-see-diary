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
    // 드롭으로는 날짜만 바꾸며 제목·시간·실행 기록은 건드리지 않는다.
    const rows = await db()`UPDATE task SET due_date=${dueDate}, updated_at=now()
      WHERE id=${idParam((await params).id)} AND user_id=${user.id} AND deleted_at IS NULL
      RETURNING id, due_date`;
    return rows[0] ? NextResponse.json(rows[0]) : notFound("할 일을 찾지 못했습니다.");
  } catch (error) { return databaseError(error); }
}
