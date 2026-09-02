export type PlannerView = "day" | "week" | "month";

export interface PlannerWindow {
  visibleStart: string;
  visibleEnd: string;
  focusStart: string;
  focusEnd: string;
  days: string[];
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function addDays(value: string, amount: number) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
}

function startOfWeek(value: string) {
  const date = parseDate(value);
  // 자바스크립트의 일요일(0) 시작 값을 플래너의 월요일 시작 기준으로 바꾼다.
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  return addDays(value, -mondayOffset);
}

function monthBounds(value: string) {
  const date = parseDate(value);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { start: formatDate(first), end: formatDate(last) };
}

export function getPlannerWindow(view: PlannerView, anchor: string): PlannerWindow {
  if (view === "day") return { visibleStart: anchor, visibleEnd: anchor, focusStart: anchor, focusEnd: anchor, days: [anchor] };

  if (view === "week") {
    const start = startOfWeek(anchor);
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
    return { visibleStart: start, visibleEnd: days[6], focusStart: start, focusEnd: days[6], days };
  }

  const month = monthBounds(anchor);
  const visibleStart = startOfWeek(month.start);
  // 6주(42칸)를 고정해 달이 바뀌어도 월간 그리드 높이가 흔들리지 않게 한다.
  const days = Array.from({ length: 42 }, (_, index) => addDays(visibleStart, index));
  return { visibleStart, visibleEnd: days[41], focusStart: month.start, focusEnd: month.end, days };
}

export function shiftAnchor(view: PlannerView, anchor: string, direction: -1 | 1) {
  if (view === "day") return addDays(anchor, direction);
  if (view === "week") return addDays(anchor, direction * 7);
  const date = parseDate(anchor);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + direction);
  return formatDate(date);
}

export function normalizePlannerView(value?: string): PlannerView {
  return value === "week" || value === "month" ? value : "day";
}

export function normalizeAnchor(value: string | undefined, fallback: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

export function plannerPeriodLabel(view: PlannerView, anchor: string, window: PlannerWindow) {
  const date = parseDate(anchor);
  if (view === "month") return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", timeZone: "UTC" }).format(date);
  if (view === "week") return `${window.focusStart.replaceAll("-", ".")} – ${window.focusEnd.replaceAll("-", ".")}`;
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long", timeZone: "UTC" }).format(date);
}

export function koreanWeekday(value: string, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("ko-KR", { weekday: style, timeZone: "UTC" }).format(parseDate(value));
}
