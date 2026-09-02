import { NextRequest } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, result } from "@/lib/http";
import { getSessionUser, notFound, unauthorized } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

// 완료를 바꾸기 전에 부모 할 일의 주인부터 확인한다. 남의 할 일이면 404 로 끝난다.
async function owned(id: string, userId: string) {
  const rows = await db()`SELECT 1 FROM task WHERE id=${id} AND user_id=${userId} AND deleted_at IS NULL`;
  return rows.length > 0;
}

async function clear(request: NextRequest, id: string) {
  await db()`DELETE FROM task_completion WHERE task_id=${id}`;
  return result(request, { completed: false }, "/tasks", 200);
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const id = idParam((await params).id);
    if (!(await owned(id, user.id))) return notFound("할 일을 찾지 못했습니다.");
    if (request.nextUrl.searchParams.get("_method") === "DELETE") return await clear(request, id);
    // 버튼 상태가 아니라 DB 기본키와 ON CONFLICT가 중복 완료를 막는다.
    await db()`INSERT INTO task_completion (task_id) VALUES (${id}) ON CONFLICT (task_id) DO NOTHING`;
    return result(request, { completed: true }, "/tasks", 200);
  } catch (error) { return databaseError(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const id = idParam((await context.params).id);
    if (!(await owned(id, user.id))) return notFound("할 일을 찾지 못했습니다.");
    return await clear(request, id);
  } catch (error) { return databaseError(error); }
}
