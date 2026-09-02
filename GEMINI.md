# GEMINI.md — 잠긴 플랜두씨 다이어리 (과제 7)

> 상위 헌법: `C:\Users\stuls\Desktop\Agent\law.md`
> Antigravity(agy) 역할: **Validator / 브라우저 검증** (`_ai/agy/INSTRUCTIONS.md`)

## 세션 시작 시 읽는 순서 (폴더 전체를 훑지 말 것)

1. `작업내역_체크리스트.md` — **단일 진실 공급원.** 현재 상태·결정·다음 할 일
2. 작업과 직접 관련된 문서 1~2개만 (`docs/01_기획.md`, `docs/00_과제_요구사항_매핑.md`)
3. 고칠 소스 파일만 지정 열람

**읽지 말 것**: `node_modules/`, `.next/`, `.git/`, `package-lock.json`, 대용량 미디어

## 이 프로젝트의 절대 규칙

작업 브랜치: **`plan-do-see-diary_to7`** (같은 저장소 `stulss/plan-do-see-diary`)
데이터베이스: **과제 6 것을 그대로 공유한다.** 과제 6은 최종 승인이 통과되어 보존 제약이 없다.

| 금지 | 이유 |
|---|---|
| `main` 브랜치에 직접 커밋·병합 | PR 로만 합친다 |
| `git init` 으로 새 저장소 만들기 | 과제 6 고정 커밋 `356a460` 이 조상이어야 함 (T07-C78) |
| `user_id` 를 처음부터 `NOT NULL` 로 추가 | 같은 DB 를 쓰는 과제 6 배포의 등록 기능이 깨진다 (기획 4-3의 4단계 순서를 지킬 것) |
| 비밀번호·토큰·클라이언트 시크릿 원문을 코드·문서·로그에 남기기 | T07-C46 / C131 |
| 사용자 ID 를 URL·헤더·요청 본문에서 읽기 | T07-C123. 사용자는 **세션에서만** 확정한다 |
| 중복확인을 화면에서만 하고 DB 유니크 인덱스를 빼기 | 동시 가입 시 중복이 그대로 들어간다 |
| DB 행을 그대로 응답에 싣기 | 새 컬럼이 자동으로 응답에 실려 나간다. 반드시 `lib/dto/` 를 거친다 |

## 설계에서 벗어나면 안 되는 지점

- 로그인 3종: **아이디+비밀번호 · 구글 · 카카오**. 소셜만 쓰면 카드 2(비밀번호 증거)를 증명할 수 없다
- 비밀번호 해시: `bcryptjs`, 작업 계수 12. 직접 만들지 않는다
- 비밀번호 규칙: **10자 이상 + 대문자·소문자·숫자·특수문자 각 1자 이상**, 서버에서 재검사
- 소셜: `openid-client` 로 OIDC 통일. 제공자 토큰은 저장하지 않는다
- 세션: 불투명 난수 토큰, DB 에는 SHA-256 만 저장, 만료 7일, 로그아웃 시 **DB 행 삭제**
- 계정 연결: 제공자 이메일이 **인증된 경우에만** 기존 계정에 연결한다
- 남의 자료 거절: **404** (`WHERE id=$1 AND user_id=$2` 가 0행)
- 목록 소유자 조건: `lib/domain/query.ts` 의 `buildTaskWhere()` **한 곳**에서만
- 로그인 실패 문구: 아이디 없음 / 비밀번호 틀림이 **완전히 동일**

## 계층 규칙 (MVC + DTO)

```
app/**/page.tsx        View        서비스 결과를 그리기만 한다
app/api/**/route.ts    Controller  요청 해석 -> requireUser() -> 서비스 호출 -> DTO 응답 (SQL 금지)
lib/service/           Service     업무 규칙과 트랜잭션 경계
lib/repository/        Repository  SQL. 모든 함수가 user_id 를 인자로 받는다
lib/domain/            Domain      순수 함수 (DB·HTTP 를 import 하지 않는다)
lib/dto/               DTO         응답 필드 화이트리스트
```

## 코드를 고쳤으면 문서도 같은 작업 단위로

- `작업내역_체크리스트.md` 의 진행 체크리스트·작업 로그 갱신
- 동작·구조가 바뀌면 `README.md`, `docs/01_기획.md`, `docs/인증_구현_설명서.md` 동시 갱신
- 문제를 겪고 해결했으면 `docs/트러블슈팅.md` 에 기록

## 검사

```bash
npm test && npm run typecheck && npm run build && npm audit
```
