import { NextRequest } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, integer, requestValues, result, value } from "@/lib/http";
import { getSessionUser, notFound, unauthorized } from "@/lib/session";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const body = await requestValues(request);
    const startedAt = `${value(body, "started_at")}:00+09:00`;
    const endedText = value(body, "ended_at", false);
    const endedAt = endedText ? `${endedText}:00+09:00` : null;
    // datetime-local에는 시간대 정보가 없으므로 사용자가 입력한 시각을 서울(+09:00)로 해석한다.
    // 부모 할 일의 주인이 나일 때만 행이 만들어진다. 남의 할 일에는 기록을 붙일 수 없다.
    const rows = await db()`INSERT INTO run_log (task_id, started_at, ended_at, actual_minutes, blocker_reason)
      SELECT t.id, ${startedAt}::timestamptz, ${endedAt}::timestamptz,
        ${integer(body, "actual_minutes")}::int, ${value(body, "blocker_reason", false) || null}::text
      FROM task t WHERE t.id = ${idParam(id)} AND t.user_id = ${user.id} AND t.deleted_at IS NULL
      RETURNING *`;
    if (!rows[0]) return notFound("할 일을 찾지 못했습니다.");
    return result(request, rows[0], `/tasks/${id}`);
  } catch (error) { return databaseError(error); }
}
