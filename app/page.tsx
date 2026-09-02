import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { dateOnly } from "@/lib/format";
import { CreatePlanForm, CreateTaskForm, PlanOption } from "@/app/create-forms";
import { DraggableTask, TaskDropZone } from "@/app/planner-dnd";
import { clockText } from "@/lib/domain/time";
import {
  getPlannerWindow,
  koreanWeekday,
  normalizeAnchor,
  normalizePlannerView,
  plannerPeriodLabel,
  PlannerView,
  shiftAnchor
} from "@/lib/domain/planner";

export const dynamic = "force-dynamic";

interface PlannerTask {
  id: string | number;
  title: string;
  due_date: string | Date;
  priority: number;
  estimate_minutes: number | null;
  start_minute: number | null;
  end_minute: number | null;
  actual_minutes: number;
  completed_at: string | Date | null;
  plan_title: string;
}

interface PlannerPlan extends PlanOption {
  id: string | number;
  title: string;
  start_date: string | Date;
  end_date: string | Date;
}

function seoulToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function plannerHref(view: PlannerView, date: string) {
  return `/?view=${view}&date=${date}`;
}

function TaskPill({ task, compact = false }: { task: PlannerTask; compact?: boolean }) {
  const time = task.start_minute === null || task.end_minute === null
    ? `시간 미지정 · 예상 ${Number(task.estimate_minutes ?? 0)}분`
    : `${clockText(task.start_minute)}–${clockText(task.end_minute)} · ${Number(task.estimate_minutes)}분`;
  return <DraggableTask taskId={String(task.id)}><Link className={`planner-task priority-${task.priority} ${task.completed_at ? "is-done" : ""}`} href={`/tasks/${task.id}`}>
    <span className="planner-task-title">{task.title}</span>
    <span className="planner-task-time">{time}</span>
    {!compact && <span className="planner-task-meta">{task.plan_title} · 실제 {Number(task.actual_minutes ?? 0)}분</span>}
  </Link></DraggableTask>;
}

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const user = await getSessionUser();
  if (!user) return <section className="landing">
    <div><span className="eyebrow">PLAN · DO · SEE</span><h1>계획하고, 실행하고,<br />돌아보는 하루</h1><p className="page-lead">내 일정과 기록은 로그인한 나에게만 보입니다.</p></div>
    <div className="landing-actions"><Link className="landing-primary" href="/login">로그인</Link><Link className="landing-secondary" href="/signup">회원가입</Link></div>
    <div className="landing-features"><span><strong>PLAN</strong> 계획과 할 일을 정리</span><span><strong>DO</strong> 시작·종료 시각으로 자동 계산</span><span><strong>SEE</strong> 예상과 실제를 비교</span></div>
  </section>;
  const query = await searchParams;
  const today = seoulToday();
  const view = normalizePlannerView(query.view);
  const anchor = normalizeAnchor(query.date, today);
  const plannerWindow = getPlannerWindow(view, anchor);

  const tasks = await db()`
    SELECT t.id, t.title, t.due_date, t.priority, t.estimate_minutes, t.start_minute, t.end_minute, COALESCE(p.title, '계획 없음') AS plan_title,
      c.completed_at,
      COALESCE((SELECT SUM(r.actual_minutes) FROM run_log r WHERE r.task_id=t.id), 0)::int AS actual_minutes
    FROM task t
    LEFT JOIN plan p ON p.id=t.plan_id
    LEFT JOIN task_completion c ON c.task_id=t.id
    WHERE t.user_id=${user.id} AND t.deleted_at IS NULL AND t.due_date BETWEEN ${plannerWindow.visibleStart} AND ${plannerWindow.visibleEnd}
    ORDER BY t.due_date ASC, t.priority DESC, t.id ASC` as unknown as PlannerTask[];
  const allPlans = await db()`SELECT id, title, start_date, end_date FROM plan WHERE user_id=${user.id} ORDER BY start_date DESC, id DESC` as unknown as PlannerPlan[];
  const undatedRows = await db()`SELECT COUNT(*)::int AS count FROM task WHERE user_id=${user.id} AND deleted_at IS NULL AND due_date IS NULL`;
  const plans = allPlans.filter((plan) => dateOnly(plan.start_date) <= plannerWindow.focusEnd && dateOnly(plan.end_date) >= plannerWindow.focusStart);

  // 세 보기에서 같은 날짜별 할 일 묶음을 공유해 숫자와 목록 조건이 어긋나지 않게 한다.
  const tasksByDate = new Map<string, PlannerTask[]>();
  for (const task of tasks) {
    const dueDate = dateOnly(task.due_date);
    tasksByDate.set(dueDate, [...(tasksByDate.get(dueDate) ?? []), task]);
  }
  const focusTasks = tasks.filter((task) => {
    const dueDate = dateOnly(task.due_date);
    return dueDate >= plannerWindow.focusStart && dueDate <= plannerWindow.focusEnd;
  });
  const doneCount = focusTasks.filter((task) => task.completed_at).length;
  const estimateMinutes = focusTasks.reduce((sum, task) => sum + Number(task.estimate_minutes ?? 0), 0);
  const actualMinutes = focusTasks.reduce((sum, task) => sum + Number(task.actual_minutes ?? 0), 0);
  const previous = shiftAnchor(view, anchor, -1);
  const next = shiftAnchor(view, anchor, 1);
  const periodLabel = plannerPeriodLabel(view, anchor, plannerWindow);

  return <>
    {/* 과제 7에서는 서버 세션의 사용자 ID로 모든 자료를 제한한다. */}
    <p className="notice">로그인한 계정의 자료만 보입니다. 공용 PC에서는 사용 후 로그아웃하세요.</p>

    <section className="planner-heading">
      <div><span className="eyebrow">PLAN · DO · SEE</span><h1>{periodLabel}</h1><p className="page-lead">기간을 바꿔 계획과 실제 기록을 한눈에 살펴보세요.</p></div>
      <div className="planner-summary" aria-label="기간 요약">
        <span><strong>{focusTasks.length}</strong> 할 일</span>
        <span><strong>{doneCount}</strong> 완료</span>
        <span><strong>{estimateMinutes}</strong>분 예상</span>
        <span><strong>{actualMinutes}</strong>분 실제</span>
      </div>
    </section>

    <div className="planner-toolbar">
      <div className="segmented" aria-label="플래너 보기">
        {(["day", "week", "month"] as PlannerView[]).map((item) => <Link key={item} className={view === item ? "active" : ""} href={plannerHref(item, anchor)}>{item === "day" ? "일간" : item === "week" ? "주간" : "월간"}</Link>)}
      </div>
      <div className="date-navigation" aria-label="기간 이동">
        <Link aria-label="이전 기간" href={plannerHref(view, previous)}>‹</Link>
        <Link className="today-link" href={plannerHref(view, today)}>오늘</Link>
        <Link aria-label="다음 기간" href={plannerHref(view, next)}>›</Link>
      </div>
    </div>
    <p className="drag-help">할 일을 원하는 날짜로 끌어 놓으세요. 키보드·모바일에서는 할 일 상세에서 날짜를 수정할 수 있습니다.</p>

    {plans.length > 0 && <div className="active-plans"><span>진행 계획</span>{plans.map((plan) => <Link key={String(plan.id)} href={`/plans/${plan.id}`}>{plan.title}</Link>)}</div>}

    <section className="planner-quick-add">
      <div className="quick-add-heading"><div><span className="section-kicker">QUICK ADD</span><h2>플래너에서 바로 추가</h2></div><span>{anchor.replaceAll("-", ".")} 날짜가 기본값으로 들어갑니다.</span></div>
      <div className="planner-create-grid"><CreatePlanForm defaultDate={anchor} /><CreateTaskForm plans={allPlans} defaultDueDate={anchor} /></div>
    </section>

    {view === "day" && <section className="day-view">
      <div className="day-date"><span>{anchor.slice(8)}</span><strong>{koreanWeekday(anchor, "long")}</strong><small>{anchor.slice(0, 7).replace("-", ".")}</small></div>
      <TaskDropZone date={anchor} className="day-agenda">
        <div className="agenda-heading"><h2>오늘의 할 일</h2><span className="badge">{focusTasks.length}건</span></div>
        {focusTasks.length ? focusTasks.map((task) => <TaskPill key={String(task.id)} task={task} />) : <div className="planner-empty"><strong>예정된 할 일이 없습니다.</strong><span>여유 시간을 다음 계획에 사용해 보세요.</span></div>}
      </TaskDropZone>
    </section>}

    {view === "week" && <section className="week-view">
      {plannerWindow.days.map((date) => {
        const dayTasks = tasksByDate.get(date) ?? [];
        return <TaskDropZone date={date} className={`week-day ${date === today ? "is-today" : ""}`} key={date}>
          <Link className="week-day-heading" href={plannerHref("day", date)}><span>{koreanWeekday(date)}</span><strong>{Number(date.slice(8))}</strong></Link>
          <div className="week-day-tasks">{dayTasks.length ? dayTasks.map((task) => <TaskPill key={String(task.id)} task={task} compact />) : <span className="empty-day">비어 있음</span>}</div>
        </TaskDropZone>;
      })}
    </section>}

    {view === "month" && <section className="month-view">
      <div className="month-weekdays">{["월", "화", "수", "목", "금", "토", "일"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="month-grid">{plannerWindow.days.map((date) => {
        const dayTasks = tasksByDate.get(date) ?? [];
        const outside = date.slice(0, 7) !== anchor.slice(0, 7);
        return <TaskDropZone date={date} className={`month-day ${outside ? "is-outside" : ""} ${date === today ? "is-today" : ""}`} key={date}>
          <Link className="month-date" href={plannerHref("day", date)}>{Number(date.slice(8))}</Link>
          <div>{dayTasks.slice(0, 3).map((task) => <TaskPill key={String(task.id)} task={task} compact />)}{dayTasks.length > 3 && <Link className="more-tasks" href={plannerHref("day", date)}>+{dayTasks.length - 3}개 더보기</Link>}</div>
        </TaskDropZone>;
      })}</div>
    </section>}

    <footer className="planner-footer"><Link href="/tasks">전체 할 일 관리</Link>{Number(undatedRows[0]?.count ?? 0) > 0 && <span>마감일 없는 할 일 {Number(undatedRows[0].count)}건</span>}</footer>
  </>;
}
