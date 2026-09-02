const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function clockMinutes(raw: string, label: string) {
  const match = CLOCK_PATTERN.exec(raw);
  if (!match) throw new Error(`${label} 형식이 올바르지 않습니다.`);
  return Number(match[1]) * 60 + Number(match[2]);
}

// 할 일의 시작·마감 시각을 하루의 0~1439분으로 저장해 전 구간의 시간 단위를 '분'으로 유지한다.
export function taskSchedule(start: string, end: string) {
  const startMinute = clockMinutes(start, "시작 시각");
  const endMinute = clockMinutes(end, "마감 시각");
  if (endMinute <= startMinute) throw new Error("마감 시각은 시작 시각보다 늦어야 합니다.");
  return { startMinute, endMinute, minutes: endMinute - startMinute };
}

export function clockText(value: unknown) {
  const minute = Number(value);
  if (!Number.isInteger(minute) || minute < 0 || minute >= 24 * 60) return "";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function calendarDate(raw: string) {
  const match = DATE_PATTERN.exec(raw);
  if (!match) throw new Error("날짜 형식이 올바르지 않습니다.");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== raw) throw new Error("존재하지 않는 날짜입니다.");
  return raw;
}

// datetime-local에는 시간대가 없으므로 서울 시각으로 해석하고 실제 소요 분을 서버에서 계산한다.
export function runDuration(start: string, end: string) {
  if (!LOCAL_DATE_TIME_PATTERN.test(start) || !LOCAL_DATE_TIME_PATTERN.test(end)) {
    throw new Error("시작·종료 시각 형식이 올바르지 않습니다.");
  }
  const startedAt = `${start}:00+09:00`;
  const endedAt = `${end}:00+09:00`;
  const minutes = (Date.parse(endedAt) - Date.parse(startedAt)) / 60_000;
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error("종료 시각은 시작 시각보다 늦어야 합니다.");
  return { startedAt, endedAt, minutes };
}
