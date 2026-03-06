import type { ConditionGroup, ConditionOperator, ConditionRule, ExternalEnum } from "./schema";

// ---------------------------------------------------------------------------
// Data context
// ---------------------------------------------------------------------------

/**
 * All journey data, keyed by stepId then fieldId.
 * Example: { personal: { age: 25, name: "Alice" }, billing: { plan: "pro" } }
 */
export type JourneyData = Record<string, Record<string, unknown>>;

/**
 * External variables injected at runtime.
 * Example: { isPremium: true, userId: "abc-123" }
 */
export type ExternalVars = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a field path to its value from the data context.
 * - "stepId.fieldId"       → journey data
 * - "$ext.varId"           → external variable
 * - "$step.stepId.skipped" → whether the step was skipped (boolean)
 */
export function resolveFieldValue(
  path: string,
  data: JourneyData,
  externalVars: ExternalVars,
  skippedSteps?: string[]
): unknown {
  if (path.startsWith("$ext.")) {
    const varId = path.slice(5);
    return externalVars[varId];
  }

  if (path.startsWith("$step.") && path.endsWith(".skipped")) {
    const stepId = path.slice(6, -8); // "$step.".length=6, ".skipped".length=8
    return skippedSteps?.includes(stepId) ?? false;
  }

  const dotIndex = path.indexOf(".");
  if (dotIndex === -1) return undefined;

  const stepId = path.slice(0, dotIndex);
  const fieldId = path.slice(dotIndex + 1);
  return data[stepId]?.[fieldId];
}

// ---------------------------------------------------------------------------
// Operator evaluation
// ---------------------------------------------------------------------------

function evaluateOperator(
  operator: ConditionOperator,
  actual: unknown,
  expected: unknown
): boolean {
  switch (operator) {
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";

    case "notExists":
      return actual === undefined || actual === null || actual === "";

    case "equals":
      return actual === expected;

    case "notEquals":
      return actual !== expected;

    case "greaterThan":
      return typeof actual === "number" && typeof expected === "number"
        ? actual > expected
        : Number(actual) > Number(expected);

    case "greaterThanOrEqual":
      return typeof actual === "number" && typeof expected === "number"
        ? actual >= expected
        : Number(actual) >= Number(expected);

    case "lessThan":
      return typeof actual === "number" && typeof expected === "number"
        ? actual < expected
        : Number(actual) < Number(expected);

    case "lessThanOrEqual":
      return typeof actual === "number" && typeof expected === "number"
        ? actual <= expected
        : Number(actual) <= Number(expected);

    case "contains":
      if (typeof actual === "string" && typeof expected === "string") {
        return actual.includes(expected);
      }
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;

    case "notContains":
      if (typeof actual === "string" && typeof expected === "string") {
        return !actual.includes(expected);
      }
      if (Array.isArray(actual)) {
        return !actual.includes(expected);
      }
      return true;

    case "in":
      return Array.isArray(expected) && expected.includes(actual);

    case "notIn":
      return Array.isArray(expected) && !expected.includes(actual);

    case "matches":
      if (typeof actual !== "string" || typeof expected !== "string") return false;
      try {
        return new RegExp(expected).test(actual);
      } catch {
        return false;
      }

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Rule & group evaluation
// ---------------------------------------------------------------------------

function evaluateRule(
  rule: ConditionRule,
  data: JourneyData,
  externalVars: ExternalVars,
  externalEnums?: ExternalEnum[],
  skippedSteps?: string[]
): boolean {
  const actual = resolveFieldValue(rule.field, data, externalVars, skippedSteps);

  if ((rule.operator === "inEnum" || rule.operator === "notInEnum") && externalEnums) {
    const enumDef = externalEnums.find((e) => e.id === String(rule.value));
    const values = enumDef?.values.map((v) => String(v.value)) ?? [];
    return rule.operator === "inEnum"
      ? values.includes(String(actual))
      : !values.includes(String(actual));
  }

  return evaluateOperator(rule.operator, actual, rule.value);
}

/**
 * Evaluates a condition group against the current data context.
 * Returns true if the group's conditions are satisfied.
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  data: JourneyData,
  externalVars: ExternalVars,
  externalEnums?: ExternalEnum[],
  skippedSteps?: string[]
): boolean {
  const ruleResults = group.rules.map((rule) =>
    evaluateRule(rule, data, externalVars, externalEnums, skippedSteps)
  );

  const groupResults = (group.groups ?? []).map((subGroup) =>
    evaluateConditionGroup(subGroup, data, externalVars, externalEnums, skippedSteps)
  );

  const allResults = [...ruleResults, ...groupResults];

  if (allResults.length === 0) return true;

  return group.combinator === "and"
    ? allResults.every(Boolean)
    : allResults.some(Boolean);
}

/**
 * Convenience: returns true if no condition is defined (always visible),
 * or if the condition group evaluates to true.
 */
export function isVisible(
  visibleWhen: ConditionGroup | undefined,
  data: JourneyData,
  externalVars: ExternalVars,
  externalEnums?: ExternalEnum[],
  skippedSteps?: string[]
): boolean {
  if (!visibleWhen) return true;
  return evaluateConditionGroup(visibleWhen, data, externalVars, externalEnums, skippedSteps);
}
