# 과제 7 스크린샷 증거 색인

T07-E 화면은 2026-09-02, T07-A 화면은 2026-09-03에 PC 환경에서 촬영했다. 비밀번호·세션 토큰·DB 접속 문자열은 어느 이미지에도 넣지 않았다.

2026-09-03에는 자체 점검 7줄을 **실제 앱 화면과 GitHub 실제 검증 원본 화면**에 다시 연결했다.

## 자체 점검 7줄의 실제 화면 연결

| # | 자체 점검 내용 | 실제 화면 증거 | 판정 |
|---|---|---|---|
| 1 | 가입·로그인·로그아웃, 미로그인 자료 화면 차단 | `T07-E03-signup-pc.jpg`, `T07-E02-login-pc.jpg`, `T07-E08-planner-day-pc.jpg`의 로그아웃 버튼, `T07-A01-unauthenticated-tasks-redirect-pc.jpg` | ☑ |
| 2 | 저장된 비밀번호에 입력 글자가 보이지 않음 | `T07-A04-password-secret-scan-actual-github-pc.jpg` — 실제 DB의 `$2b$12$`·60자·평문 일치 false | ☑ |
| 3 | 로그아웃 뒤 같은 요청 거절 | `T07-A02-auth-isolation-actual-github-pc.jpg` — 같은 `GET /api/tasks`가 200 → 401 | ☑ |
| 4 | 남의 자료 읽기·수정·삭제 양방향 거절, 목록 유출 없음 | `T07-A02-auth-isolation-actual-github-pc.jpg` — 양방향 404·유출 0건 원본 | ☑ |
| 5 | 설명서 ①~⑥ 분리, ⑥ 내용 있음 | `T07-A03-auth-guide-six-sections-actual-github-pc.jpg` | ☑ |
| 6 | 서로 다른 실제 날짜 5일 기록과 3일차 전 규칙 변경 | DB 할 일 생성일 8/29·8/30·8/31·9/1·9/2, 규칙 변경 8/31 10:30:55, 3일차 생성 15:30:23 | ☑ 날짜 순서·사용자 원래 시각 확인. 실제 수치·손계산 증거는 별도 |
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

## 화면이 아닌 원본 검증 자료

- `auth-isolation-results.json`: 자격증명과 세션 값을 기록하지 않은 공개 배포 자동 검증 원본
- `T07-검증결과-화면.html`: E05~E07·E17 화면을 다시 만들 수 있는 정적 원본
- `실제_보안검증_결과.md`: 2026-09-03 실제 DB 읽기·비밀값 비교 결과 원본

## 실제 5일 사용 뒤 추가할 증거

아래는 사용자가 실제 기록을 완료해야 하므로 현재 증거를 만들지 않았다.

| 기준 | 추가할 증거 |
|---|---|
| C132 | 5일 화면 합계·평균과 `5일_사용기록.md` 손계산 대조 화면 |

## 이전 촬영본

`T07-C03-login-local-pc.png`, `T07-C03-login-production-pc.png`, `T07-public-entry-pc.png`, `T07-planner-drag-pc.png`는 이전 단계 증거로 보존한다. 현재 제출에는 위 `T07-E01`~`T07-E17` 묶음을 우선 사용한다.
