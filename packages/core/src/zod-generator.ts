import { z } from "zod";

import type { FieldDefinition } from "./schema";
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

function buildFieldSchema(field: FieldDefinition): z.ZodTypeAny {
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
      if (rule.type === "min") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.gte(n, rule.message) as typeof numSchema;
      } else if (rule.type === "max") {
        const n = Number(rule.value);
        if (!isNaN(n)) numSchema = numSchema.lte(n, rule.message) as typeof numSchema;
      }
    }

    return isRequired ? numSchema : numSchema.optional();
  }

  // String-based fields — build base schema first (ZodString methods only),
  // then apply .refine() transforms last (they return ZodEffects, not ZodString).
  let strSchema = z.string();

  const refineRules: Array<{ id: string; message: string }> = [];

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
      case "custom":
        if (rule.customValidatorId && customValidatorRegistry[rule.customValidatorId]) {
          refineRules.push({ id: rule.customValidatorId, message: rule.message });
        }
        break;
    }
  }

  // Apply optional before refines (ZodString → ZodOptional or keep as ZodString)
  let finalSchema: z.ZodTypeAny = isRequired ? strSchema : strSchema.optional();

  // Append custom .refine() calls (return ZodEffects, safe as ZodTypeAny)
  for (const { id, message } of refineRules) {
    finalSchema = finalSchema.refine(
      (val) => Boolean(customValidatorRegistry[id]?.(val)),
      message
    );
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
  fields: ResolvedField[]
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  for (const resolvedField of fields) {
    if (!resolvedField.visible) continue;
    shape[resolvedField.definition.id] = buildFieldSchema(resolvedField.definition);
  }

  return z.object(shape);
}
