export type Metric = "planned" | "done" | "overdue" | "blocked" | "estimate" | "actual" | "diff";

export interface TaskFilter {
  from?: string;
  to?: string;
  metric?: Metric;
  q?: string;
  status?: "done" | "open";
  priority?: string;
  tag?: string;
}

export function buildTaskWhere(filter: TaskFilter, alias = "t") {
  // 돌아보기 숫자와 숫자를 눌러 도착한 목록이 반드시 같은 대상 집합을 쓰도록
  // 모든 할 일 조건을 이 함수 한 곳에서 만든다.
  const clauses = [`${alias}.deleted_at IS NULL`];
  const values: string[] = [];
  const add = (sql: string, value: string) => {
    values.push(value);
    clauses.push(sql.replace("?", `$${values.length}`));
  };

  if (filter.from) add(`${alias}.due_date >= ?::date`, filter.from);
  if (filter.to) add(`${alias}.due_date <= ?::date`, filter.to);
  if (filter.q) add(`(${alias}.title ILIKE '%' || ? || '%' OR COALESCE(${alias}.note, '') ILIKE '%' || $${values.length + 1} || '%')`, filter.q);
  if (filter.priority) add(`${alias}.priority = ?::smallint`, filter.priority);
  if (filter.tag) add(`? = ANY(${alias}.tags)`, filter.tag);

  const metric = filter.metric;
  if (filter.status === "done" || metric === "done") clauses.push(`EXISTS (SELECT 1 FROM task_completion c WHERE c.task_id = ${alias}.id)`);
  if (filter.status === "open") clauses.push(`NOT EXISTS (SELECT 1 FROM task_completion c WHERE c.task_id = ${alias}.id)`);
  if (metric === "overdue") clauses.push(`NOT EXISTS (SELECT 1 FROM task_completion c WHERE c.task_id = ${alias}.id) AND ${alias}.due_date < (now() AT TIME ZONE 'Asia/Seoul')::date`);
  if (metric === "blocked") clauses.push(`EXISTS (SELECT 1 FROM run_log r WHERE r.task_id = ${alias}.id AND NULLIF(btrim(r.blocker_reason), '') IS NOT NULL)`);

  return { text: clauses.join(" AND "), values };
}

export function metricLabel(metric?: Metric) {
  return { planned: "계획", done: "완료", overdue: "지연", blocked: "막힘", estimate: "예상 시간", actual: "실제 시간", diff: "시간 차이" }[metric ?? "planned"];
}
