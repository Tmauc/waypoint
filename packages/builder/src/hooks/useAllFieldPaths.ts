import { useBuilderStore } from "../store/builder-store";

export interface FieldPath {
  path: string;       // e.g. "personal.age" or "$ext.isPremium"
  label: string;      // e.g. "Personal → Age" or "Ext: isPremium"
  stepId?: string;
  fieldId?: string;
  isExternal?: boolean;
}

/**
 * Returns all field paths available across the entire journey tree,
 * including external variables. Used for autocomplete and condition builders.
 */
export function useAllFieldPaths(excludeStepId?: string, excludeFieldId?: string): FieldPath[] {
  const { schema } = useBuilderStore();
  const paths: FieldPath[] = [];

  for (const step of schema.steps) {
    for (const field of step.fields) {
      if (step.id === excludeStepId && field.id === excludeFieldId) continue;
      paths.push({
        path: `${step.id}.${field.id}`,
        label: `${step.title} → ${field.label}`,
        stepId: step.id,
        fieldId: field.id,
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
