/**
 * Runtime validation for WaypointSchema JSON.
 *
 * Validates structure and basic constraints without relying on TypeScript types.
 * Designed to be used at import time (builder) and at boot time (runtime).
 */

import type { WaypointSchema } from "./schema";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_VERSIONS = ["1"] as const;

const VALID_PERSISTENCE_MODES = new Set(["zustand", "backend-step", "backend-manual"]);

const VALID_EXT_VAR_TYPES = new Set(["string", "number", "boolean", "object"]);

const VALID_CONDITION_OPERATORS = new Set([
  "equals", "notEquals",
  "greaterThan", "greaterThanOrEqual",
  "lessThan", "lessThanOrEqual",
  "contains", "notContains",
  "in", "notIn",
  "exists", "notExists",
  "matches",
]);

const VALID_VALIDATION_TYPES = new Set([
  "required", "min", "max", "minLength", "maxLength", "email", "url", "regex", "custom",
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a raw parsed JSON value as a WaypointSchema.
 *
 * Returns `{ valid: true, errors: [] }` when the schema is acceptable.
 * Returns `{ valid: false, errors: [...] }` with a list of human-readable errors otherwise.
 */
export function validateSchema(raw: unknown): SchemaValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, errors: ["Root must be a JSON object"] };
  }

  const obj = raw as Record<string, unknown>;

  // ── Top-level required fields ────────────────────────────────────────────

  // version
  if (!("version" in obj)) {
    errors.push('Missing required field "version"');
  } else if (!SUPPORTED_VERSIONS.includes(obj.version as typeof SUPPORTED_VERSIONS[number])) {
    errors.push(`Unsupported version "${obj.version}". Supported: ${SUPPORTED_VERSIONS.join(", ")}`);
  }

  // id
  if (!("id" in obj) || typeof obj.id !== "string" || !obj.id.trim()) {
    errors.push('Field "id" must be a non-empty string');
  }

  // name
  if (!("name" in obj) || typeof obj.name !== "string" || !obj.name.trim()) {
    errors.push('Field "name" must be a non-empty string');
  }

  // steps
  if (!("steps" in obj) || !Array.isArray(obj.steps)) {
    errors.push('Field "steps" must be an array');
  } else {
    validateSteps(obj.steps, errors);
  }

  // persistenceMode (optional)
  if ("persistenceMode" in obj && !VALID_PERSISTENCE_MODES.has(obj.persistenceMode as string)) {
    errors.push(
      `Invalid "persistenceMode" "${obj.persistenceMode}". Must be one of: ${[...VALID_PERSISTENCE_MODES].join(", ")}`,
    );
  }

  // externalVariables (optional)
  if ("externalVariables" in obj) {
    if (!Array.isArray(obj.externalVariables)) {
      errors.push('"externalVariables" must be an array');
    } else {
      validateExternalVariables(obj.externalVariables, errors);
    }
  }

  // customTypes (optional)
  if ("customTypes" in obj && !Array.isArray(obj.customTypes)) {
    errors.push('"customTypes" must be an array');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function validateSteps(steps: unknown[], errors: string[]) {
  const seenIds = new Set<string>();

  steps.forEach((step, i) => {
    const prefix = `steps[${i}]`;

    if (!step || typeof step !== "object" || Array.isArray(step)) {
      errors.push(`${prefix}: must be an object`);
      return;
    }

    const s = step as Record<string, unknown>;

    // id
    if (typeof s.id !== "string" || !s.id.trim()) {
      errors.push(`${prefix}: "id" must be a non-empty string`);
    } else if (seenIds.has(s.id)) {
      errors.push(`${prefix}: duplicate step id "${s.id}"`);
    } else {
      seenIds.add(s.id);
    }

    // title
    if (typeof s.title !== "string" || !s.title.trim()) {
      errors.push(`${prefix}: "title" must be a non-empty string`);
    }

    // url
    if (typeof s.url !== "string" || !s.url.trim()) {
      errors.push(`${prefix}: "url" must be a non-empty string`);
    }

    // fields
    if (!Array.isArray(s.fields)) {
      errors.push(`${prefix}: "fields" must be an array`);
    } else {
      validateFields(s.fields, s.id as string, prefix, errors);
    }

    // visibleWhen (optional)
    if ("visibleWhen" in s) {
      validateConditionGroup(s.visibleWhen, `${prefix}.visibleWhen`, errors);
    }
  });
}

function validateFields(
  fields: unknown[],
  stepId: string,
  parentPrefix: string,
  errors: string[],
) {
  const seenIds = new Set<string>();

  fields.forEach((field, i) => {
    const prefix = `${parentPrefix}.fields[${i}]`;

    if (!field || typeof field !== "object" || Array.isArray(field)) {
      errors.push(`${prefix}: must be an object`);
      return;
    }

    const f = field as Record<string, unknown>;

    // id
    if (typeof f.id !== "string" || !f.id.trim()) {
      errors.push(`${prefix}: "id" must be a non-empty string`);
    } else if (seenIds.has(f.id)) {
      errors.push(`${prefix}: duplicate field id "${f.id}" in step "${stepId}"`);
    } else {
      seenIds.add(f.id as string);
    }

    // type
    if (typeof f.type !== "string" || !f.type.trim()) {
      errors.push(`${prefix}: "type" must be a non-empty string`);
    }

    // label
    if (typeof f.label !== "string" || !f.label.trim()) {
      errors.push(`${prefix}: "label" must be a non-empty string`);
    }

    // options (optional)
    if ("options" in f && !Array.isArray(f.options)) {
      errors.push(`${prefix}: "options" must be an array`);
    }

    // validation (optional)
    if ("validation" in f) {
      if (!Array.isArray(f.validation)) {
        errors.push(`${prefix}: "validation" must be an array`);
      } else {
        validateValidationRules(f.validation, prefix, errors);
      }
    }

    // dependsOn (optional)
    if ("dependsOn" in f) {
      if (!Array.isArray(f.dependsOn)) {
        errors.push(`${prefix}: "dependsOn" must be an array`);
      } else {
        for (const dep of f.dependsOn as unknown[]) {
          if (typeof dep !== "string") {
            errors.push(`${prefix}: each "dependsOn" entry must be a string`);
          }
        }
      }
    }

    // visibleWhen (optional)
    if ("visibleWhen" in f) {
      validateConditionGroup(f.visibleWhen, `${prefix}.visibleWhen`, errors);
    }
  });
}

function validateConditionGroup(group: unknown, prefix: string, errors: string[]) {
  if (!group || typeof group !== "object" || Array.isArray(group)) {
    errors.push(`${prefix}: must be an object`);
    return;
  }

  const g = group as Record<string, unknown>;

  if (g.combinator !== "and" && g.combinator !== "or") {
    errors.push(`${prefix}: "combinator" must be "and" or "or"`);
  }

  if (!Array.isArray(g.rules)) {
    errors.push(`${prefix}: "rules" must be an array`);
  } else {
    (g.rules as unknown[]).forEach((rule, i) => {
      validateConditionRule(rule, `${prefix}.rules[${i}]`, errors);
    });
  }

  if ("groups" in g && Array.isArray(g.groups)) {
    (g.groups as unknown[]).forEach((nested, i) => {
      validateConditionGroup(nested, `${prefix}.groups[${i}]`, errors);
    });
  }
}

function validateConditionRule(rule: unknown, prefix: string, errors: string[]) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    errors.push(`${prefix}: must be an object`);
    return;
  }

  const r = rule as Record<string, unknown>;

  if (typeof r.field !== "string" || !r.field.trim()) {
    errors.push(`${prefix}: "field" must be a non-empty string`);
  }

  if (!VALID_CONDITION_OPERATORS.has(r.operator as string)) {
    errors.push(
      `${prefix}: invalid operator "${r.operator}". Must be one of: ${[...VALID_CONDITION_OPERATORS].join(", ")}`,
    );
  }
}

function validateValidationRules(rules: unknown[], parentPrefix: string, errors: string[]) {
  rules.forEach((rule, i) => {
    const prefix = `${parentPrefix}.validation[${i}]`;

    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      errors.push(`${prefix}: must be an object`);
      return;
    }

    const r = rule as Record<string, unknown>;

    if (!VALID_VALIDATION_TYPES.has(r.type as string)) {
      errors.push(
        `${prefix}: invalid type "${r.type}". Must be one of: ${[...VALID_VALIDATION_TYPES].join(", ")}`,
      );
    }

    if (typeof r.message !== "string" || !r.message.trim()) {
      errors.push(`${prefix}: "message" must be a non-empty string`);
    }
  });
}

function validateExternalVariables(vars: unknown[], errors: string[]) {
  const seenIds = new Set<string>();

  vars.forEach((v, i) => {
    const prefix = `externalVariables[${i}]`;

    if (!v || typeof v !== "object" || Array.isArray(v)) {
      errors.push(`${prefix}: must be an object`);
      return;
    }

    const ev = v as Record<string, unknown>;

    if (typeof ev.id !== "string" || !ev.id.trim()) {
      errors.push(`${prefix}: "id" must be a non-empty string`);
    } else if (seenIds.has(ev.id)) {
      errors.push(`${prefix}: duplicate external variable id "${ev.id}"`);
    } else {
      seenIds.add(ev.id as string);
    }

    if (typeof ev.label !== "string" || !ev.label.trim()) {
      errors.push(`${prefix}: "label" must be a non-empty string`);
    }

    if (!VALID_EXT_VAR_TYPES.has(ev.type as string)) {
      errors.push(
        `${prefix}: invalid type "${ev.type}". Must be one of: ${[...VALID_EXT_VAR_TYPES].join(", ")}`,
      );
    }

    if (typeof ev.blocking !== "boolean") {
      errors.push(`${prefix}: "blocking" must be a boolean`);
    }
  });
}

/**
 * Convenience: assert a schema is valid, throw with all errors if not.
 * Useful in tests or runtime boot checks.
 */
export function assertSchema(raw: unknown): asserts raw is WaypointSchema {
  const result = validateSchema(raw);
  if (!result.valid) {
    throw new Error(`Invalid WaypointSchema:\n${result.errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}
