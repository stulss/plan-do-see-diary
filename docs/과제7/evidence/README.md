# 과제 7 스크린샷 증거 색인

T07-E 화면은 2026-09-02, T07-A 화면은 2026-09-03에 PC 환경에서 촬영했다. 비밀번호·세션 토큰·DB 접속 문자열은 어느 이미지에도 넣지 않았다.

**최종 제출용 화면은 공개 배포 앱·Postman·실제 DB 화면만 사용한다.** GitHub 문서/JSON 화면과 정적 요약 이미지는 이력 확인용으로 보존하되 제출 증거에서는 제외한다.

카드 1~5의 통과 기준별 상세 연결은 [`카드1-5_통과기준_스크린샷.md`](카드1-5_통과기준_스크린샷.md)에서 확인한다. 카드 1~4는 실제 화면 증거 연결을 완료했고, 카드 5는 C132 손계산 대조 화면 1건만 남았다.

## 자체 점검 7줄의 실제 화면 연결

| # | 자체 점검 내용 | 실제 화면 증거 | 판정 |
|---|---|---|---|
| 1 | 가입·로그인·로그아웃, 미로그인 자료 화면 차단 | `T07-E03-signup-pc.jpg`, `T07-E02-login-pc.jpg`, `T07-E08-planner-day-pc.jpg`의 로그아웃 버튼, `T07-A01-unauthenticated-tasks-redirect-pc.jpg` | ☑ |
| 2 | 저장된 비밀번호에 입력 글자가 보이지 않음 | `T07-A08-auth-owner-db-summary-pc.png` — 실제 DB의 `$2b$12$` 형식·60자·평문 아님 | ☑ |
| 3 | 로그아웃 뒤 같은 요청 거절 | `T07-A13-postman-logout-200-pc.png`, `T07-A14-postman-after-logout-401-pc.png` | ☑ |
| 4 | 남의 자료 읽기·수정·삭제 양방향 거절, 목록 유출 없음 | `T07-A22-postman-secondary-list-isolated-pc.png` — 한 방향 목록 격리 완료. 양방향 GET·PATCH·DELETE 실제 화면은 인계 | ◐ |
| 5 | 설명서 ①~⑥ 분리, ⑥ 내용 있음 | 문서 자체에서 확인. 문서 캡처는 제출 증거로 사용하지 않음 | ☑ 문서 |
| 6 | 서로 다른 실제 날짜 5일 기록과 3일차 전 규칙 변경 | `T07-A05-five-day-rule-change-actual-pc.jpg` — DB 할 일 생성일 5일, 규칙 변경 8/31 10:30:55, 3일차 생성 15:30:23 | ☑ 날짜 순서·사용자 원래 시각 확인. 실제 수치·손계산 증거는 별도 |
| 7 | 제출물에 비밀번호·토큰·비밀키 원문 없음 | Postman A10~A22 응답과 DB A08·A09에는 원문 없음. 저장소 스캔 결과는 문서로 기록 | ☑ |

## 제출용 스크린샷

| 파일 | 확인 내용 | 연결 기준 |
|---|---|---|
| `T07-E01-public-entry-pc.jpg` | 공개 첫 화면, 로그인·회원가입 선택 | C01, C03 |
| `T07-E02-login-pc.jpg` | 아이디·비밀번호 로그인, 계정 찾기 링크 | C95, C97, C99 |
| `T07-E03-signup-pc.jpg` | 아이디·닉네임·이메일·비밀번호 가입 화면 | C94, C98 |
| `T07-E04-recover-pc.jpg` | 아이디 찾기·비밀번호 복구 화면 | 인증 보조 증거 |
| `T07-E05-auth-session-results-pc.jpg` | 가입 201, 중복 409, 미로그인 401, bcrypt, 로그아웃·비밀번호 변경 뒤 세션 폐기 | C94~C115 |
| `T07-E06-isolation-results-pc.jpg` | 양방향 읽기·수정·삭제·날짜 이동 404, 목록 유출 0, 상대 자료 불변 | C116~C126 |
| `T07-E07-export-quality-results-pc.jpg` | 내보내기·계정 삭제 자동 검증 당시 결과(현재 자동 검사는 28건) | C133, C134 |
| `T07-E08-planner-day-pc.jpg` | 로그인 계정의 일간 플래너와 빠른 추가 | 플래너 화면 증거 |
| `T07-E09-planner-week-pc.jpg` | 주간 플래너, 날짜별 할 일, 드래그 안내 | C27 및 사용 화면 증거 |
| `T07-E10-planner-month-pc.jpg` | 월간 플래너와 날짜별 할 일 | 사용 화면 증거 |
| `T07-E11-plans-pc.jpg` | 계획 목록·새 계획 만들기 | 계획 화면 증거 |
| `T07-E12-plan-detail-pc.jpg` | 계획 성공 기준과 DB 트리거 수정 이력 | 계획 수정 이력 증거 |
| `T07-E13-tasks-pc.jpg` | 할 일 목록, 기간·예상·실제 분, 검색·거르기 | 할 일 화면 증거 |
| `T07-E14-task-detail-pc.jpg` | 시작·종료 시각 자동 계산, 실행 기록 입력 | 시간 자동 계산 증거 |
| `T07-E15-review-pc.jpg` | 조회 기간의 계획·완료·지연·막힘·예상·실제·차이 | C132 화면 증거(손계산 대조 대기) |
| `T07-E16-account-pc.jpg` | 닉네임, 비밀번호 변경, 내보내기, 연쇄 삭제 안내 | C133, C134 |
| `T07-E17-documents-submission-pc.jpg` | 정적 문서 요약 화면 — 보존만 하고 제출 제외 | 참고 이력 |
| `T07-A01-unauthenticated-tasks-redirect-pc.jpg` | 로그아웃 상태에서 `/tasks` 접근 시 실제 로그인 화면으로 이동 | C97, C124 |
| `T07-A02-auth-isolation-actual-github-pc.jpg` | GitHub JSON 화면 — 보존만 하고 제출 제외 | 참고 이력 |
| `T07-A03-auth-guide-six-sections-actual-github-pc.jpg` | GitHub 문서 화면 — 보존만 하고 제출 제외 | 참고 이력 |
| `T07-A04-password-secret-scan-actual-github-pc.jpg` | GitHub 검증 화면 — 보존만 하고 제출 제외 | 참고 이력 |
| `T07-A05-five-day-rule-change-actual-pc.jpg` | DB의 5일 할 일 생성 시각과 2일차 뒤·3일차 앞 60분→90분 규칙 변경 순서 | C07, C10~C12 |
| `T07-A06-plan-revision-actual-db-pc.png` | Vercel Supabase 데이터 편집기의 실제 `plan_revision` 행과 서울 수정 시각 | C10~C12 |
| `T07-A07-five-day-tasks-actual-db-pc.png` | Vercel Supabase 데이터 편집기의 실제 `task` 5행과 서로 다른 서울 생성일 | C07 |
| `T07-A08-auth-owner-db-summary-pc.png` | 읽기 전용 실제 DB 결과: bcrypt 형식·60자·평문 아님, 세션 SHA-256 길이·만료, 소유자 미귀속 0건, 서울 5일, 수정 시각 | C100, C103, C111, C07, C10 |
| `T07-A09-database-schema-actual-pc.png` | 실제 DB 스키마 관계도: `app_user`, `user_session`, `plan`, `task`, `review`, `run_log`, `task_completion`, `plan_revision` | C100, C108, C111, C123 |
| `T07-A10-postman-unauthenticated-401-pc.png` | Postman의 미로그인 `GET /api/tasks` 요청과 401 응답 | C97, C124 |
| `T07-A11-postman-login-id-duplicate-pc.png` | Postman의 아이디 중복 확인 요청 본문과 `available: false` 응답 | C98 |
| `T07-A12-postman-login-200-pc.png` | 기존 테스트 계정 로그인 요청의 200 응답과 비밀번호 없는 사용자 DTO | C95, C105~C106 |
| `T07-A13-postman-logout-200-pc.png` | Postman의 빈 로그아웃 요청 본문과 `signedOut: true` 응답 | C96, C109 |
| `T07-A14-postman-after-logout-401-pc.png` | 로그아웃 뒤 `GET /api/tasks`를 다시 보낸 401 응답 | C96, C109, C124 |
| `T07-A15-postman-missing-id-401-pc.png` | 존재하지 않는 아이디와 가린 비밀번호 요청 본문, 공통 401 안내 | C99 |
| `T07-A16-postman-wrong-password-401-pc.png` | 기존 아이디와 가린 틀린 비밀번호 요청 본문, 동일한 401 안내 | C99 |
| `T07-A18-postman-task-dto-200-pc.png` | 공개 배포의 인증된 할 일 목록 200, 내부 `user_id`·`deleted_at` 미노출 | C105~C106, C125 |
| `T07-A19-postman-secondary-signup-201-pc.png` | 두 번째 증거 계정 가입 요청 본문(비밀번호 `<masked>`)과 사용자 DTO 201 | C94, C105, C116 |
| `T07-A20-postman-secondary-plan-201-pc.png` | 두 번째 계정의 계획 생성 본문과 안전한 계획 DTO 201 | C116 |
| `T07-A21-postman-secondary-task-201-pc.png` | 두 번째 계정의 할 일 생성 본문, 30분 자동 계산과 안전한 할 일 DTO 201 | C116 |
| `T07-A22-postman-secondary-list-isolated-pc.png` | 두 번째 계정 목록에 본인 할 일만 1건 표시되고 내부 소유자 필드가 없는 200 응답 | C125 |

## Postman 요청 본문 촬영 원칙

- 아이디 중복 확인, 빈 로그아웃 요청, 실패 로그인 두 건은 요청 본문이 보이도록 촬영했다.
- 성공 로그인에는 실제 테스트 계정을 사용했지만 비밀번호가 든 본문 탭은 촬영하지 않았다. 실패 로그인과 두 번째 계정 가입 화면의 비밀번호는 `<masked>`로 처리했다.
- 응답에는 비밀번호·세션 토큰·쿠키가 없으며 Postman 화면에도 해당 원문을 노출하지 않았다.
- 양방향 격리 증거 보강을 위해 두 번째 증거 계정과 계획·할 일을 만들었다. 사용자 지시에 따라 **삭제하지 않고 보존**한다.

## Claude 인계 — 아직 촬영할 실제 화면

- 두 계정 방향 모두에서 타 계정 할 일 GET·PATCH·DELETE 404와 목록 유출 0건을 Postman으로 촬영한다.
- 거절 검증 전후 두 증거 할 일이 그대로임을 실제 DB 화면으로 촬영한다.
- 요청 본문은 보이되 비밀번호·쿠키·토큰은 반드시 가린다.
- C132의 실제 분·오차율과 손계산 대조 화면을 추가한다.

증거 계정(id 36), 계획(id 28), 할 일(id 36)은 위 검증을 위해 보존한다. 비밀번호 원문은 어떤 문서에도 기록하지 않는다.

## DB 화면으로 교체한 증거

| 기존 증거                                               | DB 화면을 우선 사용하는 항목                              | 유지 이유                                         |
| --------------------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `T07-E05-auth-session-results-pc.jpg`               | 비밀번호 저장·세션 구조는 `T07-A08`, `T07-A09` 우선         | 가입·로그아웃 뒤 요청 거절은 API 동작이라 E05·A02 유지          |
| `T07-E06-isolation-results-pc.jpg`                  | 소유자 컬럼·미귀속 0건은 `T07-A08`, `T07-A09` 우선         | 양방향 읽기·수정·삭제 404는 DB 사진만으로 증명할 수 없어 A02 유지    |
| `T07-A04-password-secret-scan-actual-github-pc.jpg` | bcrypt 저장 형태는 `T07-A08` 우선                     | Git 이력·추적 파일의 비밀값 0건은 DB 사진으로 증명할 수 없어 A04 유지 |
| `T07-A05-five-day-rule-change-actual-pc.jpg`        | 원자료는 `T07-A06`, `T07-A07`, DB 요약은 `T07-A08` 우선 | 날짜와 규칙 변경의 한눈 비교용 보조 화면으로 유지                  |

## 화면이 아닌 원본 검증 자료

- `auth-isolation-results.json`: 자격증명과 세션 값을 기록하지 않은 공개 배포 자동 검증 원본
- `T07-검증결과-화면.html`: E05~E07·E17 화면을 다시 만들 수 있는 정적 원본
- `실제_보안검증_결과.md`: 2026-09-03 실제 DB 읽기·비밀값 비교 결과 원본
- `5일_규칙변경_DB결과.md`: 5일 생성 시각과 규칙 변경 순서만 모은 공개 원본

## 실제 5일 사용 뒤 추가할 증거

아래는 사용자가 실제 기록을 완료해야 하므로 현재 증거를 만들지 않았다.

| 기준   | 추가할 증거                              |
| ---- | ----------------------------------- |
| C132 | 5일 화면 합계·평균과 `5일_사용기록.md` 손계산 대조 화면 |

`app_user`와 `user_session` 원본 행은 이메일·비밀번호 해시 전체·세션 해시가 노출될 수 있어 직접 촬영하지 않는다. 대신 실제 DB의 읽기 전용 집계 결과인 `T07-A08`과 값 없는 스키마 관계도 `T07-A09`를 제출한다.

## 이전 촬영본

`T07-C03-login-local-pc.png`, `T07-C03-login-production-pc.png`, `T07-public-entry-pc.png`, `T07-planner-drag-pc.png`는 이전 단계 증거로 보존한다. `T07-A02`~`A04`와 `T07-E17`은 GitHub 문서/검증 자료 또는 정적 요약 화면이므로 제출 대상에서 제외하고, 공개 앱·Postman·DB 실제 화면으로 대체한다.
