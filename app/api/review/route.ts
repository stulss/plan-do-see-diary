import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { buildTaskWhere } from "@/lib/query";
import { requestValues, result, value } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get("from") || "1900-01-01";
    const to = request.nextUrl.searchParams.get("to") || "2999-12-31";
    const where = buildTaskWhere({ from, to });
    // 실행 기록을 먼저 할 일별로 합산하는 상관 서브쿼리를 써서,
    // 실행 기록이 여러 개인 할 일이 계획 수에 중복 집계되지 않게 한다.
    const rows = await db().unsafe(`
      WITH target AS (
        SELECT t.id, t.estimate_minutes,
          EXISTS (SELECT 1 FROM task_completion c WHERE c.task_id=t.id) AS done,
          t.due_date < (now() AT TIME ZONE 'Asia/Seoul')::date AS past_due,
          EXISTS (SELECT 1 FROM run_log b WHERE b.task_id=t.id AND NULLIF(btrim(b.blocker_reason), '') IS NOT NULL) AS blocked,
          COALESCE((SELECT SUM(r.actual_minutes) FROM run_log r WHERE r.task_id=t.id), 0) AS actual_minutes
        FROM task t WHERE ${where.text}
      )
      SELECT COUNT(*)::int AS planned_count,
        COUNT(*) FILTER (WHERE done)::int AS done_count,
        COUNT(*) FILTER (WHERE NOT done AND past_due)::int AS overdue_count,
        COUNT(*) FILTER (WHERE blocked)::int AS blocked_count,
        COALESCE(SUM(estimate_minutes), 0)::int AS estimate_minutes,
        COALESCE(SUM(actual_minutes), 0)::int AS actual_minutes,
        (COALESCE(SUM(actual_minutes), 0) - COALESCE(SUM(estimate_minutes), 0))::int AS diff_minutes
      FROM target`, where.values);
    return NextResponse.json(rows[0]);
  } catch (error) { return databaseError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await requestValues(request);
    const rows = await db()`INSERT INTO review (period_start, period_end, next_action)
      VALUES (${value(body, "period_start")}, ${value(body, "period_end")}, ${value(body, "next_action")}) RETURNING *`;
    return result(request, rows[0], `/plans?review=${rows[0].id}&title=${encodeURIComponent(String(rows[0].next_action))}`);
  } catch (error) { return databaseError(error); }
}
