import { describe, expect, it } from "vitest";
import {
  type ExternalVars,
  type JourneyData,
  evaluateConditionGroup,
  isVisible,
  resolveFieldValue,
} from "../conditions";
import type { ConditionGroup } from "../schema";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const data: JourneyData = {
  personal: { age: 25, name: "Alice", country: "fr" },
  billing: { plan: "pro", amount: 99 },
};

const externalVars: ExternalVars = {
  isPremium: true,
  userId: "abc-123",
};

// ---------------------------------------------------------------------------
// resolveFieldValue
// ---------------------------------------------------------------------------

describe("resolveFieldValue", () => {
  it("resolves a journey field via stepId.fieldId", () => {
    expect(resolveFieldValue("personal.age", data, externalVars)).toBe(25);
  });

  it("resolves a nested step field", () => {
    expect(resolveFieldValue("billing.plan", data, externalVars)).toBe("pro");
  });

  it("resolves an external variable via $ext.varId", () => {
    expect(resolveFieldValue("$ext.isPremium", data, externalVars)).toBe(true);
    expect(resolveFieldValue("$ext.userId", data, externalVars)).toBe("abc-123");
  });

  it("returns undefined for unknown step", () => {
    expect(resolveFieldValue("unknown.field", data, externalVars)).toBeUndefined();
  });

  it("returns undefined for unknown field", () => {
    expect(resolveFieldValue("personal.unknown", data, externalVars)).toBeUndefined();
  });

  it("returns undefined for unknown external var", () => {
    expect(resolveFieldValue("$ext.unknown", data, externalVars)).toBeUndefined();
  });

  it("returns undefined for path with no dot", () => {
    expect(resolveFieldValue("nodot", data, externalVars)).toBeUndefined();
  });

  it("resolves $step.stepId.skipped to true when step is skipped", () => {
    expect(resolveFieldValue("$step.personal.skipped", data, externalVars, ["personal"])).toBe(true);
  });

  it("resolves $step.stepId.skipped to false when step is not skipped", () => {
    expect(resolveFieldValue("$step.personal.skipped", data, externalVars, ["billing"])).toBe(false);
  });

  it("resolves $step.stepId.skipped to false when skippedSteps is undefined", () => {
    expect(resolveFieldValue("$step.personal.skipped", data, externalVars)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// evaluateConditionGroup — operators
// ---------------------------------------------------------------------------

describe("evaluateConditionGroup — operators", () => {
  const make = (field: string, operator: any, value?: unknown): ConditionGroup => ({
    combinator: "and",
    rules: [{ field, operator, value }],
  });

  it("equals — true", () => {
    expect(evaluateConditionGroup(make("personal.age", "equals", 25), data, externalVars)).toBe(true);
  });

  it("equals — false", () => {
    expect(evaluateConditionGroup(make("personal.age", "equals", 30), data, externalVars)).toBe(false);
  });

  it("notEquals", () => {
    expect(evaluateConditionGroup(make("personal.age", "notEquals", 30), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.age", "notEquals", 25), data, externalVars)).toBe(false);
  });

  it("greaterThan", () => {
    expect(evaluateConditionGroup(make("personal.age", "greaterThan", 18), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.age", "greaterThan", 25), data, externalVars)).toBe(false);
  });

  it("greaterThanOrEqual", () => {
    expect(evaluateConditionGroup(make("personal.age", "greaterThanOrEqual", 25), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.age", "greaterThanOrEqual", 26), data, externalVars)).toBe(false);
  });

  it("lessThan", () => {
    expect(evaluateConditionGroup(make("personal.age", "lessThan", 30), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.age", "lessThan", 25), data, externalVars)).toBe(false);
  });

  it("lessThanOrEqual", () => {
    expect(evaluateConditionGroup(make("personal.age", "lessThanOrEqual", 25), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.age", "lessThanOrEqual", 24), data, externalVars)).toBe(false);
  });

  it("contains — string", () => {
    expect(evaluateConditionGroup(make("personal.name", "contains", "lic"), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.name", "contains", "Bob"), data, externalVars)).toBe(false);
  });

  it("contains — array", () => {
    const d: JourneyData = { step: { tags: ["a", "b", "c"] } };
    expect(evaluateConditionGroup(make("step.tags", "contains", "b"), d, {})).toBe(true);
    expect(evaluateConditionGroup(make("step.tags", "contains", "z"), d, {})).toBe(false);
  });

  it("notContains", () => {
    expect(evaluateConditionGroup(make("personal.name", "notContains", "Bob"), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.name", "notContains", "lic"), data, externalVars)).toBe(false);
  });

  it("in", () => {
    expect(evaluateConditionGroup(make("personal.country", "in", ["fr", "be", "ch"]), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.country", "in", ["de", "uk"]), data, externalVars)).toBe(false);
  });

  it("notIn", () => {
    expect(evaluateConditionGroup(make("personal.country", "notIn", ["de", "uk"]), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.country", "notIn", ["fr", "be"]), data, externalVars)).toBe(false);
  });

  it("exists", () => {
    expect(evaluateConditionGroup(make("personal.age", "exists"), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.unknown", "exists"), data, externalVars)).toBe(false);
  });

  it("notExists", () => {
    expect(evaluateConditionGroup(make("personal.unknown", "notExists"), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("personal.age", "notExists"), data, externalVars)).toBe(false);
  });

  it("matches — valid regex", () => {
    const d: JourneyData = { step: { email: "alice@example.com" } };
    expect(evaluateConditionGroup(make("step.email", "matches", "^[^@]+@[^@]+\\.[^@]+$"), d, {})).toBe(true);
    expect(evaluateConditionGroup(make("step.email", "matches", "^\\d+$"), d, {})).toBe(false);
  });

  it("matches — invalid regex returns false", () => {
    const d: JourneyData = { step: { val: "test" } };
    expect(evaluateConditionGroup(make("step.val", "matches", "[invalid regex"), d, {})).toBe(false);
  });

  it("works with external variables", () => {
    expect(evaluateConditionGroup(make("$ext.isPremium", "equals", true), data, externalVars)).toBe(true);
    expect(evaluateConditionGroup(make("$ext.isPremium", "equals", false), data, externalVars)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// evaluateConditionGroup — combinators
// ---------------------------------------------------------------------------

describe("evaluateConditionGroup — combinators", () => {
  it("AND — all rules true → true", () => {
    const group: ConditionGroup = {
      combinator: "and",
      rules: [
        { field: "personal.age", operator: "greaterThan", value: 18 },
        { field: "personal.country", operator: "equals", value: "fr" },
      ],
    };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(true);
  });

  it("AND — one rule false → false", () => {
    const group: ConditionGroup = {
      combinator: "and",
      rules: [
        { field: "personal.age", operator: "greaterThan", value: 18 },
        { field: "personal.country", operator: "equals", value: "de" },
      ],
    };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(false);
  });

  it("OR — one rule true → true", () => {
    const group: ConditionGroup = {
      combinator: "or",
      rules: [
        { field: "personal.age", operator: "equals", value: 99 },
        { field: "personal.country", operator: "equals", value: "fr" },
      ],
    };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(true);
  });

  it("OR — all rules false → false", () => {
    const group: ConditionGroup = {
      combinator: "or",
      rules: [
        { field: "personal.age", operator: "equals", value: 99 },
        { field: "personal.country", operator: "equals", value: "de" },
      ],
    };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(false);
  });

  it("empty rules → true", () => {
    const group: ConditionGroup = { combinator: "and", rules: [] };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// evaluateConditionGroup — nested groups
// ---------------------------------------------------------------------------

describe("evaluateConditionGroup — nested groups", () => {
  it("AND group with nested OR subgroup — true", () => {
    const group: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "personal.age", operator: "greaterThan", value: 18 }],
      groups: [
        {
          combinator: "or",
          rules: [
            { field: "personal.country", operator: "equals", value: "de" },
            { field: "personal.country", operator: "equals", value: "fr" },
          ],
        },
      ],
    };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(true);
  });

  it("AND group with nested OR subgroup — false (subgroup fails)", () => {
    const group: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "personal.age", operator: "greaterThan", value: 18 }],
      groups: [
        {
          combinator: "or",
          rules: [
            { field: "personal.country", operator: "equals", value: "de" },
            { field: "personal.country", operator: "equals", value: "uk" },
          ],
        },
      ],
    };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(false);
  });

  it("deeply nested groups", () => {
    const group: ConditionGroup = {
      combinator: "and",
      rules: [],
      groups: [
        {
          combinator: "or",
          rules: [],
          groups: [
            {
              combinator: "and",
              rules: [{ field: "personal.age", operator: "equals", value: 25 }],
            },
          ],
        },
      ],
    };
    expect(evaluateConditionGroup(group, data, externalVars)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// evaluateConditionGroup — inEnum / notInEnum
// ---------------------------------------------------------------------------

describe("evaluateConditionGroup — inEnum / notInEnum", () => {
  const make = (field: string, operator: any, value?: unknown): ConditionGroup => ({
    combinator: "and",
    rules: [{ field, operator, value }],
  });

  const enums = [
    {
      id: "countries",
      label: "Countries",
      values: [
        { value: "fr", label: "France" },
        { value: "de", label: "Germany" },
        { value: "us", label: "United States" },
      ],
    },
    {
      id: "plans",
      label: "Plans",
      values: [
        { value: "free", label: "Free" },
        { value: "pro", label: "Pro" },
      ],
    },
  ];

  it("inEnum — true when field value is in the enum", () => {
    expect(
      evaluateConditionGroup(make("personal.country", "inEnum", "countries"), data, externalVars, enums)
    ).toBe(true);
  });

  it("inEnum — false when field value is not in the enum", () => {
    const d: JourneyData = { personal: { country: "jp" } };
    expect(
      evaluateConditionGroup(make("personal.country", "inEnum", "countries"), d, {}, enums)
    ).toBe(false);
  });

  it("notInEnum — true when field value is not in the enum", () => {
    const d: JourneyData = { personal: { country: "jp" } };
    expect(
      evaluateConditionGroup(make("personal.country", "notInEnum", "countries"), d, {}, enums)
    ).toBe(true);
  });

  it("notInEnum — false when field value is in the enum", () => {
    expect(
      evaluateConditionGroup(make("personal.country", "notInEnum", "countries"), data, externalVars, enums)
    ).toBe(false);
  });

  it("inEnum — false when enum id is unknown", () => {
    expect(
      evaluateConditionGroup(make("personal.country", "inEnum", "unknown_enum"), data, externalVars, enums)
    ).toBe(false);
  });

  it("inEnum — false when no externalEnums provided", () => {
    expect(
      evaluateConditionGroup(make("personal.country", "inEnum", "countries"), data, externalVars)
    ).toBe(false);
  });

  it("inEnum — matches numeric enum values as strings", () => {
    const d: JourneyData = { step: { score: 42 } };
    const numEnums = [{ id: "scores", label: "Scores", values: [{ value: 42, label: "42" }] }];
    expect(
      evaluateConditionGroup(make("step.score", "inEnum", "scores"), d, {}, numEnums)
    ).toBe(true);
  });

  it("inEnum — works with external variables", () => {
    const d: JourneyData = {};
    const ev = { plan: "pro" };
    expect(
      evaluateConditionGroup(make("$ext.plan", "inEnum", "plans"), d, ev, enums)
    ).toBe(true);
  });

  it("inEnum — works with OR combinator", () => {
    const d: JourneyData = { personal: { country: "jp" } };
    const group: ConditionGroup = {
      combinator: "or",
      rules: [
        { field: "personal.country", operator: "inEnum", value: "countries" },
        { field: "personal.country", operator: "equals", value: "jp" },
      ],
    };
    expect(evaluateConditionGroup(group, d, {}, enums)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isVisible
// ---------------------------------------------------------------------------

describe("isVisible", () => {
  it("returns true when no condition defined", () => {
    expect(isVisible(undefined, data, externalVars)).toBe(true);
  });

  it("returns true when condition is satisfied", () => {
    const condition: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "personal.age", operator: "greaterThan", value: 18 }],
    };
    expect(isVisible(condition, data, externalVars)).toBe(true);
  });

  it("returns false when condition is not satisfied", () => {
    const condition: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "personal.age", operator: "lessThan", value: 18 }],
    };
    expect(isVisible(condition, data, externalVars)).toBe(false);
  });

  it("supports inEnum operator when externalEnums provided", () => {
    const enums = [{ id: "eu", label: "EU", values: [{ value: "fr", label: "France" }, { value: "de", label: "Germany" }] }];
    const condition: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "personal.country", operator: "inEnum", value: "eu" }],
    };
    expect(isVisible(condition, data, externalVars, enums)).toBe(true);
    expect(isVisible(condition, data, externalVars)).toBe(false); // no enums → false
  });

  it("supports $step.X.skipped path", () => {
    const condition: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "$step.personal.skipped", operator: "equals", value: true }],
    };
    expect(isVisible(condition, data, externalVars, undefined, ["personal"])).toBe(true);
    expect(isVisible(condition, data, externalVars, undefined, [])).toBe(false);
  });
});
