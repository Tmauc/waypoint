import { useMemo } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand";

import {
  resolveTree,
  calculateProgress,
  getNextStep,
  getPreviousStep,
} from "@waypointjs/core";
import type { ExternalEnum, WaypointRuntimeStore } from "@waypointjs/core";
import type { ResolvedStep, ResolvedTree } from "@waypointjs/core";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface WaypointState {
  schema: WaypointRuntimeStore["schema"];
  data: WaypointRuntimeStore["data"];
  externalVars: WaypointRuntimeStore["externalVars"];
  currentStepId: string | null;
  currentStep: ResolvedStep | undefined;
  nextStep: ResolvedStep | undefined;
  previousStep: ResolvedStep | undefined;
  tree: ResolvedTree;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  missingExternalVars: string[];
  // Store actions
  setFieldValue(stepId: string, fieldId: string, value: unknown): void;
  setStepData(stepId: string, data: Record<string, unknown>): void;
  setExternalVar(varId: string, value: unknown): void;
  setCurrentStep(stepId: string): void;
  reset(): void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Headless hook for accessing and mutating the Waypoint runtime store.
 *
 * Router-agnostic — use `@waypointjs/next`'s `useWaypointStep()` for full
 * Next.js integration with form handling and automatic navigation.
 *
 * @example
 * const { currentStep, progress, setFieldValue } = useWaypoint(store);
 */
export function useWaypoint(store: StoreApi<WaypointRuntimeStore>, externalEnums?: ExternalEnum[]): WaypointState {
  const { schema, data, externalVars, currentStepId, isSubmitting } = useStore(
    store,
    (s: WaypointRuntimeStore) => ({
      schema: s.schema,
      data: s.data,
      externalVars: s.externalVars,
      currentStepId: s.currentStepId,
      isSubmitting: s.isSubmitting,
    })
  );

  const tree = useMemo(
    () =>
      schema
        ? resolveTree(schema, data, externalVars, externalEnums)
        : { steps: [], hiddenSteps: [], missingExternalVars: [] },
    [schema, data, externalVars, externalEnums]
  );

  const currentStep = useMemo(
    () =>
      currentStepId
        ? tree.steps.find((s) => s.definition.id === currentStepId)
        : undefined,
    [tree.steps, currentStepId]
  );

  const nextStep = useMemo(
    () =>
      currentStepId ? getNextStep(tree.steps, currentStepId) : undefined,
    [tree.steps, currentStepId]
  );

  const previousStep = useMemo(
    () =>
      currentStepId ? getPreviousStep(tree.steps, currentStepId) : undefined,
    [tree.steps, currentStepId]
  );

  const progress = useMemo(
    () =>
      currentStepId ? calculateProgress(tree.steps, currentStepId) : 0,
    [tree.steps, currentStepId]
  );

  return {
    schema,
    data,
    externalVars,
    currentStepId,
    currentStep,
    nextStep,
    previousStep,
    tree,
    progress,
    isFirstStep: !previousStep,
    isLastStep: !nextStep,
    isSubmitting,
    missingExternalVars: tree.missingExternalVars,

    setFieldValue: (stepId, fieldId, value) =>
      store.getState().setFieldValue(stepId, fieldId, value),
    setStepData: (stepId, data) =>
      store.getState().setStepData(stepId, data),
    setExternalVar: (varId, value) =>
      store.getState().setExternalVar(varId, value),
    setCurrentStep: (stepId) => store.getState().setCurrentStep(stepId),
    reset: () => store.getState().reset(),
  };
}
