export function planColorClass(planId: string | number | null, planIds: readonly (string | number)[]): string {
  // 현재 계획 순서로 색을 정해 최대 8개까지 겹치지 않으며, 계획과 연결 할 일이 같은 색을 쓴다.
  if (planId === null) return "plan-color-none";
  const index = planIds.findIndex((id) => String(id) === String(planId));
  return index < 0 ? "plan-color-none" : `plan-color-${index % 8 + 1}`;
}
