// 과제 7 최종 제출 보고서(PPTX)를 만든다.
// 과제 6 보고서(generate_submission_ppt.js)의 색·글꼴·카드 시스템을 그대로 쓰고 내용만 과제 7로 바꾼다.
// 과제 6 스크립트와 산출물은 건드리지 않는다.
// 사용법:
//   npm install pptxgenjs --no-save      (보고서 생성 전용이라 package.json 에 넣지 않는다. sharp 는 이미 있다)
//   node scripts/generate_task7_ppt.js   → reports/플랜두씨_다이어리_과제7_제출보고서.pptx
//   PDF 변환은 PowerPoint COM 으로 한다:
//     $p = New-Object -ComObject PowerPoint.Application
//     $d = $p.Presentations.Open("<위 pptx 절대경로>", $true, $false, $false)
//     $d.SaveAs("<reports\부산A_홍주형_과제7_제출보고서.pdf 절대경로>", 32); $d.Close(); $p.Quit()
//   증거 이미지는 docs/과제7/evidence/ 에서 그대로 읽는다 (PC 촬영본이라 자르지 않는다).
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const sharp = require("sharp");

const C = {
  ink: "17372F",
  green: "146B58",
  mint: "DDEDE7",
  cream: "F7F3E8",
  paper: "FCFCF8",
  gold: "C58B2A",
  coral: "D36B55",
  gray: "5F6F69",
  line: "D8E2DD",
  white: "FFFFFF",
};
const FONT = "Malgun Gothic";
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE = path.join(ROOT, "docs", "과제7", "evidence");
const REPORTS = path.join(ROOT, "reports");
const OUTPUT = path.join(REPORTS, "플랜두씨_다이어리_과제7_제출보고서.pptx");
const DATE = "2026.09.03";

const pptx = new PptxGenJS();
pptx.author = "stuls · Claude Code";
pptx.subject = "과제 7 잠긴 플랜두씨 다이어리 제출 보고서";
pptx.title = "잠긴 플랜두씨 다이어리 — 과제 7 제출 보고서";
pptx.company = "Plan Do See Diary";
pptx.lang = "ko-KR";
pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: "ko-KR" };
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

function addText(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: FONT, fontSize: 18, color: C.ink,
    margin: 0, breakLine: false, valign: "mid", fit: "shrink",
    ...options,
  });
}

function addTitle(slide, eyebrow, title, subtitle, page) {
  addText(slide, eyebrow.toUpperCase(), 0.62, 0.34, 5.2, 0.25, {
    fontSize: 10, bold: true, color: C.gold, charSpacing: 2.2,
  });
  addText(slide, title, 0.62, 0.66, 11.9, 0.62, { fontSize: 27, bold: true, color: C.ink });
  if (subtitle) addText(slide, subtitle, 0.64, 1.32, 11.7, 0.34, { fontSize: 12.5, color: C.gray });
  addText(slide, String(page).padStart(2, "0"), 12.1, 0.36, 0.58, 0.24, {
    fontSize: 10, bold: true, color: C.green, align: "right",
  });
}

function addFooter(slide) {
  slide.addShape(pptx.ShapeType.line, { x: 0.62, y: 7.16, w: 12.05, h: 0, line: { color: C.line, width: 1 } });
  addText(slide, "PLAN · DO · SEE   ·   과제 7 인증", 0.62, 7.2, 3.4, 0.18, { fontSize: 8.5, bold: true, color: C.green, charSpacing: 1.4 });
  addText(slide, DATE, 10.8, 7.2, 1.86, 0.18, { fontSize: 8.5, color: C.gray, align: "right" });
}

function addCard(slide, x, y, w, h, options = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: options.fill || C.white, transparency: options.transparency || 0 },
    line: { color: options.line || C.line, width: options.lineWidth || 1 },
    shadow: options.shadow === false ? undefined : { type: "outer", color: "AAB8B2", blur: 1, angle: 45, distance: 1, opacity: 0.12 },
  });
}

function addMetric(slide, value, label, x, y, w, accent = C.green) {
  addCard(slide, x, y, w, 1.05, { fill: C.white });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 1.05, fill: { color: accent }, line: { color: accent } });
  addText(slide, value, x + 0.22, y + 0.13, w - 0.34, 0.45, { fontSize: 25, bold: true, color: accent });
  addText(slide, label, x + 0.22, y + 0.63, w - 0.34, 0.22, { fontSize: 10.5, color: C.gray });
}

function addBulletList(slide, items, x, y, w, h, options = {}) {
  const runs = items.map((item, index) => ({
    text: item, options: { bullet: { indent: 14 }, breakLine: index < items.length - 1 },
  }));
  slide.addText(runs, {
    x, y, w, h, fontFace: FONT,
    fontSize: options.fontSize || 13.5, color: options.color || C.ink,
    margin: 0.04, breakLine: false, paraSpaceAfterPt: options.spaceAfter || 9,
    valign: "top", fit: "shrink",
  });
}

// 이미지를 상자 안에 비율 그대로 넣는다 (잘리지 않게).
async function contain(pathName, x, y, w, h) {
  const meta = await sharp(pathName).metadata();
  const ratio = meta.width / meta.height;
  if (ratio > w / h) {
    const imageH = w / ratio;
    return { path: pathName, x, y: y + (h - imageH) / 2, w, h: imageH };
  }
  const imageW = h * ratio;
  return { path: pathName, x: x + (w - imageW) / 2, y, w: imageW, h };
}

async function addEvidence(slide, file, x, y, w, h, label) {
  addCard(slide, x, y, w, h, { fill: "F4F7F5", shadow: false });
  slide.addImage(await contain(path.join(EVIDENCE, file), x + 0.08, y + 0.08, w - 0.16, h - 0.52));
  addText(slide, label, x + 0.1, y + h - 0.36, w - 0.2, 0.26, { fontSize: 9.5, bold: true, color: C.green, align: "center" });
}

function addTable(slide, headers, widths, rows, x, y, maxH = 4.7) {
  let offset = x;
  headers.forEach((header, index) => {
    slide.addShape(pptx.ShapeType.rect, { x: offset, y, w: widths[index], h: 0.44, fill: { color: C.ink }, line: { color: C.ink } });
    addText(slide, header, offset + 0.06, y + 0.03, widths[index] - 0.12, 0.36, {
      fontSize: 10.5, bold: true, color: C.white, align: index === headers.length - 1 ? "center" : "left",
    });
    offset += widths[index];
  });
  const rowH = Math.min(0.62, maxH / rows.length);
  rows.forEach((row, rowIndex) => {
    const rowY = y + 0.44 + rowIndex * rowH;
    offset = x;
    row.forEach((value, index) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: offset, y: rowY, w: widths[index], h: rowH,
        fill: { color: rowIndex % 2 ? "F5F8F6" : C.white },
        line: { color: C.line, width: 0.7 },
      });
      const last = index === row.length - 1;
      addText(slide, value, offset + 0.07, rowY + 0.02, widths[index] - 0.14, rowH - 0.04, {
        fontSize: 9.8, bold: index === 0 || last,
        color: last ? C.green : C.ink,
        align: last ? "center" : "left", valign: "mid",
      });
      offset += widths[index];
    });
  });
}

async function buildDeck() {
  // 1. 표지
  {
    const s = pptx.addSlide();
    s.background = { color: C.ink };
    s.addShape(pptx.ShapeType.arc, { x: 8.6, y: -1.0, w: 5.6, h: 5.6, adjustPoint: 0.25, rotate: 20, fill: { color: C.green, transparency: 10 }, line: { color: C.green, transparency: 100 } });
    s.addShape(pptx.ShapeType.ellipse, { x: 10.7, y: 4.8, w: 2.9, h: 2.9, fill: { color: C.gold, transparency: 3 }, line: { color: C.gold, transparency: 100 } });
    addText(s, "ASSIGNMENT 07 · FINAL REPORT", 0.75, 0.74, 6.4, 0.3, { fontSize: 11, bold: true, color: "EACB8E", charSpacing: 2.3 });
    addText(s, "잠긴\n플랜두씨 다이어리", 0.72, 1.28, 8.2, 1.9, { fontSize: 40, bold: true, color: C.white, breakLine: true, valign: "top" });
    addText(s, "내 기록을 나만 보게 만들기 — 가입·로그인·서버 세션·사용자별 자료 차단", 0.75, 3.35, 8.6, 0.4, { fontSize: 14.5, color: "BFD6CD" });
    s.addShape(pptx.ShapeType.line, { x: 0.75, y: 3.95, w: 3.1, h: 0, line: { color: C.gold, width: 2 } });
    addBulletList(s, [
      "과제 6 다이어리를 지우지 않고 같은 저장소·배포·DB에서 이어 개발",
      "bcrypt(cost 12) 비밀번호 · DB에 SHA-256만 남는 폐기 가능한 서버 세션",
      "세션에서만 사용자를 정하고, 남의 자료는 양방향 모두 404",
      "5일 실제 사용으로 계획 규칙 변경 전후의 시간 오차율 비교",
    ], 0.75, 4.25, 8.3, 2.0, { fontSize: 12.5, color: "D6E6DF", spaceAfter: 7 });
    // 날짜는 오른쪽 아래 금색 원과 겹치므로 URL 아래 왼쪽에 둔다.
    addText(s, "https://plan-do-see-diary.vercel.app", 0.75, 6.42, 8.3, 0.3, { fontSize: 12, bold: true, color: "EACB8E" });
    addText(s, DATE, 0.75, 6.78, 8.3, 0.28, { fontSize: 11, color: "8FB0A5" });
  }

  // 2. 결과물
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "Deliverables", "제출 결과물과 고정 소스", "심사자가 계정 없이 열 수 있는 공개 주소와, 그 시점의 소스를 가리키는 고정 URL.", 2);
    addMetric(s, "28건", "자동 검사 통과", 0.62, 1.9, 2.9);
    addMetric(s, "0건", "타 계정 자료 유출", 3.68, 1.9, 2.9);
    addMetric(s, "0건", "비밀값 노출 (로컬·Git 이력)", 6.74, 1.9, 2.9, C.gold);
    addMetric(s, "404", "남의 자료 요청 응답", 9.80, 1.9, 2.9, C.coral);
    addCard(s, 0.62, 3.25, 12.05, 3.5);
    addText(s, "주소", 0.85, 3.45, 3.0, 0.3, { fontSize: 11, bold: true, color: C.gold });
    addBulletList(s, [
      "공개 결과물 — https://plan-do-see-diary.vercel.app",
      "GitHub 저장소 — https://github.com/stulss/plan-do-see-diary",
      "인증 구현 설명서 — docs/과제7/인증_구현_설명서.md",
      "검증 안내서 — docs/과제7/검증안내서.md   ·   AI 3줄 — docs/과제7/AI_3줄.md",
      "5일 사용 기록 — docs/과제7/5일_사용기록.md   ·   증거 색인 — docs/과제7/evidence/README.md",
    ], 0.85, 3.8, 11.6, 1.5, { fontSize: 12.5, spaceAfter: 8 });
    addText(s, "과제 6과의 관계", 0.85, 5.4, 4.0, 0.3, { fontSize: 11, bold: true, color: C.gold });
    addText(s, "과제 6의 계획·할 일·실행 기록·돌아보기 구조와 기존 자료를 삭제하지 않고 같은 저장소·Vercel 프로젝트·Supabase PostgreSQL 에서 이어 개발했다.\n과제 6 고정 commit 356a460 이 main 이력의 조상임을 git merge-base 로 확인했다. 기존 계획·할 일·돌아보기는 사용자가 직접 만든 소유자 계정에 귀속했다.",
      0.85, 5.75, 11.6, 0.85, { fontSize: 11.5, color: C.gray, breakLine: true, valign: "top" });
    addFooter(s);
  }

  // 3. 인증 설계 결정
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "Design Decisions", "네 가지 결정이 과제의 요구를 그대로 만족시킨다", "\"로그아웃하면 이전 값이 안 통한다\"를 만들려면 서버가 세션을 폐기할 수 있어야 한다.", 3);
    const cards = [
      ["직접 구현한 서버 세션", "Auth.js 는 Credentials 를 쓰면 세션이 JWT 로 고정되어 폐기할 수 없다. Supabase Auth 는 로그아웃 뒤에도 토큰이 만료 전까지 유효하다.", "→ 로그아웃 = DB 행 삭제"],
      ["bcrypt (cost 12)", "계정마다 소금값을 자동 생성·포함한다. 순수 JS 라 서버리스에서 네이티브 빌드가 필요 없다.", "→ 같은 비밀번호도 해시가 다름"],
      ["불투명 난수 세션 토큰", "쿠키에는 의미 없는 난수만 담고 DB 에는 SHA-256 해시만 남긴다. 서명키가 아예 존재하지 않는다.", "→ DB 유출로도 도용 불가"],
      ["응답 DTO 화이트리스트", "DB 행을 그대로 내보내지 않는다. 새 컬럼이 자동으로 실려 나가는 사고를 구조가 막는다.", "→ user_id·deleted_at 미노출"],
    ];
    cards.forEach((card, i) => {
      const x = 0.62 + (i % 2) * 6.1;
      const y = 1.95 + Math.floor(i / 2) * 2.55;
      addCard(s, x, y, 5.85, 2.3);
      s.addShape(pptx.ShapeType.rect, { x, y, w: 0.07, h: 2.3, fill: { color: C.green }, line: { color: C.green } });
      addText(s, card[0], x + 0.28, y + 0.22, 5.3, 0.34, { fontSize: 15, bold: true, color: C.ink });
      addText(s, card[1], x + 0.28, y + 0.68, 5.3, 1.0, { fontSize: 11.5, color: C.gray, valign: "top" });
      addText(s, card[2], x + 0.28, y + 1.78, 5.3, 0.3, { fontSize: 11.5, bold: true, color: C.gold });
    });
    addFooter(s);
  }

  // 4. 소유권 강제 구조
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "Ownership", "사용자는 세션에서만 정해지고, 소유자 조건은 한곳에서 만든다", "주소·헤더·요청 본문에서 사용자 ID 를 읽는 코드는 이 프로젝트에 존재하지 않는다.", 4);
    const steps = [
      ["요청", "쿠키의 난수 토큰"],
      ["세션 확인", "SHA-256 해시로 DB 조회\ngetSessionUser()"],
      ["조건 생성", "buildTaskWhere()\n첫 조건이 user_id = $1"],
      ["결과", "0행이면 404\n거절이 상대 자료를 바꾸지 않음"],
    ];
    steps.forEach((step, i) => {
      const x = 0.62 + i * 3.12;
      addCard(s, x, 2.0, 2.75, 1.55, { fill: i === 3 ? C.mint : C.white });
      addText(s, step[0], x + 0.2, 2.18, 2.35, 0.3, { fontSize: 13.5, bold: true, color: C.green });
      addText(s, step[1], x + 0.2, 2.56, 2.35, 0.85, { fontSize: 11, color: C.ink, breakLine: true, valign: "top" });
      if (i < 3) addText(s, "→", x + 2.82, 2.6, 0.3, 0.35, { fontSize: 20, bold: true, color: C.gold, align: "center" });
    });
    addCard(s, 0.62, 3.8, 12.05, 2.95);
    addText(s, "왜 403 이 아니라 404 인가", 0.85, 4.0, 5.0, 0.3, { fontSize: 12.5, bold: true, color: C.gold });
    addBulletList(s, [
      "WHERE id = $1 AND user_id = $2 가 0행을 돌려주면 자연스럽게 404 가 된다.",
      "403 은 \"그 자료는 있지만 네 것이 아니다\"를 알려 준다 — 존재 자체가 정보가 된다.",
      "같은 WHERE 를 UPDATE·DELETE 에도 두었기 때문에, 거절된 요청은 상대 자료를 건드리지 못한다.",
      "목록·검색·거르기·집계가 모두 buildTaskWhere 한 곳을 지나므로 라우트마다 조건을 빠뜨릴 자리가 없다.",
    ], 0.85, 4.4, 11.6, 1.4, { fontSize: 12.5, spaceAfter: 8 });
    addText(s, "자동 검증 결과 — 두 방향 모두: 읽기 404 · 수정 404 · 삭제 404 · 날짜 이동 404 · 상대 자료 불변 · 목록 유출 0건",
      0.85, 6.05, 11.6, 0.45, { fontSize: 12, bold: true, color: C.green });
    addFooter(s);
  }

  // 5. 검증 결과 표
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "Verification", "공개 배포 주소에서 확인한 결과", "일회성 계정으로 검증하고 증거를 남긴 뒤 계정과 자료를 정리했다.", 5);
    addTable(s, ["검증 항목", "결과"], [6.6, 5.45], [
      ["미로그인 자료 API", "401"],
      ["공개 첫 화면 · /tasks", "선택 화면 200 · 자료 화면 307 → /login"],
      ["중복 가입", "409"],
      ["같은 비밀번호의 두 저장값", "서로 다른 bcrypt 해시 (cost 12)"],
      ["틀린 비밀번호 · 없는 아이디", "같은 문구 · 401"],
      ["타 계정 읽기 · 수정 · 삭제", "양방향 모두 404, 상대 자료 불변"],
      ["타 계정 목록 유출", "0건 (요청 본문의 사용자 필드는 무시)"],
      ["로그아웃 · 비밀번호 변경 뒤 이전 세션", "401"],
      ["내 자료 내보내기", "JSON 200 · 타 계정 유출 0건 · 내부 필드 미노출"],
      ["계정 삭제", "사용자 · 계획 · 할 일 0건, 이전 세션 401"],
      ["자동 검사 · 타입 · 빌드 · 감사", "28건 통과 · 통과 · 통과 · 취약점 0건"],
      ["비밀값 스캔", "로컬 · Git 전체 이력 0건"],
    ], 0.62, 1.9, 4.3);
    addFooter(s);
  }

  // 6. 5일 사용 결과
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "5-Day Study", "계획 규칙을 하나 바꾸고 전후를 같은 지표로 비교", "질문: 계획한 시간과 실제로 쓴 시간의 차이를, 계획 규칙을 바꿔서 줄일 수 있는가?", 6);
    addText(s, "지표   하루 시간 오차율 (%) = (그날 완료한 할 일의 실제 분 합 − 예상 분 합) ÷ 예상 분 합 × 100   ·   소수 첫째 자리 반올림",
      0.62, 1.82, 12.05, 0.3, { fontSize: 11, color: C.gray });
    addTable(s, ["일차", "날짜", "예상", "실제", "오차율"], [1.15, 2.2, 1.35, 1.35, 1.55], [
      ["1일차", "2026-08-29", "3 분", "4 분", "+33.3 %"],
      ["2일차", "2026-08-30", "62 분", "4 분", "-93.5 %"],
      ["3일차", "2026-08-31", "4 분", "4 분", "0.0 %"],
      ["4일차", "2026-09-01", "4 분", "4 분", "0.0 %"],
      ["5일차", "2026-09-02", "8 분", "4 분", "-50.0 %"],
    ], 0.62, 2.12, 2.0);
    addCard(s, 8.35, 2.12, 4.32, 2.44, { fill: C.cream });
    addText(s, "계획 규칙 변경", 8.58, 2.32, 3.9, 0.28, { fontSize: 12, bold: true, color: C.gold });
    addText(s, "2026-08-31 10:30:55 (Asia/Seoul)\n\n2일차 기록 뒤 · 3일차 기록(15:30:23) 앞\n\n예상 시간 상한 60분 → 90분 하나만 변경",
      8.58, 2.68, 3.9, 1.7, { fontSize: 11.5, color: C.ink, breakLine: true, valign: "top" });
    addMetric(s, "-30.1 %", "변경 전 평균 (1·2일차)", 0.62, 4.78, 3.85, C.coral);
    addMetric(s, "-16.7 %", "변경 후 평균 (3~5일차)", 4.72, 4.78, 3.85);
    addMetric(s, "-22.0 %", "5일 전체 평균", 8.82, 4.78, 3.85, C.gold);
    addCard(s, 0.62, 6.0, 12.05, 1.02, { fill: "FDF6EA", line: C.gold });
    addText(s, "감추지 않은 것", 0.85, 6.14, 3.0, 0.26, { fontSize: 11, bold: true, color: C.gold });
    addText(s, "개선의 대부분은 2일차 한 건(-93.5%)이 빠진 효과다. 2일차는 60분 상한에 맞추려고 62분으로 부풀려 잡았다가 4분에 끝난 날이라,\n규칙 변경의 효과라기보다 그날의 어림 실패가 컸다. 하루 1건씩 5일뿐이므로 이 결론은 잠정이다.",
      0.85, 6.42, 11.6, 0.5, { fontSize: 10.8, color: C.ink, breakLine: true, valign: "top" });
    addFooter(s);
  }

  // 7. 손계산 대조
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "Hand Check", "화면 합계와 손으로 더한 값이 같은지 대조", "돌아보기 화면은 완료일이 아니라 마감일로 거른다. 5일치 마감일이 8/31~9/4 라 기간을 9/4 까지 잡아야 5건이 모두 잡힌다.", 7);
    await addEvidence(s, "T07-A17-five-day-totals-hand-check-pc.jpg", 0.62, 1.95, 7.3, 4.75, "T07-A17 · 공개 배포 돌아보기 (기간 2026.08.29–2026.09.04)");
    addCard(s, 8.15, 1.95, 4.52, 4.75);
    addText(s, "손 계산", 8.38, 2.15, 3.0, 0.3, { fontSize: 12.5, bold: true, color: C.gold });
    addText(s, "예상 = 3 + 62 + 4 + 4 + 8 = 81\n실제 = 4 + 4 + 4 + 4 + 4 = 20\n차이 = 20 − 81 = −61",
      8.38, 2.5, 4.06, 0.95, { fontSize: 12.5, color: C.ink, breakLine: true, valign: "top" });
    addTable(s, ["항목", "화면", "손"], [1.66, 1.2, 1.2], [
      ["예상 분 합", "81", "81"],
      ["실제 분 합", "20", "20"],
      ["차이", "-61", "-61"],
    ], 8.38, 3.5, 1.2);
    addText(s, "세 항목 모두 일치", 8.38, 5.3, 4.06, 0.3, { fontSize: 12.5, bold: true, color: C.green });
    addText(s, "평균 오차율(-22.0%)은 이 화면에 없는 값이다.\n화면은 예상·실제·차이 세 개만 보여 주므로\n평균은 손 계산으로만 구했고 그 사실을 문서에 적었다.",
      8.38, 5.68, 4.06, 0.95, { fontSize: 10.8, color: C.gray, breakLine: true, valign: "top" });
    addFooter(s);
  }

  // 8. 실제 화면 증거
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "Evidence", "공개 배포 앱 · Postman · 실제 DB 화면", "요약 화면이 아니라 실제로 동작하는 화면만 제출 증거로 쓴다. 비밀번호·쿠키·토큰은 모두 가렸다.", 8);
    await addEvidence(s, "T07-E01-public-entry-pc.jpg", 0.62, 1.95, 3.85, 2.35, "T07-E01 · 공개 시작 화면");
    await addEvidence(s, "T07-E02-login-pc.jpg", 4.72, 1.95, 3.85, 2.35, "T07-E02 · 로그인 화면");
    await addEvidence(s, "T07-A14-postman-after-logout-401-pc.png", 8.82, 1.95, 3.85, 2.35, "T07-A14 · 로그아웃 뒤 401");
    await addEvidence(s, "T07-A08-auth-owner-db-summary-pc.png", 0.62, 4.45, 3.85, 2.35, "T07-A08 · 실제 DB: bcrypt·세션 해시");
    await addEvidence(s, "T07-A09-database-schema-actual-pc.png", 4.72, 4.45, 3.85, 2.35, "T07-A09 · 실제 8개 표 관계");
    await addEvidence(s, "T07-A22-postman-secondary-list-isolated-pc.png", 8.82, 4.45, 3.85, 2.35, "T07-A22 · 목록에 본인 자료만");
    addFooter(s);
  }

  // 9. AI와 내 판단 / 남은 제한
  {
    const s = pptx.addSlide();
    s.background = { color: C.paper };
    addTitle(s, "Judgment & Limits", "AI가 만든 것, 내가 정한 것, 그리고 남은 구멍", "무엇을 못 막았는지까지 적어야 이 과제가 끝난다.", 9);
    addCard(s, 0.62, 1.95, 7.3, 3.05);
    addText(s, "AI와 내 판단 3줄", 0.85, 2.15, 4.0, 0.3, { fontSize: 12.5, bold: true, color: C.gold });
    addBulletList(s, [
      "AI에게 맡긴 일 — 과제 6 코드 분석, 가입·로그인·서버 세션·사용자별 자료 차단 구현, DB 이전과 자동 검증, 문서 최신화.",
      "내가 직접 판단한 일 — 과제 6을 지우지 않고 같은 저장소·배포·DB에서 이어가기로 정했고, 실제 계정 가입과 계획·할 일·실행 기록 입력은 내가 했다.",
      "AI 제안을 따르지 않은 일 — 새 DB로 분리하는 대안 대신, 과제 6 자료를 보존해 내 계정으로 귀속하는 방식을 택했다.",
    ], 0.85, 2.5, 6.85, 2.35, { fontSize: 11.8, spaceAfter: 9 });
    addCard(s, 8.15, 1.95, 4.52, 3.05, { fill: "FDF1EE", line: C.coral });
    addText(s, "못 막은 것 (남은 제한)", 8.38, 2.15, 4.0, 0.3, { fontSize: 12.5, bold: true, color: C.coral });
    addBulletList(s, [
      "로그인 시도 횟수 제한·계정 잠금·CAPTCHA 가 없다 — 무차별 대입에 취약하다.",
      "비밀번호 찾기가 등록 정보 일치 방식이다. 이메일 소유 확인과 일회용 링크가 없다.",
      "관리자용 세션 강제 종료와 감사 로그가 없다.",
    ], 8.38, 2.5, 4.06, 2.35, { fontSize: 11.5, spaceAfter: 9 });
    addCard(s, 0.62, 5.2, 12.05, 1.5, { fill: C.mint, line: C.mint });
    addText(s, "핵심 제출 범위인 가입 · 로그인 · 즉시 세션 폐기 · 사용자별 자료 차단은 구현하고 공개 배포 환경에서 검증했다.",
      0.85, 5.42, 11.6, 0.35, { fontSize: 13, bold: true, color: C.ink });
    addText(s, "비밀번호 규칙은 10자 이상 + 대문자·소문자·숫자·특수문자 각 1자 이상으로 두어, 시도 제한이 없는 상태에서 추측 난이도를 올렸다.\n중복 확인은 화면 검사와 DB 유니크 인덱스 두 겹으로 두어 확인과 제출 사이에 남이 먼저 가입하는 경우까지 막았다.",
      0.85, 5.82, 11.6, 0.7, { fontSize: 11.5, color: C.gray, breakLine: true, valign: "top" });
    addFooter(s);
  }

  fs.mkdirSync(REPORTS, { recursive: true });
  await pptx.writeFile({ fileName: OUTPUT });
  console.log("생성:", OUTPUT);
}

buildDeck().catch((error) => { console.error(error); process.exit(1); });
