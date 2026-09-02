CREATE TABLE review (
  id bigserial PRIMARY KEY,
  period_start date NOT NULL,
  period_end date NOT NULL,
  next_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_start <= period_end)
);

-- Plan(계획)과 Do(실행)를 섞지 않는다. 예상 시간은 plan/task에,
-- 실제 시간은 아래 run_log에 따로 저장해야 계획 대비 실제 차이를 잃지 않는다.
CREATE TABLE plan (
  id bigserial PRIMARY KEY,
  title text NOT NULL CHECK (btrim(title) <> ''),
  start_date date NOT NULL,
  end_date date NOT NULL,
  priority smallint NOT NULL CHECK (priority BETWEEN 1 AND 3),
  success_criteria text NOT NULL CHECK (btrim(success_criteria) <> ''),
  estimate_minutes integer CHECK (estimate_minutes >= 0),
  carried_from_review_id bigint REFERENCES review(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date <= end_date)
);

-- 계획을 고치기 직전의 값을 보관하는 감사 이력 표다.
-- 애플리케이션이 아니라 DB 트리거가 기록하므로 어떤 수정 경로에서도 빠지지 않는다.
CREATE TABLE plan_revision (
  id bigserial PRIMARY KEY,
  plan_id bigint NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  priority smallint NOT NULL,
  success_criteria text NOT NULL,
  estimate_minutes integer,
  revised_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION save_plan_revision() RETURNS trigger AS $$
BEGIN
  INSERT INTO plan_revision (
    plan_id, title, start_date, end_date, priority, success_criteria, estimate_minutes
  ) VALUES (
    OLD.id, OLD.title, OLD.start_date, OLD.end_date, OLD.priority,
    OLD.success_criteria, OLD.estimate_minutes
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_revision_before_update
BEFORE UPDATE ON plan
FOR EACH ROW EXECUTE FUNCTION save_plan_revision();

-- 할 일은 실제로 삭제하지 않고 deleted_at만 채운다.
-- 목록과 집계는 deleted_at IS NULL인 행만 사용한다.
CREATE TABLE task (
  id bigserial PRIMARY KEY,
  plan_id bigint NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (btrim(title) <> ''),
  note text,
  due_date date,
  start_minute integer CONSTRAINT task_start_minute_range CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute integer CONSTRAINT task_end_minute_range CHECK (end_minute BETWEEN 1 AND 1439),
  priority smallint NOT NULL CHECK (priority BETWEEN 1 AND 3),
  tags text[] NOT NULL DEFAULT '{}',
  estimate_minutes integer CHECK (estimate_minutes >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT task_schedule_pair CHECK (
    (start_minute IS NULL AND end_minute IS NULL)
    OR (start_minute IS NOT NULL AND end_minute IS NOT NULL
      AND end_minute > start_minute AND estimate_minutes = end_minute - start_minute)
  )
);

-- task_id 자체가 기본키라서 완료 요청을 연속으로 보내도 한 행만 존재할 수 있다.
CREATE TABLE task_completion (
  task_id bigint PRIMARY KEY REFERENCES task(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- 실행 기록을 추가할 때 plan/task의 예상 시간은 절대 수정하지 않는다.
CREATE TABLE run_log (
  id bigserial PRIMARY KEY,
  task_id bigint NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  actual_minutes integer NOT NULL CHECK (actual_minutes >= 0),
  blocker_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- 화면의 기본 정렬(마감일 → 우선순위 → ID)과 활성 할 일 조회를 함께 돕는다.
CREATE INDEX task_active_due_idx ON task (due_date, priority DESC, id) WHERE deleted_at IS NULL;
CREATE INDEX run_log_task_idx ON run_log (task_id);
