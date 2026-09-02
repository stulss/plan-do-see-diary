import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { integer, requestValues, result, value } from "@/lib/http";
import { buildTaskWhere, Metric, TaskFilter } from "@/lib/domain/query";
import { getSessionUser, notFound, unauthorized } from "@/lib/session";
import { taskDateRange, taskSchedule } from "@/lib/domain/time";

function filters(params: URLSearchParams): TaskFilter {
  const take = (name: string) => params.get(name) || undefined;
  return {
    from: take("from"), to: take("to"), metric: take("metric") as Metric | undefined,
    q: take("q")?.slice(0, 100), status: take("status") as TaskFilter["status"], priority: take("priority"), tag: take("tag")?.slice(0, 100)
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    // 목록 누수는 buildTaskWhere 한 곳에서 막는다. 소유자 조건이 첫 조건으로 들어간다.
    const where = buildTaskWhere(user.id, filters(request.nextUrl.searchParams));
    const rows = await db().unsafe(`
      SELECT t.*, COALESCE(p.title, '계획 없음') AS plan_title, c.completed_at,
        COALESCE((SELECT SUM(r.actual_minutes) FROM run_log r WHERE r.task_id = t.id), 0)::int AS actual_minutes
      FROM task t LEFT JOIN plan p ON p.id = t.plan_id LEFT JOIN task_completion c ON c.task_id = t.id
      WHERE ${where.text}
      ORDER BY t.due_date ASC NULLS LAST, t.priority DESC, t.id ASC`, where.values);
    return NextResponse.json(rows);
  } catch (error) { return databaseError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const body = await requestValues(request);
    const tags = value(body, "tags", false).split(",").map((tag) => tag.trim()).filter(Boolean);
    const dates = taskDateRange(value(body, "start_date"), value(body, "due_date"));
    const schedule = taskSchedule(value(body, "start_time"), value(body, "end_time"));
    const planId = integer(body, "plan_id", false);
    const title = value(body, "title");
    const note = value(body, "note", false) || null;
    const priority = integer(body, "priority");
    // 계획은 선택 사항이다. 선택한 경우에만 그 계획이 로그인 사용자의 것인지 SQL에서 확인한다.
    const rows = planId === null
      ? await db()`INSERT INTO task (plan_id, title, note, start_date, due_date, start_minute, end_minute, priority, tags, estimate_minutes, user_id)
          VALUES (NULL, ${title}, ${note}, ${dates.startDate}, ${dates.endDate}, ${schedule.startMinute}, ${schedule.endMinute}, ${priority}, ${tags}, ${schedule.minutes}, ${user.id}) RETURNING *`
      : await db()`INSERT INTO task (plan_id, title, note, start_date, due_date, start_minute, end_minute, priority, tags, estimate_minutes, user_id)
          SELECT p.id, ${title}, ${note}, ${dates.startDate}, ${dates.endDate}, ${schedule.startMinute}, ${schedule.endMinute}, ${priority}, ${tags}, ${schedule.minutes}, p.user_id
          FROM plan p WHERE p.id=${planId} AND p.user_id=${user.id} RETURNING *`;
    if (!rows[0]) return notFound("계획을 찾지 못했습니다.");
    return result(request, rows[0], "/tasks");
  } catch (error) { return databaseError(error); }
}
