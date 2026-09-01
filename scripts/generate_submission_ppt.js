const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const sharp = require("sharp");

// 과제 보고서 전체에서 반복해서 쓰는 색과 글꼴을 한곳에 둔다.
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
const EVIDENCE = path.join(ROOT, "docs", "evidence");
const REPORTS = path.join(ROOT, "reports");
const ASSETS = path.join(REPORTS, "assets");
// 사용자가 손본 최종 제출본을 덮어쓰지 않도록 자동 생성본은 별도 파일로 저장한다.
const OUTPUT = path.join(REPORTS, "플랜두씨_다이어리_과제6_제출보고서_자동생성본.pptx");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "stuls · OpenAI Codex";
pptx.subject = "과제 6 플랜두씨 다이어리 제출 보고서";
pptx.title = "플랜두씨 다이어리 — 과제 6 제출 보고서";
pptx.company = "Plan Do See Diary";
pptx.lang = "ko-KR";
pptx.theme = {
  headFontFace: FONT,
  bodyFontFace: FONT,
  lang: "ko-KR",
};
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

function addText(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: FONT,
    fontSize: 18,
    color: C.ink,
    margin: 0,
    breakLine: false,
    valign: "mid",
    fit: "shrink",
    ...options,
  });
}

function addTitle(slide, eyebrow, title, subtitle, page) {
  addText(slide, eyebrow.toUpperCase(), 0.62, 0.34, 3.7, 0.25, {
    fontSize: 10, bold: true, color: C.gold, charSpacing: 2.2,
  });
  addText(slide, title, 0.62, 0.66, 11.9, 0.62, {
    fontSize: 27, bold: true, color: C.ink,
  });
  if (subtitle) {
    addText(slide, subtitle, 0.64, 1.32, 11.7, 0.34, {
      fontSize: 12.5, color: C.gray,
    });
  }
  addText(slide, String(page).padStart(2, "0"), 12.1, 0.36, 0.58, 0.24, {
    fontSize: 10, bold: true, color: C.green, align: "right",
  });
}

function addFooter(slide) {
  slide.addShape(pptx.ShapeType.line, { x: 0.62, y: 7.16, w: 12.05, h: 0, line: { color: C.line, width: 1 } });
  addText(slide, "PLAN · DO · SEE", 0.62, 7.2, 2.2, 0.18, { fontSize: 8.5, bold: true, color: C.green, charSpacing: 1.8 });
  addText(slide, "2026.09.01", 10.8, 7.2, 1.86, 0.18, { fontSize: 8.5, color: C.gray, align: "right" });
}

function addCard(slide, x, y, w, h, options = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: options.fill || C.white, transparency: options.transparency || 0 },
    line: { color: options.line || C.line, width: options.lineWidth || 1 },
    shadow: options.shadow === false ? undefined : { type: "outer", color: "AAB8B2", blur: 1, angle: 45, distance: 1, opacity: 0.12 },
  });
}

function addPill(slide, text, x, y, w, options = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.34,
    fill: { color: options.fill || C.mint },
    line: { color: options.line || C.mint },
  });
  addText(slide, text, x, y + 0.015, w, 0.3, {
    fontSize: options.fontSize || 10.5,
    bold: options.bold !== false,
    color: options.color || C.green,
    align: "center",
  });
}

function addMetric(slide, value, label, x, y, w, accent = C.green) {
  addCard(slide, x, y, w, 1.05, { fill: C.white });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 1.05, fill: { color: accent }, line: { color: accent } });
  addText(slide, value, x + 0.22, y + 0.13, w - 0.34, 0.45, { fontSize: 25, bold: true, color: accent });
  addText(slide, label, x + 0.22, y + 0.63, w - 0.34, 0.22, { fontSize: 10.5, color: C.gray });
}

async function contain(pathName, x, y, w, h) {
  const meta = await sharp(pathName).metadata();
  const ratio = meta.width / meta.height;
  const boxRatio = w / h;
  if (ratio > boxRatio) {
    const imageH = w / ratio;
    return { path: pathName, x, y: y + (h - imageH) / 2, w, h: imageH };
  }
  const imageW = h * ratio;
  return { path: pathName, x: x + (w - imageW) / 2, y, w: imageW, h };
}

async function addEvidence(slide, file, x, y, w, h, label) {
  addCard(slide, x, y, w, h, { fill: "F4F7F5", shadow: false });
  const image = await contain(path.join(ASSETS, file), x + 0.08, y + 0.08, w - 0.16, h - 0.52);
  slide.addImage(image);
  addText(slide, label, x + 0.1, y + h - 0.36, w - 0.2, 0.22, { fontSize: 9.5, bold: true, color: C.green, align: "center" });
}

function addBulletList(slide, items, x, y, w, h, options = {}) {
  const runs = [];
  items.forEach((item, index) => {
    runs.push({ text: item, options: { bullet: { indent: 14 }, breakLine: index < items.length - 1 } });
  });
  slide.addText(runs, {
    x, y, w, h,
    fontFace: FONT,
    fontSize: options.fontSize || 14,
    color: options.color || C.ink,
    margin: 0.04,
    breakLine: false,
    paraSpaceAfterPt: options.spaceAfter || 10,
    valign: "top",
    fit: "shrink",
  });
}

function addRequirementSlide(page, cardTitle, subtitle, rows) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addTitle(slide, "Requirement Mapping", cardTitle, subtitle, page);
  const x = 0.62;
  const y = 1.86;
  const widths = [1.2, 5.1, 4.72, 1.08];
  const headers = ["ID", "통과 기준", "구현·증거", "상태"];
  let offset = x;
  headers.forEach((header, index) => {
    slide.addShape(pptx.ShapeType.rect, { x: offset, y, w: widths[index], h: 0.46, fill: { color: C.ink }, line: { color: C.ink } });
    addText(slide, header, offset + 0.06, y + 0.03, widths[index] - 0.12, 0.36, { fontSize: 10.5, bold: true, color: C.white, align: index === 3 ? "center" : "left" });
    offset += widths[index];
  });
  const rowH = Math.min(0.67, 4.7 / rows.length);
  rows.forEach((row, rowIndex) => {
    const rowY = y + 0.46 + rowIndex * rowH;
    offset = x;
    row.forEach((value, index) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: offset, y: rowY, w: widths[index], h: rowH,
        fill: { color: rowIndex % 2 ? "F5F8F6" : C.white },
        line: { color: C.line, width: 0.7 },
      });
      addText(slide, value, offset + 0.06, rowY + 0.025, widths[index] - 0.12, rowH - 0.05, {
        fontSize: index === 0 ? 9.2 : index === 3 ? 10 : 9.6,
        bold: index === 0 || index === 3,
        color: index === 3 ? C.green : C.ink,
        align: index === 3 ? "center" : "left",
        valign: "mid",
      });
      offset += widths[index];
    });
  });
  addFooter(slide);
}

async function prepareAssets() {
  fs.mkdirSync(ASSETS, { recursive: true });
  const files = fs.readdirSync(EVIDENCE).filter((file) => file.endsWith(".png"));
  for (const file of files) {
    const src = path.join(EVIDENCE, file);
    const dest = path.join(ASSETS, file);
    const meta = await sharp(src).metadata();
    // 브라우저 캡처는 왼쪽에 모바일 화면, 오른쪽에 빈 영역이 있어 화면 부분만 잘라 슬라이드에 쓴다.
    await sharp(src)
      .extract({ left: 0, top: 0, width: Math.min(500, meta.width), height: meta.height })
      .png()
      .toFile(dest);
  }
}

async function buildDeck() {
  await prepareAssets();

  // 1. 표지
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.ink };
    slide.addShape(pptx.ShapeType.arc, { x: 8.6, y: -1.0, w: 5.6, h: 5.6, adjustPoint: 0.25, rotate: 20, fill: { color: C.green, transparency: 10 }, line: { color: C.green, transparency: 100 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: 10.7, y: 4.8, w: 2.9, h: 2.9, fill: { color: C.gold, transparency: 3 }, line: { color: C.gold, transparency: 100 } });
    addText(slide, "ASSIGNMENT 06 · FINAL REPORT", 0.75, 0.74, 5.6, 0.3, { fontSize: 11, bold: true, color: "EACB8E", charSpacing: 2.3 });
    addText(slide, "플랜두씨\n다이어리", 0.72, 1.28, 7.4, 1.72, { fontSize: 42, bold: true, color: C.white, breakLine: true, valign: "top" });
    addText(slide, "계획 → 실행 → 돌아보기를\n근거가 남는 하나의 흐름으로", 0.78, 3.26, 6.9, 0.9, { fontSize: 21, bold: true, color: "DDEDE7", breakLine: true, valign: "top" });
    addPill(slide, "P0–P7 완료", 0.8, 4.58, 1.48, { fill: "284D43", line: "3E6B5F", color: "DDEDE7" });
    addPill(slide, "Vercel 배포", 2.42, 4.58, 1.48, { fill: "284D43", line: "3E6B5F", color: "DDEDE7" });
    addPill(slide, "증거 7장", 4.04, 4.58, 1.3, { fill: "284D43", line: "3E6B5F", color: "DDEDE7" });
    addText(slide, "결과물", 0.8, 5.45, 0.8, 0.22, { fontSize: 9.5, bold: true, color: "EACB8E" });
    addText(slide, [{ text: "plan-do-see-diary.vercel.app", options: { hyperlink: { url: "https://plan-do-see-diary.vercel.app" } } }], 0.8, 5.7, 5.6, 0.34, { fontSize: 15, bold: true, color: C.white });
    addText(slide, "2026.09.01  ·  stuls", 0.8, 6.75, 4.4, 0.25, { fontSize: 10.5, color: "AAC6BD" });
  }

  // 2. 완료 범위
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "Completion", "P0부터 P7까지, 제출 가능한 상태로 완료", "구현·실제 자료·검증·증거·공개 배포를 한 흐름으로 마무리했다.", 2);
    const stages = [
      ["P0", "프로젝트·DB 연결"], ["P1", "표 6개·트리거"], ["P2", "서버 API"], ["P3", "플래너·관리 화면"],
      ["P4", "실행·돌아보기"], ["P5", "사용자 실제 자료"], ["P6", "보안·내보내기"], ["P7", "배포·제출 문서"],
    ];
    stages.forEach(([code, label], i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 0.64 + col * 3.13;
      const y = 2.03 + row * 1.65;
      addCard(slide, x, y, 2.75, 1.28, { fill: row === 0 ? "F2F8F5" : "FFF9EF" });
      addPill(slide, code, x + 0.18, y + 0.18, 0.58, { fill: code === "P7" ? "F4DFC0" : C.mint, color: code === "P7" ? "8B5A13" : C.green });
      addText(slide, label, x + 0.18, y + 0.66, 2.35, 0.32, { fontSize: 14.5, bold: true });
      addText(slide, "완료", x + 2.02, y + 0.2, 0.52, 0.24, { fontSize: 10.5, bold: true, color: C.green, align: "right" });
    });
    addMetric(slide, "6", "주요 화면", 0.64, 5.55, 2.35);
    addMetric(slide, "8", "API 경로", 3.1, 5.55, 2.35, C.gold);
    addMetric(slide, "6", "DB 표", 5.56, 5.55, 2.35, C.coral);
    addMetric(slide, "9", "자동 검사", 8.02, 5.55, 2.35, C.green);
    addMetric(slide, "7", "증거 화면", 10.48, 5.55, 2.2, C.gold);
    addFooter(slide);
  }

  // 3. 시스템 구조
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "Architecture", "브라우저에 DB 비밀값을 내보내지 않는 단일 서버 구조", "Next.js 화면과 API를 한 프로젝트에 두고 서버만 Supabase PostgreSQL에 연결한다.", 3);
    const nodes = [
      { x: 0.75, title: "브라우저", sub: "일·주·월 플래너\nPlan · Do · See", color: "E8F4EF" },
      { x: 4.75, title: "Next.js 16", sub: "App Router 화면 6개\n서버 API 경로 8개", color: "FFF4DF" },
      { x: 8.75, title: "Supabase", sub: "관리형 PostgreSQL\n표 6개 + 트리거", color: "E8F4EF" },
    ];
    nodes.forEach((node) => {
      addCard(slide, node.x, 2.15, 3.0, 1.65, { fill: node.color });
      addText(slide, node.title, node.x + 0.22, 2.4, 2.56, 0.38, { fontSize: 21, bold: true, align: "center" });
      addText(slide, node.sub, node.x + 0.25, 2.9, 2.5, 0.62, { fontSize: 12, color: C.gray, align: "center", breakLine: true, valign: "top" });
    });
    slide.addShape(pptx.ShapeType.chevron, { x: 3.9, y: 2.7, w: 0.62, h: 0.55, fill: { color: C.gold }, line: { color: C.gold } });
    slide.addShape(pptx.ShapeType.chevron, { x: 7.9, y: 2.7, w: 0.62, h: 0.55, fill: { color: C.gold }, line: { color: C.gold } });
    addText(slide, "HTTP", 3.88, 3.35, 0.68, 0.2, { fontSize: 9, bold: true, color: C.gray, align: "center" });
    addText(slide, "서버 SQL", 7.76, 3.35, 0.9, 0.2, { fontSize: 9, bold: true, color: C.gray, align: "center" });
    addCard(slide, 0.75, 4.42, 11.0, 1.38, { fill: C.white });
    addText(slide, "데이터 모델", 1.0, 4.68, 1.25, 0.3, { fontSize: 13, bold: true, color: C.green });
    ["plan", "plan_revision", "task", "task_completion", "run_log", "review"].forEach((name, i) => addPill(slide, name, 2.3 + i * 1.48, 4.62, 1.3, { fontSize: 9.5 }));
    addText(slide, "DATABASE_URL / POSTGRES_URL은 서버 전용 · NEXT_PUBLIC_* 사용 금지", 1.0, 5.2, 9.9, 0.26, { fontSize: 11.5, bold: true, color: C.coral });
    addPill(slide, "Vercel", 11.95, 2.35, 0.78, { fill: "F4DFC0", color: "8B5A13", fontSize: 9 });
    addPill(slide, "Free", 11.95, 2.79, 0.78, { fill: "F4DFC0", color: "8B5A13", fontSize: 9 });
    addFooter(slide);
  }

  // 4. 플래너 화면
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "Planner", "같은 실제 자료를 일간·주간·월간으로", "선택 날짜를 기준으로 계획과 할 일, 예상·실제 시간을 보고 바로 추가한다.", 4);
    await addEvidence(slide, "06_C34-C35_C78-C82_planner_public_notice.png", 0.68, 1.88, 4.0, 4.95, "C34·C35·C78~C82  실제 자료와 공개 안내");
    const cards = [
      ["DAY", "일간 집중", "오늘의 할 일과 예상·실제 시간을 빠르게 확인"],
      ["WEEK", "주간 7열", "월요일부터 일요일까지 균일한 날짜 흐름"],
      ["MONTH", "월간 6주", "앞뒤 날짜를 포함해 일정 밀도를 한눈에 파악"],
    ];
    cards.forEach(([tag, title, body], i) => {
      const y = 1.92 + i * 1.36;
      addCard(slide, 5.05, y, 7.45, 1.08, { fill: i === 1 ? "FFF8EA" : C.white });
      addPill(slide, tag, 5.28, y + 0.19, 0.85, { fontSize: 9.5, fill: i === 1 ? "F4DFC0" : C.mint, color: i === 1 ? "8B5A13" : C.green });
      addText(slide, title, 6.38, y + 0.15, 1.5, 0.32, { fontSize: 16, bold: true });
      addText(slide, body, 7.98, y + 0.15, 4.15, 0.5, { fontSize: 11.5, color: C.gray, valign: "top" });
    });
    addCard(slide, 5.05, 6.12, 7.45, 0.72, { fill: C.ink, line: C.ink });
    addText(slide, "플래너 안에서 새 계획·새 할 일을 바로 추가", 5.35, 6.28, 6.85, 0.3, { fontSize: 15, bold: true, color: C.white, align: "center" });
    addFooter(slide);
  }

  // 5. Plan과 Do
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "Plan & Do", "계획의 기준은 보존하고, 실행은 별도로 기록", "수정 이력·완료 멱등성·실행 기록 분리를 화면과 DB에서 함께 확인했다.", 5);
    await addEvidence(slide, "01_C04-C08_plan_revision.png", 0.55, 1.86, 3.92, 4.95, "C04~C08  계획과 수정 이력");
    await addEvidence(slide, "02_C09-C22_tasks_completion_sort.png", 4.7, 1.86, 3.92, 4.95, "C09~C22  할 일·정렬·완료");
    await addEvidence(slide, "03_C23-C27_run_log.png", 8.85, 1.86, 3.92, 4.95, "C23~C27  실제 실행 기록");
    addFooter(slide);
  }

  // 6. 돌아보기와 근거
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "See", "집계 숫자를 누르면 같은 조건의 근거 목록으로", "숫자와 목록이 하나의 조건 생성 함수를 공유해 서로 어긋나지 않는다.", 6);
    await addEvidence(slide, "04_C28-C33_C83_review_metrics.png", 0.68, 1.88, 4.05, 4.95, "C28~C33·C83  돌아보기 집계");
    await addEvidence(slide, "05_C83_metric_evidence_list.png", 4.95, 1.88, 4.05, 4.95, "C83  완료 1 ↔ 근거 목록 1건");
    addMetric(slide, "5", "기간 안 할 일", 9.35, 2.0, 1.45);
    addMetric(slide, "1", "검증 중 완료", 10.98, 2.0, 1.45, C.gold);
    addMetric(slide, "4", "지연", 9.35, 3.28, 1.45, C.coral);
    addMetric(slide, "3", "막힘", 10.98, 3.28, 1.45, C.green);
    addCard(slide, 9.35, 4.65, 3.08, 1.55, { fill: "FFF8EA" });
    addText(slide, "200분 예상", 9.62, 4.92, 2.5, 0.32, { fontSize: 18, bold: true, color: C.gold, align: "center" });
    addText(slide, "38분 실제", 9.62, 5.35, 2.5, 0.32, { fontSize: 18, bold: true, color: C.green, align: "center" });
    addText(slide, "차이  −162분", 9.62, 5.78, 2.5, 0.25, { fontSize: 11.5, bold: true, color: C.coral, align: "center" });
    addFooter(slide);
  }

  // 7. 핵심 불변 규칙
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "Data Rules", "실수하기 쉬운 규칙을 UI가 아니라 데이터 구조로 고정", "짧은 코드보다 데이터가 틀어지지 않는 경계를 먼저 만들었다.", 7);
    const rules = [
      ["01", "시간은 전 구간 분", "저장·계산·표시 단위를 하나로 통일"],
      ["02", "서울 날짜와 UTC 시각", "date와 timestamptz의 역할 분리"],
      ["03", "할 일 소프트 삭제", "deleted_at IS NULL만 목록·집계"],
      ["04", "완료는 DB 기본키", "연타해도 task_completion 한 행"],
      ["05", "계획 이력은 트리거", "수정 경로와 무관하게 OLD 값 보존"],
      ["06", "실행은 별도 표", "run_log가 예상 시간을 덮지 않음"],
    ];
    rules.forEach(([num, title, body], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.72 + col * 6.15;
      const y = 1.93 + row * 1.55;
      addCard(slide, x, y, 5.75, 1.18, { fill: row === 1 ? "FFF8EA" : C.white });
      addText(slide, num, x + 0.22, y + 0.2, 0.55, 0.34, { fontSize: 19, bold: true, color: row === 1 ? C.gold : C.green });
      addText(slide, title, x + 0.9, y + 0.16, 2.2, 0.32, { fontSize: 15, bold: true });
      addText(slide, body, x + 3.05, y + 0.16, 2.35, 0.58, { fontSize: 10.8, color: C.gray, valign: "top" });
    });
    addFooter(slide);
  }

  // 8. 검증과 보안
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "Verification", "자동 검사와 실제 화면 검증을 모두 통과", "검증용 데이터는 증거를 남긴 뒤 원래 상태로 복원했다.", 8);
    await addEvidence(slide, "07_C57_script_text_safe.png", 0.7, 1.9, 3.9, 4.85, "C57  스크립트 문자가 텍스트로 표시");
    addMetric(slide, "9/9", "자동 검사 통과", 4.95, 1.98, 2.2);
    addMetric(slide, "PASS", "TypeScript", 7.35, 1.98, 2.2, C.gold);
    addMetric(slide, "PASS", "Production build", 9.75, 1.98, 2.2, C.green);
    addMetric(slide, "0", "npm audit 취약점", 4.95, 3.28, 2.2, C.coral);
    addMetric(slide, "0", "비밀값 노출", 7.35, 3.28, 2.2, C.green);
    addMetric(slide, "200", "공개 URL 상태", 9.75, 3.28, 2.2, C.gold);
    addCard(slide, 4.95, 4.65, 7.0, 1.7, { fill: C.white });
    addText(slide, "실제로 해결한 문제", 5.22, 4.91, 2.2, 0.28, { fontSize: 14, bold: true, color: C.green });
    addBulletList(slide, [
      "Next.js 보안 취약점 → 16.3.3으로 업그레이드",
      "Supabase 내보내기 30초 지연 → 순차 조회로 약 0.4초",
      "prepared statement 간헐 오류 → prepare: false",
    ], 5.22, 5.28, 6.4, 0.84, { fontSize: 11.5, spaceAfter: 5 });
    addFooter(slide);
  }

  // 9. AI와 사용자 판단
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    addTitle(slide, "AI & Judgment", "AI가 만든 것과 사용자가 판단한 것을 분리", "과제의 실제 자료와 제품 방향은 사용자가 결정했다.", 9);
    const items = [
      { tag: "AI", title: "AI에게 맡긴 일", body: "요구사항 분석, DB·API·플래너 구현, 자동 검사와 문서 정리", fill: "EAF5F0", accent: C.green },
      { tag: "ME", title: "내가 직접 판단한 일", body: "Vercel Supabase 연결과 실제 계획·할 일·실행 기록의 내용 결정", fill: "FFF7E8", accent: C.gold },
      { tag: "NO", title: "AI 제안을 따르지 않은 일", body: "별도 입력 화면만 쓰지 않고 플래너에서도 바로 추가하도록 방향 수정", fill: "FBEFEB", accent: C.coral },
    ];
    items.forEach((item, i) => {
      const x = 0.7 + i * 4.18;
      addCard(slide, x, 2.05, 3.78, 3.9, { fill: item.fill, line: item.fill });
      addPill(slide, item.tag, x + 0.28, 2.36, 0.7, { fill: item.accent, line: item.accent, color: C.white });
      addText(slide, item.title, x + 0.28, 3.02, 3.18, 0.66, { fontSize: 20, bold: true, color: item.accent, valign: "top" });
      addText(slide, item.body, x + 0.28, 4.02, 3.18, 1.15, { fontSize: 14, color: C.ink, valign: "top", breakLine: true });
    });
    addText(slide, "사용자가 실제 자료를 직접 입력하고 공개 범위를 승인했다.", 0.9, 6.34, 11.5, 0.32, { fontSize: 14, bold: true, color: C.green, align: "center" });
    addFooter(slide);
  }

  // 10~14. 과제 원문의 44개 통과 기준을 카드별로 빠짐없이 싣는다.
  addRequirementSlide(10, "카드 1 — 계획 세우기", "계획의 필수 값과 수정 전 이력을 확인한다.", [
    ["C04", "계획 기간 저장", "plan.start_date · end_date", "PASS"],
    ["C05", "우선순위 저장", "plan.priority", "PASS"],
    ["C06", "성공 기준 저장", "plan.success_criteria", "PASS"],
    ["C07", "예상 시간 저장", "plan.estimate_minutes · 분", "PASS"],
    ["C08", "수정 전 계획 보존", "DB 트리거 · 수정 이력 화면", "PASS"],
  ]);
  addRequirementSlide(11, "카드 2 — 할 일 다루기", "만들기부터 검색·정렬과 완료 되돌리기까지 확인한다.", [
    ["C09", "할 일 만들기", "POST /api/tasks", "PASS"],
    ["C10", "내용 고치기", "PATCH /api/tasks/[id]", "PASS"],
    ["C11", "완료로 바꾸기", "task_completion INSERT", "PASS"],
    ["C12", "완료 되돌리기", "task_completion DELETE", "PASS"],
    ["C13", "할 일 지우기", "deleted_at 소프트 삭제", "PASS"],
    ["C14", "마감일 저장", "서울 날짜 date", "PASS"],
    ["C15", "우선순위 저장", "task.priority", "PASS"],
    ["C16", "태그 저장", "task.tags", "PASS"],
    ["C17", "예상 시간 저장", "estimate_minutes · 분", "PASS"],
    ["C18", "검색", "제목·메모 서버 SQL", "PASS"],
    ["C19", "조건 거르기", "상태·우선순위·태그·지연", "PASS"],
    ["C20", "기준대로 정렬", "마감일 → 우선순위 → ID", "PASS"],
  ]);
  addRequirementSlide(12, "카드 3 — 실제로 한 일 적기", "실행 기록 분리와 완료 중복 방지를 확인한다.", [
    ["C21", "완료 연타 기록 1건", "PK + ON CONFLICT", "PASS"],
    ["C22", "완료 수도 +1", "task_completion 직접 집계", "PASS"],
    ["C23", "시작 시각 저장", "run_log.started_at", "PASS"],
    ["C24", "종료 시각 저장", "run_log.ended_at", "PASS"],
    ["C25", "실제 시간 저장", "actual_minutes · 분", "PASS"],
    ["C26", "막힌 이유 저장", "blocker_reason", "PASS"],
    ["C27", "계획 값 미변경", "실행 기록 API 자동 검사", "PASS"],
  ]);
  addRequirementSlide(13, "카드 4 — 돌아보기", "집계와 근거, 다음 계획 이월을 확인한다.", [
    ["C28", "계획 수", "삭제하지 않은 기간 내 할 일", "PASS"],
    ["C29", "완료 수", "task_completion 조인", "PASS"],
    ["C30", "지연 수", "미완료 · 마감 < 서울 오늘", "PASS"],
    ["C31", "막힘 수", "막힌 이유가 있는 할 일", "PASS"],
    ["C32", "예상·실제·차이", "분 SUM · COALESCE", "PASS"],
    ["C83", "숫자에서 근거 이동", "공유 조건 함수 · 목록 1건", "PASS"],
    ["C33", "고칠 점 이월", "review → carried plan", "PASS"],
  ]);
  addRequirementSlide(14, "카드 5 — 내 것으로 채우고 잃지 않기", "실제 자료·복원·보안·제출 정보를 확인한다.", [
    ["C34", "서버 실제 DB 저장", "Vercel Supabase", "PASS"],
    ["C35", "새로고침 뒤 복원", "ID·날짜·값·단위 유지", "PASS"],
    ["C78", "내 계획 1개 이상", "사용자 직접 입력 · 현재 2", "PASS"],
    ["C79", "할 일 5개 이상", "사용자 직접 입력 · 5", "PASS"],
    ["C80", "실행 기록 3개 이상", "사용자 직접 입력 · 3", "PASS"],
    ["C81", "돌아보기 0 아님", "예상 200 · 실제 38분", "PASS"],
    ["C36", "JSON 파일 하나", "/api/export", "PASS"],
    ["C82", "공개 안내", "첫 화면 고정 문구", "PASS"],
    ["C58", "비밀키 비노출", "서버 전용 · 번들 0건", "PASS"],
    ["C57", "스크립트 문자 안전", "텍스트 표시 · 미실행", "PASS"],
    ["C59", "확인 방법 4항목", "docs/검증안내서.md", "PASS"],
    ["C60", "AI 판단 3항목", "docs/AI_3줄.md", "PASS"],
    ["C01", "무인증 공개 접근", "Vercel · GitHub HTTP 200", "PASS"],
  ]);

  // 15. 제출 정보
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.ink };
    addText(slide, "READY TO SUBMIT", 0.75, 0.62, 3.4, 0.26, { fontSize: 10.5, bold: true, color: "EACB8E", charSpacing: 2.2 });
    addText(slide, "플랜두씨 다이어리\n제출 준비 완료", 0.72, 1.1, 6.0, 1.25, { fontSize: 34, bold: true, color: C.white, breakLine: true, valign: "top" });
    addText(slide, "결과물", 0.78, 2.72, 1.0, 0.22, { fontSize: 9.5, bold: true, color: "EACB8E" });
    addText(slide, [{ text: "https://plan-do-see-diary.vercel.app", options: { hyperlink: { url: "https://plan-do-see-diary.vercel.app" } } }], 0.78, 2.98, 6.0, 0.38, { fontSize: 16, bold: true, color: C.white });
    addText(slide, "GitHub", 0.78, 3.58, 1.0, 0.22, { fontSize: 9.5, bold: true, color: "EACB8E" });
    addText(slide, [{ text: "github.com/stulss/plan-do-see-diary", options: { hyperlink: { url: "https://github.com/stulss/plan-do-see-diary" } } }], 0.78, 3.84, 6.0, 0.38, { fontSize: 16, bold: true, color: C.white });
    addText(slide, "40자리 고정 소스", 0.78, 4.44, 1.5, 0.22, { fontSize: 9.5, bold: true, color: "EACB8E" });
    addText(slide, [{ text: "770e8f992d5f7da8c36b2dc823d3a5c29f5cdda6", options: { hyperlink: { url: "https://github.com/stulss/plan-do-see-diary/commits/770e8f992d5f7da8c36b2dc823d3a5c29f5cdda6/" } } }], 0.78, 4.7, 6.65, 0.38, { fontSize: 13.5, bold: true, color: C.white });
    addCard(slide, 7.25, 1.05, 5.25, 4.9, { fill: "23483E", line: "315A4E", shadow: false });
    addText(slide, "30초 확인", 7.62, 1.42, 2.0, 0.36, { fontSize: 21, bold: true, color: C.white });
    const checks = [
      ["1", "결과물 주소를 로그인 없이 연다"],
      ["2", "완료 버튼을 연속으로 누른다"],
      ["3", "돌아보기의 완료 수를 클릭한다"],
      ["✓", "완료 +1, 근거 목록 건수 일치"],
    ];
    checks.forEach(([num, text], i) => {
      const y = 2.05 + i * 0.82;
      slide.addShape(pptx.ShapeType.ellipse, { x: 7.62, y, w: 0.45, h: 0.45, fill: { color: i === 3 ? C.gold : C.green }, line: { color: i === 3 ? C.gold : C.green } });
      addText(slide, num, 7.62, y + 0.02, 0.45, 0.38, { fontSize: 11, bold: true, color: C.white, align: "center" });
      addText(slide, text, 8.28, y, 3.78, 0.46, { fontSize: 13, bold: i === 3, color: i === 3 ? "F4D69A" : "E3F0EB" });
    });
    addPill(slide, "P0–P7 COMPLETE", 7.65, 5.35, 2.15, { fill: C.gold, line: C.gold, color: C.white, fontSize: 10.5 });
    addText(slide, "Plan → Do → See → Next Plan", 0.78, 6.6, 5.9, 0.32, { fontSize: 16, bold: true, color: "AAC6BD" });
  }

  fs.mkdirSync(REPORTS, { recursive: true });
  await pptx.writeFile({ fileName: OUTPUT });
  console.log(OUTPUT);
}

buildDeck().catch((error) => {
  console.error(error);
  process.exit(1);
});
