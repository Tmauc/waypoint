import { z } from "zod";

import type { ExternalEnum, FieldDefinition } from "./schema";
import type { ResolvedField } from "./tree-resolver";

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

function buildFieldSchema(field: FieldDefinition, externalEnums?: ExternalEnum[]): z.ZodTypeAny {
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

    for (const rule of rules) {
      if (rule.type === "min" || rule.type === "greaterThanOrEqual") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.gte(n, rule.message) as typeof numSchema;
      } else if (rule.type === "max" || rule.type === "lessThanOrEqual") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.lte(n, rule.message) as typeof numSchema;
      } else if (rule.type === "greaterThan") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.gt(n, rule.message) as typeof numSchema;
      } else if (rule.type === "lessThan") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.lt(n, rule.message) as typeof numSchema;
      } else if (rule.type === "equals") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.refine((v) => v === n, rule.message) as unknown as typeof numSchema;
      } else if (rule.type === "notEquals") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.refine((v) => v !== n, rule.message) as unknown as typeof numSchema;
      }
    }

    return isRequired ? numSchema : numSchema.optional();
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
      case "equals":
        if (rule.value !== undefined) {
          const eq = String(rule.value);
          refineRules.push({ fn: (v: unknown) => String(v) === eq, message: rule.message });
        }
        break;
      case "notEquals":
        if (rule.value !== undefined) {
          const neq = String(rule.value);
          refineRules.push({ fn: (v: unknown) => String(v) !== neq, message: rule.message });
        }
        break;
      case "greaterThan":
        if (rule.value !== undefined) {
          const gt = Number(rule.value);
          refineRules.push({ fn: (v: unknown) => Number(v) > gt, message: rule.message });
        }
        break;
      case "greaterThanOrEqual":
        if (rule.value !== undefined) {
          const gte = Number(rule.value);
          refineRules.push({ fn: (v: unknown) => Number(v) >= gte, message: rule.message });
        }
        break;
      case "lessThan":
        if (rule.value !== undefined) {
          const lt = Number(rule.value);
          refineRules.push({ fn: (v: unknown) => Number(v) < lt, message: rule.message });
        }
        break;
      case "lessThanOrEqual":
        if (rule.value !== undefined) {
          const lte = Number(rule.value);
          refineRules.push({ fn: (v: unknown) => Number(v) <= lte, message: rule.message });
        }
        break;
      case "contains":
        if (rule.value !== undefined) {
          const sub = String(rule.value);
          refineRules.push({ fn: (v: unknown) => String(v).includes(sub), message: rule.message });
        }
        break;
      case "notContains":
        if (rule.value !== undefined) {
          const nsub = String(rule.value);
          refineRules.push({ fn: (v: unknown) => !String(v).includes(nsub), message: rule.message });
        }
        break;
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
  externalEnums?: ExternalEnum[]
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  for (const resolvedField of fields) {
    if (!resolvedField.visible) continue;
    shape[resolvedField.definition.id] = buildFieldSchema(resolvedField.definition, externalEnums);
  }

  return z.object(shape);
}
