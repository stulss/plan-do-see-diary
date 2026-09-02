import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { buildTaskWhere } from "@/lib/domain/query";

export const dynamic = "force-dynamic";

function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const user = await requirePageUser();
  const query = await searchParams;
  const to = query.to ?? today();
  const from = query.from ?? `${to.slice(0, 8)}01`;
  const where = buildTaskWhere(user.id, { from, to });
  // API와 같은 집계식을 서버 화면에서도 사용한다. target은 삭제되지 않았고
  // 마감일이 조회 기간에 포함된 할 일만 뜻한다.
  const rows = await db().unsafe(`WITH target AS (
    SELECT t.id, t.estimate_minutes, EXISTS (SELECT 1 FROM task_completion c WHERE c.task_id=t.id) AS done,
      t.due_date < (now() AT TIME ZONE 'Asia/Seoul')::date AS past_due,
      EXISTS (SELECT 1 FROM run_log b WHERE b.task_id=t.id AND NULLIF(btrim(b.blocker_reason), '') IS NOT NULL) AS blocked,
      COALESCE((SELECT SUM(r.actual_minutes) FROM run_log r WHERE r.task_id=t.id), 0) AS actual_minutes
    FROM task t WHERE ${where.text})
    SELECT COUNT(*)::int planned_count, COUNT(*) FILTER (WHERE done)::int done_count,
      COUNT(*) FILTER (WHERE NOT done AND past_due)::int overdue_count, COUNT(*) FILTER (WHERE blocked)::int blocked_count,
      COALESCE(SUM(estimate_minutes), 0)::int estimate_minutes, COALESCE(SUM(actual_minutes), 0)::int actual_minutes,
      (COALESCE(SUM(actual_minutes),0)-COALESCE(SUM(estimate_minutes),0))::int diff_minutes FROM target`, where.values);
  const stats = rows[0];
  const planned = Number(stats.planned_count);
  const done = Number(stats.done_count);
  const completionRate = planned ? Math.round(done / planned * 100) : 0;
  // 모든 집계 카드는 같은 기간/조건을 유지한 채 근거 할 일 목록으로 이동한다.
  const taskLink = (metric: string) => `/tasks?from=${from}&to=${to}&metric=${metric}`;

  return <div className="workspace-page review-page">
    <section className="workspace-heading">
      <div><span className="eyebrow">SEE</span><h1>돌아보기</h1><p className="page-lead">계획과 실제의 차이를 확인하고 다음 행동 한 줄을 정하세요.</p></div>
      <div className="review-rate"><strong>{completionRate}%</strong><span>완료율</span><progress max={planned || 1} value={done} aria-label={`완료율 ${completionRate}%`} /></div>
    </section>

    <form className="period-filter" method="get"><div><span className="section-kicker">PERIOD</span><strong>조회 기간</strong></div><label>시작일<input type="date" name="from" required defaultValue={from} /></label><span className="period-arrow">→</span><label>종료일<input type="date" name="to" required defaultValue={to} /></label><button>조회</button></form>

    <section className="workspace-section">
      <div className="section-heading"><div><span className="section-kicker">SUMMARY</span><h2>{from.replaceAll("-", ".")} – {to.replaceAll("-", ".")}</h2></div><span className="muted">숫자를 누르면 근거 목록으로 이동합니다.</span></div>
      <div className="review-grid">
        <Link className="review-metric planned" href={taskLink("planned")}><span>계획</span><strong>{planned}</strong><small>마감이 기간 안인 할 일</small></Link>
        <Link className="review-metric done" href={taskLink("done")}><span>완료</span><strong>{done}</strong><small>완료율 {completionRate}%</small></Link>
        <Link className="review-metric overdue" href={taskLink("overdue")}><span>지연</span><strong>{Number(stats.overdue_count)}</strong><small>미완료·마감 지남</small></Link>
        <Link className="review-metric blocked" href={taskLink("blocked")}><span>막힘</span><strong>{Number(stats.blocked_count)}</strong><small>막힌 이유가 있는 기록</small></Link>
        <Link className="review-metric estimate" href={taskLink("estimate")}><span>예상</span><strong>{Number(stats.estimate_minutes)}<small>분</small></strong><small>계획한 총 시간</small></Link>
        <Link className="review-metric actual" href={taskLink("actual")}><span>실제</span><strong>{Number(stats.actual_minutes)}<small>분</small></strong><small>기록한 총 시간</small></Link>
        <Link className={`review-metric variance ${Number(stats.diff_minutes) > 0 ? "over" : ""}`} href={taskLink("diff")}><span>차이</span><strong>{Number(stats.diff_minutes) >= 0 ? "+" : ""}{Number(stats.diff_minutes)}<small>분</small></strong><small>실제 − 예상</small></Link>
      </div>
    </section>

    <form className="reflection-panel" action="/api/review" method="post"><div className="reflection-copy"><span className="section-kicker">NEXT PLAN</span><h2>다음에 바꿀 한 가지</h2><p>결과를 평가하는 데서 끝내지 말고 다음 계획에서 실행할 행동으로 바꾸세요.</p></div><input type="hidden" name="period_start" value={from} /><input type="hidden" name="period_end" value={to} /><label className="reflection-field"><span>고칠 점</span><input name="next_action" required maxLength={200} placeholder="예: 시작 전에 방해 요소 하나 치우기" /><small>행동 하나만, 200자 이내로 적어 주세요.</small></label><button>이 한 줄로 계획 만들기</button></form>
  </div>;
}
