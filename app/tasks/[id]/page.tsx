import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dateOnly, priorityLabel, seoulDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tasks, runs] = await Promise.all([
    db()`SELECT t.*, p.title AS plan_title, c.completed_at FROM task t JOIN plan p ON p.id=t.plan_id LEFT JOIN task_completion c ON c.task_id=t.id WHERE t.id=${id} AND t.deleted_at IS NULL`,
    db()`SELECT * FROM run_log WHERE task_id=${id} ORDER BY started_at DESC, id DESC`
  ]);
  const task = tasks[0]; if (!task) notFound();
  const actualTotal = runs.reduce((sum, run) => sum + Number(run.actual_minutes), 0);

  return <div className="workspace-page">
    <section className="workspace-heading">
      <div><span className="eyebrow">TASK DETAIL</span><h1>{String(task.title)}</h1><p className="page-lead">{String(task.plan_title)}</p></div>
      <div className="planner-summary" aria-label="할 일 정보"><span>마감 <strong>{task.due_date ? dateOnly(task.due_date as Date).replaceAll("-", ".") : "없음"}</strong></span><span>우선순위 <strong>{priorityLabel(Number(task.priority))}</strong></span><span><strong>{Number(task.estimate_minutes ?? 0)}</strong>분 예상</span><span><strong>{actualTotal}</strong>분 실제</span></div>
    </section>

    <section className="task-detail-note"><div><span className={`badge ${task.completed_at ? "" : "pending"}`}>{task.completed_at ? "완료" : "진행 중"}</span><p>{String(task.note ?? "메모가 없습니다.")}</p></div><form className="primary-action" action={`/api/tasks/${task.id}/completion${task.completed_at ? "?_method=DELETE" : ""}`} method="post"><button>{task.completed_at ? "완료 되돌리기" : "완료하기"}</button></form></section>

    <details className="panel create-panel"><summary>할 일 내용 고치기</summary><form action={`/api/tasks/${task.id}?_method=PATCH`} method="post"><label>제목<input name="title" required defaultValue={String(task.title)} /></label><label>메모<textarea name="note" defaultValue={String(task.note ?? "")} /></label><div className="inline"><label>마감일<input type="date" name="due_date" defaultValue={task.due_date ? dateOnly(task.due_date as Date) : ""} /></label><label>우선순위<select name="priority" defaultValue={String(task.priority)}><option value="3">높음</option><option value="2">보통</option><option value="1">낮음</option></select></label><label>예상 시간(분)<input type="number" name="estimate_minutes" min="0" defaultValue={Number(task.estimate_minutes ?? 0)} /></label></div><label>태그(쉼표로 구분)<input name="tags" defaultValue={(task.tags as string[]).join(", ")} /></label><button>수정 저장</button></form></details>

    <form className="run-panel" action={`/api/tasks/${task.id}/runs`} method="post"><div className="section-heading"><div><span className="section-kicker">DO LOG</span><h2>실제로 한 일 기록</h2></div><span className="badge">분 단위</span></div><div className="inline"><label>시작 시각<input type="datetime-local" name="started_at" required /></label><label>끝난 시각<input type="datetime-local" name="ended_at" /></label><label>실제 시간(분)<input type="number" min="0" name="actual_minutes" required /></label></div><label>막힌 이유<textarea name="blocker_reason" /></label><button>실행 기록 저장</button></form>

    <section className="workspace-section"><div className="section-heading"><div><span className="section-kicker">RUN HISTORY</span><h2>실행 기록</h2></div><span className="badge">{runs.length}건 · {actualTotal}분</span></div>{runs.length ? <div className="table-wrap"><table><thead><tr><th>시작</th><th>끝</th><th>실제</th><th>막힘</th></tr></thead><tbody>{runs.map((run) => <tr key={String(run.id)}><td>{seoulDateTime(String(run.started_at))}</td><td>{run.ended_at ? seoulDateTime(String(run.ended_at)) : "진행 중"}</td><td>{Number(run.actual_minutes)}분</td><td>{String(run.blocker_reason ?? "없음")}</td></tr>)}</tbody></table></div> : <div className="empty-state compact"><span>아직 실행 기록이 없습니다.</span></div>}</section>

    <form className="danger-zone" action={`/api/tasks/${task.id}?_method=DELETE`} method="post"><div><strong>할 일 지우기</strong><span>삭제한 할 일은 집계에서 제외됩니다.</span></div><button className="danger">할 일 지우기</button></form>
  </div>;
}
