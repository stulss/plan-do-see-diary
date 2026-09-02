import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { integer, requestValues, result, value } from "@/lib/http";
import { buildTaskWhere, Metric, TaskFilter } from "@/lib/domain/query";
import { getSessionUser, notFound, unauthorized } from "@/lib/session";

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
      SELECT t.*, p.title AS plan_title, c.completed_at,
        COALESCE((SELECT SUM(r.actual_minutes) FROM run_log r WHERE r.task_id = t.id), 0)::int AS actual_minutes
      FROM task t JOIN plan p ON p.id = t.plan_id LEFT JOIN task_completion c ON c.task_id = t.id
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
    // 계획의 주인이 나일 때만 행이 만들어진다. 남의 계획에 할 일을 붙일 수 없다.
    const rows = await db()`
      INSERT INTO task (plan_id, title, note, due_date, priority, tags, estimate_minutes, user_id)
      SELECT p.id, ${value(body, "title")}::text, ${value(body, "note", false) || null}::text,
        ${value(body, "due_date", false) || null}::date, ${integer(body, "priority")}::smallint,
        ${tags}::text[], ${integer(body, "estimate_minutes", false)}::int, p.user_id
      FROM plan p WHERE p.id = ${integer(body, "plan_id")} AND p.user_id = ${user.id}
      RETURNING *`;
    if (!rows[0]) return notFound("계획을 찾지 못했습니다.");
    return result(request, rows[0], "/tasks");
  } catch (error) { return databaseError(error); }
}
