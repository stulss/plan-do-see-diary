import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { integer, requestValues, result, value } from "@/lib/http";
import { getSessionUser, unauthorized } from "@/lib/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return NextResponse.json(await db()`SELECT * FROM plan WHERE user_id = ${user.id} ORDER BY start_date DESC, id DESC`);
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const body = await requestValues(request);
    // 소유자는 언제나 세션에서 온다. 요청 본문의 user_id 같은 값은 읽지 않는다.
    const rows = await db()`
      INSERT INTO plan (title, start_date, end_date, priority, success_criteria, estimate_minutes, carried_from_review_id, user_id)
      VALUES (${value(body, "title")}, ${value(body, "start_date")}, ${value(body, "end_date")},
        ${integer(body, "priority")}, ${value(body, "success_criteria")}, ${integer(body, "estimate_minutes", false)},
        ${integer(body, "carried_from_review_id", false)}, ${user.id})
      RETURNING *`;
    return result(request, rows[0], `/plans/${rows[0].id}`);
  } catch (error) {
    return databaseError(error);
  }
}
