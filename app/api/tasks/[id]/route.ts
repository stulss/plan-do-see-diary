import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, integer, requestValues, result, value } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    const id = idParam((await params).id);
    const [tasks, runs] = await Promise.all([
      db()`SELECT t.*, p.title AS plan_title, c.completed_at FROM task t JOIN plan p ON p.id=t.plan_id LEFT JOIN task_completion c ON c.task_id=t.id WHERE t.id=${id} AND t.deleted_at IS NULL`,
      db()`SELECT * FROM run_log WHERE task_id=${id} ORDER BY started_at DESC, id DESC`
    ]);
    return tasks[0] ? NextResponse.json({ ...tasks[0], runs }) : NextResponse.json({ error: "할 일을 찾지 못했습니다." }, { status: 404 });
  } catch (error) { return databaseError(error); }
}

async function update(request: NextRequest, id: string) {
  const body = await requestValues(request);
  const tags = value(body, "tags", false).split(",").map((tag) => tag.trim()).filter(Boolean);
  const rows = await db()`UPDATE task SET title=${value(body, "title")}, note=${value(body, "note", false) || null},
    due_date=${value(body, "due_date", false) || null}, priority=${integer(body, "priority")}, tags=${tags},
    estimate_minutes=${integer(body, "estimate_minutes", false)}, updated_at=now()
    WHERE id=${idParam(id)} AND deleted_at IS NULL RETURNING *`;
  return result(request, rows[0], `/tasks/${id}`, 200);
}

async function remove(request: NextRequest, id: string) {
  await db()`UPDATE task SET deleted_at=now(), updated_at=now() WHERE id=${idParam(id)} AND deleted_at IS NULL`;
  return result(request, { deleted: true }, "/tasks", 200);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try { return await update(request, (await params).id); } catch (error) { return databaseError(error); }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try { return await remove(request, (await params).id); } catch (error) { return databaseError(error); }
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const method = request.nextUrl.searchParams.get("_method");
    if (method === "PATCH") return await update(request, id);
    if (method === "DELETE") return await remove(request, id);
    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 405 });
  } catch (error) { return databaseError(error); }
}
