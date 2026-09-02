// 내보내기와 API 응답에 나갈 필드를 화이트리스트로 고정한다.
// 표에 컬럼이 새로 생겨도 여기에 적지 않으면 응답에 실려 나가지 않는다.
type Row = Record<string, unknown>;
const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.map((key) => [key, row[key]]));

export const publicPlan = (row: Row) =>
  pick(row, ["id", "title", "start_date", "end_date", "priority", "success_criteria",
    "estimate_minutes", "carried_from_review_id", "created_at", "updated_at"]);

export const publicPlanRevision = (row: Row) =>
  pick(row, ["id", "plan_id", "title", "start_date", "end_date", "priority",
    "success_criteria", "estimate_minutes", "revised_at"]);

export const publicTask = (row: Row) =>
  pick(row, ["id", "plan_id", "title", "note", "due_date", "priority", "tags",
    "start_minute", "end_minute", "estimate_minutes", "created_at", "updated_at", "deleted_at"]);

export const publicCompletion = (row: Row) => pick(row, ["task_id", "completed_at"]);

export const publicRun = (row: Row) =>
  pick(row, ["id", "task_id", "started_at", "ended_at", "actual_minutes", "blocker_reason", "created_at"]);

export const publicReview = (row: Row) =>
  pick(row, ["id", "period_start", "period_end", "next_action", "created_at"]);
