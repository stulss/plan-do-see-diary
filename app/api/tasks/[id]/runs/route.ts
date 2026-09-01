import { NextRequest } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, integer, requestValues, result, value } from "@/lib/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await requestValues(request);
    const startedAt = `${value(body, "started_at")}:00+09:00`;
    const endedText = value(body, "ended_at", false);
    const endedAt = endedText ? `${endedText}:00+09:00` : null;
    // datetime-local에는 시간대 정보가 없으므로 사용자가 입력한 시각을 서울(+09:00)로 해석한다.
    // PostgreSQL timestamptz가 이를 UTC로 저장하고 화면에서 다시 서울 시각으로 표시한다.
    const rows = await db()`INSERT INTO run_log (task_id, started_at, ended_at, actual_minutes, blocker_reason)
      VALUES (${idParam(id)}, ${startedAt}, ${endedAt},
        ${integer(body, "actual_minutes")}, ${value(body, "blocker_reason", false) || null}) RETURNING *`;
    return result(request, rows[0], `/tasks/${id}`);
  } catch (error) { return databaseError(error); }
}
