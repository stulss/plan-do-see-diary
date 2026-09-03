# 과제 7 스크린샷 증거 색인

T07-E 화면은 2026-09-02, T07-A 화면은 2026-09-03에 PC 환경에서 촬영했다. 비밀번호·세션 토큰·DB 접속 문자열은 어느 이미지에도 넣지 않았다.

2026-09-03에는 자체 점검 7줄을 **실제 앱 화면과 GitHub 실제 검증 원본 화면**에 다시 연결했다.

카드 1~5의 통과 기준별 상세 연결은 [`카드1-5_통과기준_스크린샷.md`](카드1-5_통과기준_스크린샷.md)에서 확인한다. 카드 1~4는 실제 화면 증거 연결을 완료했고, 카드 5는 C132 손계산 대조 화면 1건만 남았다.

## 자체 점검 7줄의 실제 화면 연결

| # | 자체 점검 내용 | 실제 화면 증거 | 판정 |
|---|---|---|---|
| 1 | 가입·로그인·로그아웃, 미로그인 자료 화면 차단 | `T07-E03-signup-pc.jpg`, `T07-E02-login-pc.jpg`, `T07-E08-planner-day-pc.jpg`의 로그아웃 버튼, `T07-A01-unauthenticated-tasks-redirect-pc.jpg` | ☑ |
| 2 | 저장된 비밀번호에 입력 글자가 보이지 않음 | `T07-A04-password-secret-scan-actual-github-pc.jpg` — 실제 DB의 `$2b$12$`·60자·평문 일치 false | ☑ |
| 3 | 로그아웃 뒤 같은 요청 거절 | `T07-A02-auth-isolation-actual-github-pc.jpg` — 같은 `GET /api/tasks`가 200 → 401 | ☑ |
| 4 | 남의 자료 읽기·수정·삭제 양방향 거절, 목록 유출 없음 | `T07-A02-auth-isolation-actual-github-pc.jpg` — 양방향 404·유출 0건 원본 | ☑ |
| 5 | 설명서 ①~⑥ 분리, ⑥ 내용 있음 | `T07-A03-auth-guide-six-sections-actual-github-pc.jpg` | ☑ |
| 6 | 서로 다른 실제 날짜 5일 기록과 3일차 전 규칙 변경 | `T07-A05-five-day-rule-change-actual-pc.jpg` — DB 할 일 생성일 5일, 규칙 변경 8/31 10:30:55, 3일차 생성 15:30:23 | ☑ 날짜 순서·사용자 원래 시각 확인. 실제 수치·손계산 증거는 별도 |
| 7 | 제출물에 비밀번호·토큰·비밀키 원문 없음 | `T07-A04-password-secret-scan-actual-github-pc.jpg` — 실제 환경 변수 값 15개와 Git 이력·추적 파일 비교 0건 | ☑ |

## 제출용 스크린샷

| 파일 | 확인 내용 | 연결 기준 |
|---|---|---|
| `T07-E01-public-entry-pc.jpg` | 공개 첫 화면, 로그인·회원가입 선택 | C01, C03 |
| `T07-E02-login-pc.jpg` | 아이디·비밀번호 로그인, 계정 찾기 링크 | C95, C97, C99 |
| `T07-E03-signup-pc.jpg` | 아이디·닉네임·이메일·비밀번호 가입 화면 | C94, C98 |
| `T07-E04-recover-pc.jpg` | 아이디 찾기·비밀번호 복구 화면 | 인증 보조 증거 |
| `T07-E05-auth-session-results-pc.jpg` | 가입 201, 중복 409, 미로그인 401, bcrypt, 로그아웃·비밀번호 변경 뒤 세션 폐기 | C94~C115 |
| `T07-E06-isolation-results-pc.jpg` | 양방향 읽기·수정·삭제·날짜 이동 404, 목록 유출 0, 상대 자료 불변 | C116~C126 |
| `T07-E07-export-quality-results-pc.jpg` | 내보내기·계정 삭제 자동 검증, 27개 검사·타입·빌드·감사 결과 | C133, C134 |
| `T07-E08-planner-day-pc.jpg` | 로그인 계정의 일간 플래너와 빠른 추가 | 플래너 화면 증거 |
| `T07-E09-planner-week-pc.jpg` | 주간 플래너, 날짜별 할 일, 드래그 안내 | C27 및 사용 화면 증거 |
| `T07-E10-planner-month-pc.jpg` | 월간 플래너와 날짜별 할 일 | 사용 화면 증거 |
| `T07-E11-plans-pc.jpg` | 계획 목록·새 계획 만들기 | 계획 화면 증거 |
| `T07-E12-plan-detail-pc.jpg` | 계획 성공 기준과 DB 트리거 수정 이력 | 계획 수정 이력 증거 |
| `T07-E13-tasks-pc.jpg` | 할 일 목록, 기간·예상·실제 분, 검색·거르기 | 할 일 화면 증거 |
| `T07-E14-task-detail-pc.jpg` | 시작·종료 시각 자동 계산, 실행 기록 입력 | 시간 자동 계산 증거 |
| `T07-E15-review-pc.jpg` | 조회 기간의 계획·완료·지연·막힘·예상·실제·차이 | C132 화면 증거(손계산 대조 대기) |
| `T07-E16-account-pc.jpg` | 닉네임, 비밀번호 변경, 내보내기, 연쇄 삭제 안내 | C133, C134 |
| `T07-E17-documents-submission-pc.jpg` | 설명서 6항목, 검증 4줄, AI 3줄, 공개 제출, 5일 규칙·대기 상태 | C01, C39, C40, C77, C78, C127~C131 |
| `T07-A01-unauthenticated-tasks-redirect-pc.jpg` | 로그아웃 상태에서 `/tasks` 접근 시 실제 로그인 화면으로 이동 | C97, C124 |
| `T07-A02-auth-isolation-actual-github-pc.jpg` | GitHub에 공개된 실제 인증 격리 JSON 전체 화면 | C94~C125 |
| `T07-A03-auth-guide-six-sections-actual-github-pc.jpg` | GitHub에 공개된 인증 구현 설명서 ①~⑥ 전체 화면 | C91~C93, C101~C115, C126~C130 |
| `T07-A04-password-secret-scan-actual-github-pc.jpg` | 실제 DB 비밀번호 저장 모양과 실제 환경 변수 값 비밀값 검사 결과 | C103~C106, C113, C131, C46 |
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

## Postman 요청 본문 촬영 원칙

- 아이디 중복 확인, 빈 로그아웃 요청, 실패 로그인 두 건은 요청 본문이 보이도록 촬영했다.
- 성공 로그인에는 실제 테스트 계정을 사용했지만 비밀번호가 든 본문 탭은 촬영하지 않았다. 실패 로그인 비밀번호는 `<masked>`로 보냈다.
- 응답에는 비밀번호·세션 토큰·쿠키가 없으며 Postman 화면에도 해당 원문을 노출하지 않았다.
- 기존 테스트 계정으로 충분해 새 계정은 만들지 않았다.

## DB 화면으로 교체한 증거

| 기존 증거 | DB 화면을 우선 사용하는 항목 | 유지 이유 |
|---|---|---|
| `T07-E05-auth-session-results-pc.jpg` | 비밀번호 저장·세션 구조는 `T07-A08`, `T07-A09` 우선 | 가입·로그아웃 뒤 요청 거절은 API 동작이라 E05·A02 유지 |
| `T07-E06-isolation-results-pc.jpg` | 소유자 컬럼·미귀속 0건은 `T07-A08`, `T07-A09` 우선 | 양방향 읽기·수정·삭제 404는 DB 사진만으로 증명할 수 없어 A02 유지 |
| `T07-A04-password-secret-scan-actual-github-pc.jpg` | bcrypt 저장 형태는 `T07-A08` 우선 | Git 이력·추적 파일의 비밀값 0건은 DB 사진으로 증명할 수 없어 A04 유지 |
| `T07-A05-five-day-rule-change-actual-pc.jpg` | 원자료는 `T07-A06`, `T07-A07`, DB 요약은 `T07-A08` 우선 | 날짜와 규칙 변경의 한눈 비교용 보조 화면으로 유지 |

## 화면이 아닌 원본 검증 자료

- `auth-isolation-results.json`: 자격증명과 세션 값을 기록하지 않은 공개 배포 자동 검증 원본
- `T07-검증결과-화면.html`: E05~E07·E17 화면을 다시 만들 수 있는 정적 원본
- `실제_보안검증_결과.md`: 2026-09-03 실제 DB 읽기·비밀값 비교 결과 원본
- `5일_규칙변경_DB결과.md`: 5일 생성 시각과 규칙 변경 순서만 모은 공개 원본

## 실제 5일 사용 뒤 추가할 증거

아래는 사용자가 실제 기록을 완료해야 하므로 현재 증거를 만들지 않았다.

| 기준 | 추가할 증거 |
|---|---|
| C132 | 5일 화면 합계·평균과 `5일_사용기록.md` 손계산 대조 화면 |

`app_user`와 `user_session` 원본 행은 이메일·비밀번호 해시 전체·세션 해시가 노출될 수 있어 직접 촬영하지 않는다. 대신 실제 DB의 읽기 전용 집계 결과인 `T07-A08`과 값 없는 스키마 관계도 `T07-A09`를 제출한다.

## 이전 촬영본

`T07-C03-login-local-pc.png`, `T07-C03-login-production-pc.png`, `T07-public-entry-pc.png`, `T07-planner-drag-pc.png`는 이전 단계 증거로 보존한다. 현재 제출에는 위 `T07-E01`~`T07-E17` 묶음을 우선 사용한다.
