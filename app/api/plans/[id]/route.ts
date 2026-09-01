import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { idParam, integer, requestValues, result, value } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    const id = idParam((await params).id);
    const [plan, revisions] = await Promise.all([
      db()`SELECT p.*, r.period_start AS carried_period_start, r.period_end AS carried_period_end FROM plan p LEFT JOIN review r ON r.id = p.carried_from_review_id WHERE p.id = ${id}`,
      db()`SELECT * FROM plan_revision WHERE plan_id = ${id} ORDER BY revised_at DESC, id DESC`
    ]);
    return plan[0] ? NextResponse.json({ ...plan[0], revisions }) : NextResponse.json({ error: "계획을 찾지 못했습니다." }, { status: 404 });
  } catch (error) {
    return databaseError(error);
  }
}

async function update(request: NextRequest, id: string) {
  const body = await requestValues(request);
  // UPDATE 직전 값은 schema.sql의 BEFORE UPDATE 트리거가 plan_revision에 자동 보관한다.
  const rows = await db()`
    UPDATE plan SET title = ${value(body, "title")}, start_date = ${value(body, "start_date")},
      end_date = ${value(body, "end_date")}, priority = ${integer(body, "priority")},
      success_criteria = ${value(body, "success_criteria")}, estimate_minutes = ${integer(body, "estimate_minutes", false)}
    WHERE id = ${idParam(id)} RETURNING *`;
  return result(request, rows[0], `/plans/${id}`, 200);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try { return await update(request, (await params).id); } catch (error) { return databaseError(error); }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const method = new URL(request.url).searchParams.get("_method");
    if (method === "PATCH") return await update(request, id);
    if (method === "DELETE") return await remove(request, id);
    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 405 });
  } catch (error) { return databaseError(error); }
}

async function remove(request: NextRequest, id: string) {
  await db()`DELETE FROM plan WHERE id = ${idParam(id)}`;
  return result(request, { deleted: true }, "/plans", 200);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try { return await remove(request, (await params).id); } catch (error) { return databaseError(error); }
}
