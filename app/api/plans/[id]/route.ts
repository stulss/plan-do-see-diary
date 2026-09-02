import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, integer, requestValues, result, value } from "@/lib/http";
import { getSessionUser, notFound, unauthorized } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

// 한 건 조회·수정·삭제는 모두 id 와 소유자를 함께 건다.
// 0행이면 404 로 돌려주어 남의 자료는 존재 자체를 알리지 않는다 (T07-C121).
export async function GET(_: NextRequest, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const id = idParam((await params).id);
    const plan = await db()`
      SELECT p.*, r.period_start AS carried_period_start, r.period_end AS carried_period_end
      FROM plan p LEFT JOIN review r ON r.id = p.carried_from_review_id
      WHERE p.id = ${id} AND p.user_id = ${user.id}`;
    if (!plan[0]) return notFound("계획을 찾지 못했습니다.");
    const revisions = await db()`SELECT * FROM plan_revision WHERE plan_id = ${id} ORDER BY revised_at DESC, id DESC`;
    return NextResponse.json({ ...plan[0], revisions });
  } catch (error) {
    return databaseError(error);
  }
}

async function update(request: NextRequest, id: string, userId: string) {
  const body = await requestValues(request);
  // UPDATE 직전 값은 schema.sql의 BEFORE UPDATE 트리거가 plan_revision에 자동 보관한다.
  // 소유자 조건을 WHERE 에 함께 두었으므로, 남의 계획이면 한 글자도 바뀌지 않는다 (T07-C122).
  const rows = await db()`
    UPDATE plan SET title = ${value(body, "title")}, start_date = ${value(body, "start_date")},
      end_date = ${value(body, "end_date")}, priority = ${integer(body, "priority")},
      success_criteria = ${value(body, "success_criteria")}, estimate_minutes = ${integer(body, "estimate_minutes", false)}
    WHERE id = ${idParam(id)} AND user_id = ${userId} RETURNING *`;
  if (!rows[0]) return notFound("계획을 찾지 못했습니다.");
  return result(request, rows[0], `/plans/${id}`, 200);
}

async function remove(request: NextRequest, id: string, userId: string) {
  const rows = await db()`DELETE FROM plan WHERE id = ${idParam(id)} AND user_id = ${userId} RETURNING id`;
  if (!rows[0]) return notFound("계획을 찾지 못했습니다.");
  return result(request, { deleted: true }, "/plans", 200);
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
    const method = new URL(request.url).searchParams.get("_method");
    if (method === "PATCH") return await update(request, id, user.id);
    if (method === "DELETE") return await remove(request, id, user.id);
    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 405 });
  } catch (error) { return databaseError(error); }
}
