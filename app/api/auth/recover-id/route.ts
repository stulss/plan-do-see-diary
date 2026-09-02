import { NextRequest, NextResponse } from "next/server";
import { databaseError } from "@/lib/db";
import { requestValues, value } from "@/lib/http";
import { recoverLoginId } from "@/lib/service/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await requestValues(request);
    const outcome = await recoverLoginId(value(body, "nickname", true, 20), value(body, "email", true, 200));
    return outcome.ok ? NextResponse.json(outcome.value) : NextResponse.json({ error: outcome.error }, { status: outcome.status });
  } catch (error) { return databaseError(error); }
}
