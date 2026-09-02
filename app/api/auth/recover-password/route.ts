import { NextRequest, NextResponse } from "next/server";
import { databaseError } from "@/lib/db";
import { requestValues, value } from "@/lib/http";
import { recoverPassword } from "@/lib/service/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await requestValues(request);
    const outcome = await recoverPassword(value(body, "login_id", true, 20), value(body, "nickname", true, 20), value(body, "email", true, 200), String(body.new_password ?? ""));
    return outcome.ok ? NextResponse.json(outcome.value) : NextResponse.json({ error: outcome.error }, { status: outcome.status });
  } catch (error) { return databaseError(error); }
}
