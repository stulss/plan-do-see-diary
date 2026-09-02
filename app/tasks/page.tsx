import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";
import { buildTaskWhere, metricLabel, Metric, TaskFilter } from "@/lib/domain/query";
import { dateOnly, priorityLabel } from "@/lib/format";
import { CreateTaskForm, PlanOption } from "@/app/create-forms";
import { clockText } from "@/lib/domain/time";

export const dynamic = "force-dynamic";

type Search = { from?: string; to?: string; metric?: Metric; q?: string; status?: "done" | "open"; priority?: string; tag?: string };

export default async function TasksPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requirePageUser();
  const query = await searchParams;
  const filter: TaskFilter = query;
  const where = buildTaskWhere(user.id, filter);
  const [tasks, plans] = await Promise.all([
    db().unsafe(`SELECT t.*, p.title AS plan_title, c.completed_at, COALESCE((SELECT SUM(r.actual_minutes) FROM run_log r WHERE r.task_id=t.id), 0)::int AS actual_minutes FROM task t JOIN plan p ON p.id=t.plan_id LEFT JOIN task_completion c ON c.task_id=t.id WHERE ${where.text} ORDER BY t.due_date ASC NULLS LAST, t.priority DESC, t.id ASC`, where.values),
    db()`SELECT id, title FROM plan WHERE user_id=${user.id} ORDER BY start_date DESC, id DESC`
  ]);
  const estimateTotal = tasks.reduce((sum, task) => sum + Number(task.estimate_minutes ?? 0), 0);
  const actualTotal = tasks.reduce((sum, task) => sum + Number(task.actual_minutes ?? 0), 0);
  const doneCount = tasks.filter((task) => task.completed_at).length;
  // 시간 카드에서 넘어온 경우에는 건수 대신 목록의 시간 합계를 다시 보여준다.
  // 따라서 돌아보기 카드의 숫자와 이 화면의 근거 합계를 바로 대조할 수 있다.
  const metricValue = query.metric === "estimate" ? `${estimateTotal}분` : query.metric === "actual" ? `${actualTotal}분` : query.metric === "diff" ? `${actualTotal - estimateTotal}분` : `${tasks.length}건`;

  return <div className="workspace-page">
    <section className="workspace-heading">
      <div><span className="eyebrow">DO</span><h1>할 일</h1><p className="page-lead">해야 할 일과 실제 시간을 비교하며 실행에 집중하세요.</p></div>
      <div className="planner-summary" aria-label="할 일 요약"><span><strong>{tasks.length - doneCount}</strong> 진행 중</span><span><strong>{doneCount}</strong> 완료</span><span><strong>{estimateTotal}</strong>분 예상</span><span><strong>{actualTotal}</strong>분 실제</span></div>
    </section>

    {query.from && query.to && <p className="notice">{query.from}~{query.to} 기간의 {metricLabel(query.metric)} {metricValue}</p>}

    <form className="filter-panel" method="get"><div className="filter-heading"><div><span className="section-kicker">FILTER</span><h2>검색·거르기</h2></div><span>마감일 → 우선순위 → 등록 순</span></div><div className="filter-grid">
      <label>제목·메모<input name="q" defaultValue={query.q} placeholder="검색어" /></label>
      <label>상태<select name="status" defaultValue={query.status ?? ""}><option value="">전체</option><option value="open">진행 중</option><option value="done">완료</option></select></label>
      <label>우선순위<select name="priority" defaultValue={query.priority ?? ""}><option value="">전체</option><option value="3">높음</option><option value="2">보통</option><option value="1">낮음</option></select></label>
      <label>태그<input name="tag" defaultValue={query.tag} placeholder="태그" /></label><button>조건 적용</button>
    </div></form>

    <CreateTaskForm plans={plans as unknown as PlanOption[]} />

    <section className="workspace-section">
      <div className="section-heading"><div><span className="section-kicker">TASK LIST</span><h2>할 일 목록</h2></div><span className="badge">{tasks.length}건</span></div>
      {tasks.length ? <div className="task-board">{tasks.map((task) => {
        const estimate = Number(task.estimate_minutes ?? 0);
        const actual = Number(task.actual_minutes ?? 0);
        const diff = actual - estimate;
        const plannedTime = task.start_minute == null || task.end_minute == null
          ? "시간 미지정"
          : `${clockText(Number(task.start_minute))}–${clockText(Number(task.end_minute))}`;
        return <article className={`task-row priority-${Number(task.priority)} ${task.completed_at ? "is-done" : ""}`} key={String(task.id)}>
          <div className="task-row-main"><Link href={`/tasks/${task.id}`}>{String(task.title)}</Link><span>{String(task.plan_title)}</span></div>
          <div className="task-fact"><small>마감</small><span>{task.due_date ? dateOnly(task.due_date as Date).replaceAll("-", ".") : "없음"}</span></div>
          <div className="task-fact"><small>시간</small><span>{plannedTime}</span><span>{estimate}분 → {actual}분</span><em className={diff > 0 ? "over" : ""}>{diff > 0 ? "+" : ""}{diff}분</em></div>
          <div className="task-state"><span className={`badge ${task.completed_at ? "" : "pending"}`}>{task.completed_at ? "완료" : "진행 중"}</span><small>우선순위 {priorityLabel(Number(task.priority))}</small></div>
          <form className="compact-action" action={`/api/tasks/${task.id}/completion${task.completed_at ? "?_method=DELETE" : ""}`} method="post"><button>{task.completed_at ? "되돌리기" : "완료"}</button></form>
        </article>;
      })}</div> : <div className="empty-state"><strong>조건에 맞는 할 일이 없습니다.</strong><span>검색 조건을 바꾸거나 새 할 일을 만들어 보세요.</span></div>}
    </section>
  </div>;
}
