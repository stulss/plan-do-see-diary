import { NextRequest, NextResponse } from "next/server";
import { db, databaseError } from "@/lib/db";
import { integer, requestValues, result, value } from "@/lib/http";

export async function GET() {
  try {
    return NextResponse.json(await db()`SELECT * FROM plan ORDER BY start_date DESC, id DESC`);
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await requestValues(request);
    const rows = await db()`
      INSERT INTO plan (title, start_date, end_date, priority, success_criteria, estimate_minutes, carried_from_review_id)
      VALUES (${value(body, "title")}, ${value(body, "start_date")}, ${value(body, "end_date")},
        ${integer(body, "priority")}, ${value(body, "success_criteria")}, ${integer(body, "estimate_minutes", false)},
        ${integer(body, "carried_from_review_id", false)})
      RETURNING *`;
    return result(request, rows[0], `/plans/${rows[0].id}`);
  } catch (error) {
    return databaseError(error);
  }
}
