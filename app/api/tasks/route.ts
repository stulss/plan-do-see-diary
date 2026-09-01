import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { integer, requestValues, result, value } from "@/lib/http";
import { buildTaskWhere, Metric, TaskFilter } from "@/lib/query";

function filters(params: URLSearchParams): TaskFilter {
  const take = (name: string) => params.get(name) || undefined;
  return {
    from: take("from"), to: take("to"), metric: take("metric") as Metric | undefined,
    q: take("q")?.slice(0, 100), status: take("status") as TaskFilter["status"], priority: take("priority"), tag: take("tag")?.slice(0, 100)
  };
}

export async function GET(request: NextRequest) {
  try {
    const where = buildTaskWhere(filters(request.nextUrl.searchParams));
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
    const body = await requestValues(request);
    const tags = value(body, "tags", false).split(",").map((tag) => tag.trim()).filter(Boolean);
    const rows = await db()`
      INSERT INTO task (plan_id, title, note, due_date, priority, tags, estimate_minutes)
      VALUES (${integer(body, "plan_id")}, ${value(body, "title")}, ${value(body, "note", false) || null},
        ${value(body, "due_date", false) || null}, ${integer(body, "priority")}, ${tags}, ${integer(body, "estimate_minutes", false)})
      RETURNING *`;
    return result(request, rows[0], "/tasks");
  } catch (error) { return databaseError(error); }
}
