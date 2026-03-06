import { z } from "zod";

import type { ExternalEnum, FieldDefinition, ValidationRule } from "./schema";
import type { ResolvedField } from "./tree-resolver";
import type { JourneyData } from "./conditions";
import { resolveFieldValue } from "./conditions";

// ---------------------------------------------------------------------------
// Custom validator registry
// ---------------------------------------------------------------------------

const customValidatorRegistry: Record<string, (value: unknown) => boolean> = {};

/**
 * Register a custom validator function by id.
 * Used for ValidationRule type="custom" with a matching customValidatorId.
 */
export function registerCustomValidator(
  id: string,
  fn: (value: unknown) => boolean
): void {
  customValidatorRegistry[id] = fn;
}

// ---------------------------------------------------------------------------
// Field schema builder
// ---------------------------------------------------------------------------

/**
 * Resolve the comparison value for a validation rule.
 * If `refField` is set, resolve from journey data; otherwise use static `value`.
 */
function resolveRuleValue(rule: ValidationRule, data?: JourneyData): unknown {
  if (rule.refField && data) {
    return resolveFieldValue(rule.refField, data, {});
  }
  return rule.value;
}

function buildFieldSchema(field: FieldDefinition, externalEnums?: ExternalEnum[], data?: JourneyData): z.ZodTypeAny {
  const rules = field.validation ?? [];
  const isRequired = rules.some((r) => r.type === "required");
  const isNumeric = field.type === "number";
  const isCheckbox = field.type === "checkbox";
  const isMultiSelect = field.type === "multiselect";

  if (isCheckbox) {
    const base = z.boolean();
    return isRequired ? base : base.optional();
  }

  if (isMultiSelect) {
    const base = z.array(z.string());
    return isRequired ? base.min(1, rules.find((r) => r.type === "required")?.message ?? "Required") : base.optional();
  }

  if (isNumeric) {
    let numSchema = z.coerce.number({
      invalid_type_error: "Must be a number",
    });

    const numRefineRules: Array<{ fn: (v: number) => boolean; message: string }> = [];

    for (const rule of rules) {
      const rv = resolveRuleValue(rule, data);
      const isRef = !!rule.refField;

      if (rule.type === "min" || rule.type === "greaterThanOrEqual") {
        const n = Number(rv);
        if (!isNaN(n)) {
          if (isRef) numRefineRules.push({ fn: (v) => v >= n, message: rule.message });
          else numSchema = numSchema.gte(n, rule.message) as typeof numSchema;
        }
      } else if (rule.type === "max" || rule.type === "lessThanOrEqual") {
        const n = Number(rv);
        if (!isNaN(n)) {
          if (isRef) numRefineRules.push({ fn: (v) => v <= n, message: rule.message });
          else numSchema = numSchema.lte(n, rule.message) as typeof numSchema;
        }
      } else if (rule.type === "greaterThan") {
        const n = Number(rv);
        if (!isNaN(n)) {
          if (isRef) numRefineRules.push({ fn: (v) => v > n, message: rule.message });
          else numSchema = numSchema.gt(n, rule.message) as typeof numSchema;
        }
      } else if (rule.type === "lessThan") {
        const n = Number(rv);
        if (!isNaN(n)) {
          if (isRef) numRefineRules.push({ fn: (v) => v < n, message: rule.message });
          else numSchema = numSchema.lt(n, rule.message) as typeof numSchema;
        }
      } else if (rule.type === "equals") {
        const n = Number(rv);
        if (!isNaN(n)) numRefineRules.push({ fn: (v) => v === n, message: rule.message });
      } else if (rule.type === "notEquals") {
        const n = Number(rv);
        if (!isNaN(n)) numRefineRules.push({ fn: (v) => v !== n, message: rule.message });
      }
    }

    let numFinal: z.ZodTypeAny = isRequired ? numSchema : numSchema.optional();
    for (const { fn, message } of numRefineRules) {
      numFinal = numFinal.refine((v) => v == null || fn(v as number), message);
    }
    return numFinal;
  }

  // String-based fields — build base schema first (ZodString methods only),
  // then apply .refine() transforms last (they return ZodEffects, not ZodString).
  let strSchema = z.string();

  const refineRules: Array<{ fn: (v: unknown) => boolean; message: string }> = [];

  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        strSchema = strSchema.min(1, rule.message);
        break;
      case "minLength": {
        const n = Number(rule.value);
        if (!isNaN(n)) strSchema = strSchema.min(n, rule.message);
        break;
      }
      case "maxLength": {
        const n = Number(rule.value);
        if (!isNaN(n)) strSchema = strSchema.max(n, rule.message);
        break;
      }
      case "email":
        strSchema = strSchema.email(rule.message);
        break;
      case "url":
        strSchema = strSchema.url(rule.message);
        break;
      case "regex":
        if (rule.value !== undefined && rule.value !== null) {
          strSchema = strSchema.regex(new RegExp(String(rule.value)), rule.message);
        }
        break;
      case "equals": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const eq = String(rv);
          refineRules.push({ fn: (v: unknown) => String(v) === eq, message: rule.message });
        }
        break;
      }
      case "notEquals": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const neq = String(rv);
          refineRules.push({ fn: (v: unknown) => String(v) !== neq, message: rule.message });
        }
        break;
      }
      case "greaterThan": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const gt = Number(rv);
          refineRules.push({ fn: (v: unknown) => Number(v) > gt, message: rule.message });
        }
        break;
      }
      case "greaterThanOrEqual": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const gte = Number(rv);
          refineRules.push({ fn: (v: unknown) => Number(v) >= gte, message: rule.message });
        }
        break;
      }
      case "lessThan": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const lt = Number(rv);
          refineRules.push({ fn: (v: unknown) => Number(v) < lt, message: rule.message });
        }
        break;
      }
      case "lessThanOrEqual": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const lte = Number(rv);
          refineRules.push({ fn: (v: unknown) => Number(v) <= lte, message: rule.message });
        }
        break;
      }
      case "contains": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const sub = String(rv);
          refineRules.push({ fn: (v: unknown) => String(v).includes(sub), message: rule.message });
        }
        break;
      }
      case "notContains": {
        const rv = resolveRuleValue(rule, data);
        if (rv !== undefined) {
          const nsub = String(rv);
          refineRules.push({ fn: (v: unknown) => !String(v).includes(nsub), message: rule.message });
        }
        break;
      }
      case "matches":
        if (rule.value !== undefined && rule.value !== null) {
          const rx = new RegExp(String(rule.value));
          refineRules.push({ fn: (v: unknown) => rx.test(String(v)), message: rule.message });
        }
        break;
      case "inEnum":
        if (rule.value && externalEnums) {
          const enumDef = externalEnums.find((e) => e.id === String(rule.value));
          if (enumDef) {
            const values = enumDef.values.map((v) => String(v.value));
            refineRules.push({ fn: (v: unknown) => values.includes(String(v)), message: rule.message });
          }
        }
        break;
      case "notInEnum":
        if (rule.value && externalEnums) {
          const enumDef = externalEnums.find((e) => e.id === String(rule.value));
          if (enumDef) {
            const values = enumDef.values.map((v) => String(v.value));
            refineRules.push({ fn: (v: unknown) => !values.includes(String(v)), message: rule.message });
          }
        }
        break;
      case "custom":
        if (rule.customValidatorId && customValidatorRegistry[rule.customValidatorId]) {
          refineRules.push({ fn: (v: unknown) => Boolean(customValidatorRegistry[rule.customValidatorId!]?.(v)), message: rule.message });
        }
        break;
    }
  }

  // Apply optional before refines (ZodString → ZodOptional or keep as ZodString)
  let finalSchema: z.ZodTypeAny = isRequired ? strSchema : strSchema.optional();

  // Append custom .refine() calls (return ZodEffects, safe as ZodTypeAny)
  for (const { fn, message } of refineRules) {
    finalSchema = finalSchema.refine(fn, message);
  }

  return finalSchema;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds a Zod object schema from a list of resolved fields.
 *
 * - Only visible fields are included in the schema.
 * - Fields without a `required` validation rule are wrapped in `.optional()`.
 * - Numeric fields use `z.coerce.number()` so string inputs are coerced.
 */
export function buildZodSchema(
  fields: ResolvedField[],
  externalEnums?: ExternalEnum[],
  data?: JourneyData
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  for (const resolvedField of fields) {
    if (!resolvedField.visible) continue;
    shape[resolvedField.definition.id] = buildFieldSchema(resolvedField.definition, externalEnums, data);
  }

  return z.object(shape);
}
