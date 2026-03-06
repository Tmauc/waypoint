import type { SelectOption } from "@waypointjs/core";
import { useBuilderStore } from "../store/builder-store";
import { useBuilderExternalEnums } from "../context";

export interface FieldPath {
  path: string;       // e.g. "personal.age" or "$ext.isPremium"
  label: string;      // e.g. "Personal → Age" or "Ext: isPremium"
  stepId?: string;
  fieldId?: string;
  isExternal?: boolean;
  /** Resolved options (from externalEnumId or hardcoded options) — used by ConditionBuilder */
  options?: SelectOption[];
}

/**
 * Returns all field paths available across the entire journey tree,
 * including external variables. Used for autocomplete and condition builders.
 */
export function useAllFieldPaths(excludeStepId?: string, excludeFieldId?: string): FieldPath[] {
  const { schema } = useBuilderStore();
  const externalEnums = useBuilderExternalEnums();
  const paths: FieldPath[] = [];

  for (const step of schema.steps) {
    for (const field of step.fields) {
      if (step.id === excludeStepId && field.id === excludeFieldId) continue;

      // Resolve options: prefer externalEnumId, fall back to hardcoded options
      let options: SelectOption[] | undefined;
      if (field.externalEnumId) {
        options = externalEnums.find((e) => e.id === field.externalEnumId)?.values;
      } else if (field.options?.length) {
        options = field.options;
      }

      paths.push({
        path: `${step.id}.${field.id}`,
        label: `${step.title} → ${field.label}`,
        stepId: step.id,
        fieldId: field.id,
        options,
      });
    }
  }

  for (const extVar of schema.externalVariables ?? []) {
    paths.push({
      path: `$ext.${extVar.id}`,
      label: `Ext: ${extVar.label}`,
      isExternal: true,
    });
  }

  return paths;
}
