import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { dateOnly, priorityLabel } from "@/lib/format";
import { CreatePlanForm } from "@/app/create-forms";

export const dynamic = "force-dynamic";

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ review?: string; title?: string }> }) {
  const user = await requirePageUser();
  const query = await searchParams;
  const plans = await db()`SELECT * FROM plan WHERE user_id=${user.id} ORDER BY start_date DESC, id DESC`;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const estimateTotal = plans.reduce((sum, plan) => sum + Number(plan.estimate_minutes ?? 0), 0);
  const activeCount = plans.filter((plan) => dateOnly(plan.start_date as Date) <= today && dateOnly(plan.end_date as Date) >= today).length;

  return <div className="workspace-page">
    <section className="workspace-heading">
      <div><span className="eyebrow">PLAN</span><h1>계획</h1><p className="page-lead">기간과 성공 기준을 먼저 정하고, 실행할 일을 연결하세요.</p></div>
      <div className="planner-summary" aria-label="계획 요약"><span><strong>{plans.length}</strong> 전체</span><span><strong>{activeCount}</strong> 진행 중</span><span><strong>{estimateTotal}</strong>분 예상</span></div>
    </section>

    <CreatePlanForm review={query.review} title={query.title} />

    <section className="workspace-section">
      <div className="section-heading"><div><span className="section-kicker">MY PLANS</span><h2>계획 목록</h2></div><span className="badge">{plans.length}건</span></div>
      {plans.length ? <div className="plan-grid">{plans.map((plan) => {
        const start = dateOnly(plan.start_date as Date);
        const end = dateOnly(plan.end_date as Date);
        // 서울 날짜 기준으로 계획 상태를 한 번 계산해 카드와 플래너가 같은 의미를 갖게 한다.
        const status = end < today ? "마침" : start > today ? "예정" : "진행 중";
        return <Link className={`plan-card priority-${Number(plan.priority)}`} key={String(plan.id)} href={`/plans/${plan.id}`}>
          <div className="plan-card-top"><span className={`status-dot ${status === "진행 중" ? "active" : ""}`}>{status}</span><span className="priority-label">우선순위 {priorityLabel(Number(plan.priority))}</span></div>
          <h3>{String(plan.title)}</h3>
          <p>{String(plan.success_criteria)}</p>
          <div className="plan-card-footer"><span>{start.replaceAll("-", ".")} – {end.replaceAll("-", ".")}</span><strong>{Number(plan.estimate_minutes ?? 0)}분</strong></div>
        </Link>;
      })}</div> : <div className="empty-state"><strong>아직 계획이 없습니다.</strong><span>위의 ‘새 계획 만들기’에서 첫 계획을 시작하세요.</span></div>}
    </section>
  </div>;
}
