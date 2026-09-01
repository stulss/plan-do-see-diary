import { db, databaseError } from "@/lib/db";

export async function GET() {
  try {
    const sql = db();
    // 무료 Supabase 풀에서 여러 연결을 한꺼번에 열면 오래 대기할 수 있다.
    // 내보내기는 한 번에 한 쿼리씩 읽어도 충분히 작고, 연결 하나를 안정적으로 재사용한다.
    const plans = await sql`SELECT * FROM plan ORDER BY id`;
    const revisions = await sql`SELECT * FROM plan_revision ORDER BY id`;
    const tasks = await sql`SELECT * FROM task ORDER BY id`;
    const completions = await sql`SELECT * FROM task_completion ORDER BY task_id`;
    const runs = await sql`SELECT * FROM run_log ORDER BY id`;
    const reviews = await sql`SELECT * FROM review ORDER BY id`;
    return new Response(JSON.stringify({ exported_at: new Date().toISOString(), plans, plan_revisions: revisions, tasks, task_completions: completions, run_logs: runs, reviews }, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=plan-do-see-export.json" }
    });
  } catch (error) { return databaseError(error); }
}
