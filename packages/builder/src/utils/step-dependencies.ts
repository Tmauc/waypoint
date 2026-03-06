import type { ConditionGroup, WaypointSchema } from "@waypointjs/core";

/**
 * For a given step, returns the set of step IDs it depends on.
 * A step depends on another when any of its fields:
 *   - has a `dependsOn` path referencing that step ("otherId.fieldId")
 *   - has a `visibleWhen` condition rule referencing that step
 * Or when the step itself has a `visibleWhen` condition referencing that step.
 */

function extractStepIdsFromCondition(
  group: ConditionGroup | undefined,
  ownStepId: string
): Set<string> {
  const ids = new Set<string>();
  if (!group) return ids;

  for (const rule of group.rules) {
    if (rule.field.startsWith("$ext.")) continue;
    const dotIndex = rule.field.indexOf(".");
    if (dotIndex === -1) continue;
    const refStep = rule.field.slice(0, dotIndex);
    if (refStep !== ownStepId) ids.add(refStep);
  }

  for (const subGroup of group.groups ?? []) {
    for (const id of extractStepIdsFromCondition(subGroup, ownStepId)) {
      ids.add(id);
    }
  }

  return ids;
}

/** Returns a map: stepId → Set<stepId it depends on> */
export function computeStepDependencies(
  schema: WaypointSchema
): Map<string, Set<string>> {
  const deps = new Map<string, Set<string>>();

  for (const step of schema.steps) {
    const required = new Set<string>();

    // Step-level condition
    for (const id of extractStepIdsFromCondition(step.visibleWhen, step.id)) {
      required.add(id);
    }

    // Field-level
    for (const field of step.fields) {
      // dependsOn paths
      for (const path of field.dependsOn ?? []) {
        if (path.startsWith("$ext.")) continue;
        const dotIndex = path.indexOf(".");
        if (dotIndex === -1) continue;
        const refStep = path.slice(0, dotIndex);
        if (refStep !== step.id) required.add(refStep);
      }

      // visibleWhen condition
      for (const id of extractStepIdsFromCondition(field.visibleWhen, step.id)) {
        required.add(id);
      }
    }

    deps.set(step.id, required);
  }

  return deps;
}

/**
 * Given the current step order and the dependency map,
 * returns whether moving the step at `fromIndex` to `toIndex` is valid.
 *
 * A move is invalid if it would place a step BEFORE one of its dependencies.
 */
export function isMoveValid(
  steps: WaypointSchema["steps"],
  deps: Map<string, Set<string>>,
  fromIndex: number,
  toIndex: number
): { valid: boolean; reason?: string } {
  if (fromIndex === toIndex) return { valid: true };

  // Simulate the new order
  const reordered = [...steps];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  const indexById = new Map(reordered.map((s, i) => [s.id, i]));

  for (const step of reordered) {
    const stepIndex = indexById.get(step.id)!;
    const required = deps.get(step.id) ?? new Set();

    for (const depId of required) {
      const depIndex = indexById.get(depId);
      if (depIndex === undefined) continue; // dep step not in schema (external?)

      if (depIndex > stepIndex) {
        const depTitle = reordered.find((s) => s.id === depId)?.title ?? depId;
        return {
          valid: false,
          reason: `"${step.title}" depends on "${depTitle}" which must come first`,
        };
      }
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Field-level dependency helpers (within a single step)
// ---------------------------------------------------------------------------

/**
 * Returns whether moving a field from `fromIndex` to `toIndex` within a step
 * is valid given intra-step `dependsOn` references.
 *
 * Only considers dependencies between fields within the same step
 * (cross-step deps are already enforced at the step level).
 */
export function isFieldMoveValid(
  fields: WaypointSchema["steps"][number]["fields"],
  stepId: string,
  fromIndex: number,
  toIndex: number
): { valid: boolean; reason?: string } {
  if (fromIndex === toIndex) return { valid: true };

  const reordered = [...fields];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  const indexById = new Map(reordered.map((f, i) => [f.id, i]));

  for (const field of reordered) {
    const fieldIndex = indexById.get(field.id)!;
    for (const path of field.dependsOn ?? []) {
      if (path.startsWith("$ext.")) continue;
      const dotIndex = path.indexOf(".");
      if (dotIndex === -1) continue;
      const refStep = path.slice(0, dotIndex);
      if (refStep !== stepId) continue; // cross-step dep, not relevant here
      const refFieldId = path.slice(dotIndex + 1);
      const depIndex = indexById.get(refFieldId);
      if (depIndex === undefined) continue;
      if (depIndex > fieldIndex) {
        const depLabel = reordered.find((f) => f.id === refFieldId)?.label ?? refFieldId;
        return {
          valid: false,
          reason: `"${field.label}" depends on "${depLabel}" which must come first`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Returns the human-readable label for a step's dependencies (other step titles).
 */
export function getStepDependencyLabels(
  stepId: string,
  deps: Map<string, Set<string>>,
  schema: WaypointSchema
): string[] {
  const required = deps.get(stepId) ?? new Set();
  return [...required]
    .map((id) => schema.steps.find((s) => s.id === id)?.title ?? id)
    .filter(Boolean);
}
