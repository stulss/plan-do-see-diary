-- 과제 7: 인증. 과제 6 스키마(schema.sql) 위에 이어서 적용한다.
-- 과제 6 DB 를 그대로 쓰므로 순서를 지켜야 과제 6 배포가 깨지지 않는다.

-- 계정. 로그인은 login_id 로, 화면 표시는 nickname 으로 한다.
-- 이메일은 나중에 비밀번호 찾기와 소셜 계정 연결에 쓰려고 함께 받는다.
CREATE TABLE app_user (
  id            bigserial PRIMARY KEY,
  login_id      text NOT NULL CHECK (length(btrim(login_id)) > 0),
  nickname      text NOT NULL CHECK (length(btrim(nickname)) > 0),
  email         text NOT NULL CHECK (length(btrim(email)) > 0),
  password_hash text NOT NULL,          -- bcrypt 해시. 원문은 어디에도 저장하지 않는다.
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 화면의 중복확인은 편의일 뿐이고, 실제로 중복을 막는 것은 이 세 인덱스다.
-- 확인과 제출 사이에 남이 먼저 가입하는 경우까지 여기서 걸린다.
CREATE UNIQUE INDEX app_user_login_id_key ON app_user (lower(login_id));
CREATE UNIQUE INDEX app_user_nickname_key ON app_user (lower(nickname));
CREATE UNIQUE INDEX app_user_email_key    ON app_user (lower(email));

-- 세션. 쿠키에는 난수 원문이, 이 표에는 그 값의 SHA-256 해시만 들어간다.
-- DB 가 통째로 유출돼도 저장된 값만으로는 남의 세션을 흉내 낼 수 없다.
-- 로그아웃은 이 행을 지우는 것이며, 그래서 이전 쿠키 값이 즉시 무효가 된다.
CREATE TABLE user_session (
  token_hash text   PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_session_user_idx ON user_session (user_id);

-- 1) 소유자 컬럼을 NULL 허용으로 먼저 추가한다. 이 시점에도 과제 6 앱은 그대로 동작한다.
ALTER TABLE plan   ADD COLUMN user_id bigint REFERENCES app_user(id) ON DELETE CASCADE;
ALTER TABLE task   ADD COLUMN user_id bigint REFERENCES app_user(id) ON DELETE CASCADE;
ALTER TABLE review ADD COLUMN user_id bigint REFERENCES app_user(id) ON DELETE CASCADE;

-- 2) 화면에서 소유자 계정을 가입한 뒤 아래를 실행한다 (scripts/claim-owner.mjs 가 대신 해 준다).
--    과제 6에서 만든 기존 자료가 내 계정으로 옮겨진다 (T07-C100).
--
--    UPDATE plan   SET user_id = :owner_id WHERE user_id IS NULL;
--    UPDATE task   SET user_id = :owner_id WHERE user_id IS NULL;
--    UPDATE review SET user_id = :owner_id WHERE user_id IS NULL;
--
-- 3) 임시 호환 장치. 인증판을 배포하기 전까지 과제 6 앱이 user_id 없이 INSERT 해도
--    소유자에게 귀속되게 한다. 인증판 배포 후 반드시 DROP DEFAULT 한다.
--
--    ALTER TABLE plan   ALTER COLUMN user_id SET DEFAULT :owner_id;  (task, review 도 동일)
--
-- 4) 그 다음 NOT NULL 로 잠근다.
--
--    ALTER TABLE plan   ALTER COLUMN user_id SET NOT NULL;           (task, review 도 동일)

CREATE INDEX plan_user_idx   ON plan (user_id);
CREATE INDEX task_user_idx   ON task (user_id, due_date);
CREATE INDEX review_user_idx ON review (user_id);
