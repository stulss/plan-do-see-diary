import test from "node:test";
import assert from "node:assert/strict";
import { planColorClass } from "../lib/plan-color.ts";

test("같은 계획은 같은 색이고 인접 계획은 다른 색이다", () => {
  const planIds = ["17", "9", "10"];
  assert.equal(planColorClass("9", planIds), planColorClass(9, planIds));
  assert.notEqual(planColorClass("9", planIds), planColorClass("17", planIds));
  assert.equal(planColorClass(null, planIds), "plan-color-none");
});
