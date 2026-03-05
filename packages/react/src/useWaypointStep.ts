import { useMemo } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand";

import { resolveTree } from "@waypoint/core";
import type { WaypointRuntimeStore } from "@waypoint/core";
import type { ResolvedField, ResolvedStep } from "@waypoint/core";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface WaypointHeadlessStep {
  step: ResolvedStep | undefined;
  /** Visible fields for this step */
  fields: ResolvedField[];
  /** Current persisted data for this step */
  stepData: Record<string, unknown>;
  setFieldValue(fieldId: string, value: unknown): void;
  setStepData(data: Record<string, unknown>): void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Headless (router-agnostic) hook that resolves a specific step's fields and data.
 *
 * Use `@waypoint/next`'s `useWaypointStep()` for full Next.js integration
 * (form, validation, navigation).
 *
 * @param store   - The runtime store instance from your context
 * @param stepId  - The step id to resolve
 */
export function useWaypointStep(
  store: StoreApi<WaypointRuntimeStore>,
  stepId: string
): WaypointHeadlessStep {
  const { schema, data, externalVars } = useStore(store, (s: WaypointRuntimeStore) => ({
    schema: s.schema,
    data: s.data,
    externalVars: s.externalVars,
  }));

  const tree = useMemo(
    () =>
      schema
        ? resolveTree(schema, data, externalVars)
        : { steps: [], hiddenSteps: [], missingExternalVars: [] },
    [schema, data, externalVars]
  );

  const step = useMemo(
    () => tree.steps.find((s) => s.definition.id === stepId),
    [tree.steps, stepId]
  );

  const visibleFields = useMemo(
    () => step?.fields.filter((f) => f.visible) ?? [],
    [step]
  );

  return {
    step,
    fields: visibleFields,
    stepData: data[stepId] ?? {},
    setFieldValue: (fieldId, value) =>
      store.getState().setFieldValue(stepId, fieldId, value),
    setStepData: (d) => store.getState().setStepData(stepId, d),
  };
}
