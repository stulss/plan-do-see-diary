import { TaskTimeFields } from "@/app/time-range-fields";

export interface PlanOption {
  id: string | number;
  title: string;
}

export function CreatePlanForm({ review = "", title = "", defaultDate }: { review?: string; title?: string; defaultDate?: string }) {
  return <details className="panel create-panel" open={Boolean(review)}><summary><span><strong>새 계획 만들기</strong><small>기간과 성공 기준부터 정합니다.</small></span></summary><form className="editor-form" action="/api/plans" method="post">
    <div className="editor-intro"><span className="section-kicker">NEW PLAN</span><h2>무엇을, 언제까지 해낼까요?</h2><p>성공 여부를 나중에 판단할 수 있도록 기준을 구체적으로 적으세요.</p></div>
    <input type="hidden" name="carried_from_review_id" value={review} />
    {review && <p className="notice">돌아보기에서 고친 점을 가져왔습니다.</p>}
    <div className="editor-grid"><label className="wide">계획 제목<input name="title" required defaultValue={title} placeholder="한눈에 알아볼 수 있는 이름" /></label>
    <label>시작일<input type="date" name="start_date" required defaultValue={defaultDate} /></label><label>종료일<input type="date" name="end_date" required defaultValue={defaultDate} /></label>
    <label>우선순위<select name="priority" defaultValue="2"><option value="3">높음</option><option value="2">보통</option><option value="1">낮음</option></select></label><label>예상 시간(분)<input type="number" name="estimate_minutes" min="0" placeholder="0" /></label>
    <label className="wide">성공 기준<textarea name="success_criteria" required placeholder="어떤 상태가 되면 이 계획을 달성했다고 볼 수 있나요?" /></label></div><div className="editor-actions"><span>저장 후 계획 상세에서 할 일을 연결할 수 있습니다.</span><button>계획 저장</button></div>
  </form></details>;
}

export function CreateTaskForm({ plans, defaultDueDate }: { plans: PlanOption[]; defaultDueDate?: string }) {
  return <details className="panel create-panel"><summary><span><strong>새 할 일 만들기</strong><small>계획을 실행 가능한 한 단계로 나눕니다.</small></span></summary><form className="editor-form" action="/api/tasks" method="post">
    <div className="editor-intro"><span className="section-kicker">NEW TASK</span><h2>바로 실행할 한 가지는 무엇인가요?</h2><p>한 번에 끝낼 수 있는 크기로 적으면 완료 여부와 실제 시간을 비교하기 쉽습니다.</p></div>
    <div className="editor-grid"><label className="wide">연결할 계획<select name="plan_id" required defaultValue=""><option value="" disabled>계획 선택</option>{plans.map((plan) => <option key={String(plan.id)} value={String(plan.id)}>{String(plan.title)}</option>)}</select></label>
    <label className="wide">할 일 제목<input name="title" required placeholder="동사로 시작하는 구체적인 행동" /></label><label className="wide">메모<textarea name="note" placeholder="필요한 자료나 완료 조건" /></label>
    <label>할 날짜<input type="date" name="due_date" required defaultValue={defaultDueDate} /></label><label>우선순위<select name="priority" defaultValue="2"><option value="3">높음</option><option value="2">보통</option><option value="1">낮음</option></select></label><TaskTimeFields />
    <label>태그<input name="tags" placeholder="쉼표로 구분" /></label></div><div className="editor-actions"><span>{plans.length ? "저장 후 상세 화면에서 실행 기록을 남길 수 있습니다." : "먼저 계획을 하나 만들어야 합니다."}</span><button disabled={!plans.length}>할 일 저장</button></div>
  </form></details>;
}
