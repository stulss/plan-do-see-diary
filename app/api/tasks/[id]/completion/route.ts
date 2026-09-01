import { NextRequest } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, result } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const id = idParam((await params).id);
    if (request.nextUrl.searchParams.get("_method") === "DELETE") {
      await db()`DELETE FROM task_completion WHERE task_id=${id}`;
      return result(request, { completed: false }, "/tasks", 200);
    }
    // 버튼 상태가 아니라 DB 기본키와 ON CONFLICT가 중복 완료를 막는다.
    await db()`INSERT INTO task_completion (task_id) VALUES (${id}) ON CONFLICT (task_id) DO NOTHING`;
    return result(request, { completed: true }, "/tasks", 200);
  } catch (error) { return databaseError(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const id = idParam((await context.params).id);
    await db()`DELETE FROM task_completion WHERE task_id=${id}`;
    return result(request, { completed: false }, "/tasks", 200);
  } catch (error) { return databaseError(error); }
}
