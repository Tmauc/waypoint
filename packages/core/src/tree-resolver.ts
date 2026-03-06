import type { ExternalVariable, FieldDefinition, StepDefinition, WaypointSchema } from "./schema";
import { type ExternalVars, type JourneyData, isVisible, resolveFieldValue } from "./conditions";

// ---------------------------------------------------------------------------
// Resolved types
// ---------------------------------------------------------------------------

/** A field after condition evaluation */
export interface ResolvedField {
  definition: FieldDefinition;
  /** Whether the field is currently visible */
  visible: boolean;
  /** Whether all dependsOn paths have a non-empty value */
  dependenciesMet: boolean;
}

/** A step after condition evaluation */
export interface ResolvedStep {
  definition: StepDefinition;
  /** Whether this step is currently in the active tree */
  visible: boolean;
  /** Visible fields for this step, in definition order */
  fields: ResolvedField[];
}

/** Result returned by resolveTree */
export interface ResolvedTree {
  /** Ordered list of visible steps */
  steps: ResolvedStep[];
  /** Steps hidden by conditions — data preserved in tmp store */
  hiddenSteps: ResolvedStep[];
  /** Errors: external variables required but missing */
  missingExternalVars: string[];
}

// ---------------------------------------------------------------------------
// Dependency check
// ---------------------------------------------------------------------------

function areDependenciesMet(
  dependsOn: string[] | undefined,
  data: JourneyData,
  externalVars: ExternalVars
): boolean {
  if (!dependsOn || dependsOn.length === 0) return true;
  return dependsOn.every((path) => {
    const value = resolveFieldValue(path, data, externalVars);
    return value !== undefined && value !== null && value !== "";
  });
}

// ---------------------------------------------------------------------------
// External variable validation
// ---------------------------------------------------------------------------

function findMissingBlockingVars(
  externalVariables: ExternalVariable[] | undefined,
  externalVars: ExternalVars,
  visibleSteps: StepDefinition[]
): string[] {
  if (!externalVariables || externalVariables.length === 0) return [];

  const visibleStepIds = new Set(visibleSteps.map((s) => s.id));

  return externalVariables
    .filter((extVar) => {
      if (!extVar.blocking) return false;

      // Only check if this variable is actually used by a visible step
      const usedInVisibleStep = extVar.usedIn?.some(
        (ref) => visibleStepIds.has(ref.stepId)
      );
      if (!usedInVisibleStep) return false;

      const value = externalVars[extVar.id];
      return value === undefined || value === null;
    })
    .map((extVar) => extVar.id);
}

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

/**
 * Resolves the journey tree against current data and external variables.
 *
 * - Steps with a falsy `visibleWhen` are moved to `hiddenSteps`
 * - Fields within each visible step are evaluated for visibility and dependencies
 * - Missing blocking external variables are reported
 *
 * This function is pure: same inputs always produce same outputs.
 */
export function resolveTree(
  schema: WaypointSchema,
  data: JourneyData,
  externalVars: ExternalVars
): ResolvedTree {
  const visibleSteps: ResolvedStep[] = [];
  const hiddenSteps: ResolvedStep[] = [];

  for (const stepDef of schema.steps) {
    const stepVisible = isVisible(stepDef.visibleWhen, data, externalVars);

    const resolvedFields: ResolvedField[] = stepDef.fields.map((fieldDef) => ({
      definition: fieldDef,
      visible: isVisible(fieldDef.visibleWhen, data, externalVars),
      dependenciesMet: areDependenciesMet(fieldDef.dependsOn, data, externalVars),
    }));

    const resolvedStep: ResolvedStep = {
      definition: stepDef,
      visible: stepVisible,
      fields: resolvedFields,
    };

    if (stepVisible) {
      visibleSteps.push(resolvedStep);
    } else {
      hiddenSteps.push(resolvedStep);
    }
  }

  const missingExternalVars = findMissingBlockingVars(
    schema.externalVariables,
    externalVars,
    visibleSteps.map((s) => s.definition)
  );

  return {
    steps: visibleSteps,
    hiddenSteps,
    missingExternalVars,
  };
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Returns the index of the step with the given id in the resolved (visible) tree.
 * Returns -1 if not found.
 */
export function findStepIndex(steps: ResolvedStep[], stepId: string): number {
  return steps.findIndex((s) => s.definition.id === stepId);
}

/**
 * Returns the next visible step after the given stepId, or undefined if last.
 */
export function getNextStep(
  steps: ResolvedStep[],
  currentStepId: string
): ResolvedStep | undefined {
  const index = findStepIndex(steps, currentStepId);
  if (index === -1 || index === steps.length - 1) return undefined;
  return steps[index + 1];
}

/**
 * Returns the previous visible step before the given stepId, or undefined if first.
 */
export function getPreviousStep(
  steps: ResolvedStep[],
  currentStepId: string
): ResolvedStep | undefined {
  const index = findStepIndex(steps, currentStepId);
  if (index <= 0) return undefined;
  return steps[index - 1];
}

/**
 * Calculates progress (0–100) based on the resolved visible tree.
 * Uses the index of the current step in the visible tree.
 */
export function calculateProgress(
  steps: ResolvedStep[],
  currentStepId: string
): number {
  if (steps.length === 0) return 0;
  const index = findStepIndex(steps, currentStepId);
  if (index === -1) return 0;
  return Math.round(((index + 1) / (steps.length + 1)) * 100);
}

/**
 * Given journey data, finds the deepest step the user can access:
 * the last step in the visible tree for which all visible fields
 * have their dependencies met.
 */
export function findLastValidStep(
  steps: ResolvedStep[],
  data: JourneyData,
  _externalVars: ExternalVars
): ResolvedStep | undefined {
  let lastValid: ResolvedStep | undefined;

  for (const step of steps) {
    const visibleFields = step.fields.filter((f) => f.visible);
    const allDepsMet = visibleFields.every((f) => f.dependenciesMet);

    // A step is "reachable" if all its visible required fields' deps are met
    if (allDepsMet) {
      // Check if the step itself has data filled
      const stepData = data[step.definition.id];
      const hasData =
        stepData !== undefined && Object.keys(stepData).length > 0;

      if (hasData || step === steps[0]) {
        lastValid = step;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return lastValid ?? steps[0];
}
