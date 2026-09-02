// 5일 기록에서 쓰는 지표 규칙. DB 와 HTTP 를 모르는 순수 함수라 그대로 검사할 수 있다.
// 지표: 하루 시간 오차율(%) = (실제 분 합 - 예상 분 합) / 예상 분 합 * 100

export const OUTLIER_MINUTES = 480; // 8시간

export interface MinutePair { estimate: number | null; actual: number | null }

// 값이 빠진 할 일은 분자·분모 양쪽에서 빼고 미기록으로 따로 센다.
// 분모가 0이면 오차율을 만들지 않고 null 로 돌려준다 (화면에는 계산 불가로 적는다).
export function dailyErrorRate(rows: MinutePair[]) {
  const usable = rows.filter((row) => row.estimate !== null && row.actual !== null);
  const estimate = usable.reduce((sum, row) => sum + (row.estimate ?? 0), 0);
  const actual = usable.reduce((sum, row) => sum + (row.actual ?? 0), 0);
  return {
    estimate,
    actual,
    missing: rows.length - usable.length,
    // 소수점 첫째 자리에서 반올림한다. 분 합계는 정수 그대로 둔다.
    rate: estimate === 0 ? null : Math.round(((actual - estimate) / estimate) * 1000) / 10
  };
}

// 유난히 튀는 값은 합계에 포함하되 표시만 한다. 자료를 조용히 빼지 않는다.
export const isOutlier = (minutes: number) => minutes > OUTLIER_MINUTES;

// 같은 할 일에 같은 시작 시각으로 들어온 실행 기록은 가장 먼저 만들어진 1건만 센다.
export function dedupeRuns<T extends { task_id: string | number; started_at: string; id: number }>(runs: T[]) {
  const seen = new Map<string, T>();
  for (const run of [...runs].sort((a, b) => a.id - b.id)) {
    const key = `${run.task_id}|${run.started_at}`;
    if (!seen.has(key)) seen.set(key, run);
  }
  return [...seen.values()];
}
