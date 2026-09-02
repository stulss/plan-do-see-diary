import { db, databaseError } from "@/lib/db";
import { getSessionUser, unauthorized } from "@/lib/session";
import {
  publicCompletion, publicPlan, publicPlanRevision, publicReview, publicRun, publicTask
} from "@/lib/dto/records";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const me = user.id;
    // 무료 Supabase 풀에서 여러 연결을 한꺼번에 열면 오래 대기할 수 있다.
    // 내보내기는 한 번에 한 쿼리씩 읽어도 충분히 작고, 연결 하나를 안정적으로 재사용한다.
    // 여섯 질의가 모두 내 소유 조건을 지난다. 자식 표는 부모를 통해 걸러진다.
    const plans = await db()`SELECT * FROM plan WHERE user_id = ${me} ORDER BY id`;
    const revisions = await db()`SELECT v.* FROM plan_revision v JOIN plan p ON p.id = v.plan_id WHERE p.user_id = ${me} ORDER BY v.id`;
    const tasks = await db()`SELECT * FROM task WHERE user_id = ${me} ORDER BY id`;
    const completions = await db()`SELECT c.* FROM task_completion c JOIN task t ON t.id = c.task_id WHERE t.user_id = ${me} ORDER BY c.task_id`;
    const runs = await db()`SELECT r.* FROM run_log r JOIN task t ON t.id = r.task_id WHERE t.user_id = ${me} ORDER BY r.id`;
    const reviews = await db()`SELECT * FROM review WHERE user_id = ${me} ORDER BY id`;

    // DB 행을 그대로 내보내지 않는다. 화이트리스트를 거친 필드만 파일에 담긴다.
    const payload = {
      exported_at: new Date().toISOString(),
      plans: plans.map(publicPlan),
      plan_revisions: revisions.map(publicPlanRevision),
      tasks: tasks.map(publicTask),
      task_completions: completions.map(publicCompletion),
      run_logs: runs.map(publicRun),
      reviews: reviews.map(publicReview)
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": "attachment; filename=plan-do-see-export.json"
      }
    });
  } catch (error) { return databaseError(error); }
}
