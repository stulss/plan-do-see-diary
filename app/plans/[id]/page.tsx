import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dateOnly, priorityLabel, seoulDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlanDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plans, revisions] = await Promise.all([
    db()`SELECT p.*, r.period_start, r.period_end FROM plan p LEFT JOIN review r ON r.id=p.carried_from_review_id WHERE p.id=${id}`,
    db()`SELECT * FROM plan_revision WHERE plan_id=${id} ORDER BY revised_at DESC, id DESC`
  ]);
  const plan = plans[0]; if (!plan) notFound();
  const start = dateOnly(plan.start_date as Date);
  const end = dateOnly(plan.end_date as Date);

  return <div className="workspace-page">
    <section className="workspace-heading">
      <div><span className="eyebrow">PLAN DETAIL</span><h1>{String(plan.title)}</h1><p className="page-lead">{start.replaceAll("-", ".")} – {end.replaceAll("-", ".")}</p></div>
      <div className="planner-summary" aria-label="계획 정보"><span>우선순위 <strong>{priorityLabel(Number(plan.priority))}</strong></span><span><strong>{Number(plan.estimate_minutes ?? 0)}</strong>분 예상</span><span><strong>{revisions.length}</strong>회 수정</span></div>
    </section>

    {plan.carried_from_review_id && <p className="notice">이 계획은 {dateOnly(plan.period_start as Date)}~{dateOnly(plan.period_end as Date)} 돌아보기에서 넘어왔습니다.</p>}
    <section className="criteria-panel"><span className="section-kicker">SUCCESS CRITERIA</span><h2>성공 기준</h2><p>{String(plan.success_criteria)}</p></section>

    <details className="panel create-panel"><summary>계획 내용 고치기</summary><form action={`/api/plans/${plan.id}?_method=PATCH`} method="post">
      <label>제목<input name="title" required defaultValue={String(plan.title)} /></label>
      <div className="inline"><label>시작일<input type="date" name="start_date" required defaultValue={start} /></label><label>종료일<input type="date" name="end_date" required defaultValue={end} /></label></div>
      <div className="inline"><label>우선순위<select name="priority" defaultValue={String(plan.priority)}><option value="3">높음</option><option value="2">보통</option><option value="1">낮음</option></select></label><label>예상 시간(분)<input type="number" name="estimate_minutes" min="0" defaultValue={Number(plan.estimate_minutes ?? 0)} /></label></div>
      <label>성공 기준<textarea name="success_criteria" required defaultValue={String(plan.success_criteria)} /></label><button>수정 저장</button>
    </form></details>

    <section className="workspace-section"><div className="section-heading"><div><span className="section-kicker">HISTORY</span><h2>수정 이력</h2></div><span className="badge">{revisions.length}건</span></div>{revisions.length ? <div className="table-wrap"><table><thead><tr><th>수정 시각</th><th>고치기 전 제목</th><th>기간</th><th>예상</th></tr></thead><tbody>{revisions.map((revision) => <tr key={String(revision.id)}><td>{seoulDateTime(String(revision.revised_at))}</td><td>{String(revision.title)}</td><td>{dateOnly(revision.start_date as Date)} ~ {dateOnly(revision.end_date as Date)}</td><td>{Number(revision.estimate_minutes ?? 0)}분</td></tr>)}</tbody></table></div> : <div className="empty-state compact"><span>아직 수정 이력이 없습니다.</span></div>}</section>

    <form className="danger-zone" action={`/api/plans/${plan.id}?_method=DELETE`} method="post"><div><strong>계획 삭제</strong><span>연결된 할 일이 있으면 삭제할 수 없습니다.</span></div><button className="danger">계획 삭제</button></form>
  </div>;
}
