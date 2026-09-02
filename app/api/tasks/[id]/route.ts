import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, integer, requestValues, result, value } from "@/lib/http";
import { getSessionUser, notFound, unauthorized } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const id = idParam((await params).id);
    // 실행 기록도 부모 할 일의 소유자를 통해 걸러진다. 자식 자원만 따로 열 수 없다.
    const [tasks, runs] = await Promise.all([
      db()`SELECT t.*, p.title AS plan_title, c.completed_at FROM task t JOIN plan p ON p.id=t.plan_id LEFT JOIN task_completion c ON c.task_id=t.id WHERE t.id=${id} AND t.user_id=${user.id} AND t.deleted_at IS NULL`,
      db()`SELECT r.* FROM run_log r JOIN task t ON t.id=r.task_id WHERE r.task_id=${id} AND t.user_id=${user.id} ORDER BY r.started_at DESC, r.id DESC`
    ]);
    return tasks[0] ? NextResponse.json({ ...tasks[0], runs }) : notFound("할 일을 찾지 못했습니다.");
  } catch (error) { return databaseError(error); }
}

async function update(request: NextRequest, id: string, userId: string) {
  const body = await requestValues(request);
  const tags = value(body, "tags", false).split(",").map((tag) => tag.trim()).filter(Boolean);
  // 소유자 조건이 UPDATE 의 WHERE 에 있으므로, 남의 할 일이면 아무것도 바뀌지 않는다.
  const rows = await db()`UPDATE task SET title=${value(body, "title")}, note=${value(body, "note", false) || null},
    due_date=${value(body, "due_date", false) || null}, priority=${integer(body, "priority")}, tags=${tags},
    estimate_minutes=${integer(body, "estimate_minutes", false)}, updated_at=now()
    WHERE id=${idParam(id)} AND user_id=${userId} AND deleted_at IS NULL RETURNING *`;
  if (!rows[0]) return notFound("할 일을 찾지 못했습니다.");
  return result(request, rows[0], `/tasks/${id}`, 200);
}

async function remove(request: NextRequest, id: string, userId: string) {
  const rows = await db()`UPDATE task SET deleted_at=now(), updated_at=now()
    WHERE id=${idParam(id)} AND user_id=${userId} AND deleted_at IS NULL RETURNING id`;
  if (!rows[0]) return notFound("할 일을 찾지 못했습니다.");
  return result(request, { deleted: true }, "/tasks", 200);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return await update(request, (await params).id, user.id);
  } catch (error) { return databaseError(error); }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return await remove(request, (await params).id, user.id);
  } catch (error) { return databaseError(error); }
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const method = request.nextUrl.searchParams.get("_method");
    if (method === "PATCH") return await update(request, id, user.id);
    if (method === "DELETE") return await remove(request, id, user.id);
    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 405 });
  } catch (error) { return databaseError(error); }
}
