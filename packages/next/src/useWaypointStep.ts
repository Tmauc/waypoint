"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "zustand";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldErrors, FieldValues, UseFormReturn } from "react-hook-form";

import {
  resolveTree,
  buildZodSchema,
  calculateProgress,
  getNextStep,
  getPreviousStep,
  findStepIndex,
} from "@waypoint/core";
import type { ResolvedField, ResolvedStep, WaypointRuntimeStore } from "@waypoint/core";

import { useWaypointRuntimeContext } from "./context";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface WaypointStepReturn {
  // Step context
  currentStep: ResolvedStep | undefined;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;

  // React Hook Form
  form: UseFormReturn<FieldValues>;
  /** Visible fields for the current step */
  fields: ResolvedField[];

  // Actions
  /** Validate → persist → onStepComplete → navigate next (or onComplete on last step) */
  handleSubmit: () => Promise<void>;
  goBack: () => void;

  // State
  isSubmitting: boolean;
  errors: FieldErrors;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Per-page hook for multi-step forms powered by WaypointRunner.
 *
 * Derives the current step from the URL, provides react-hook-form wired to
 * the step's Zod schema, and handles navigation automatically.
 *
 * Must be used inside a `<WaypointRunner>` component.
 *
 * @example
 * const { form, fields, handleSubmit, progress } = useWaypointStep();
 */
export function useWaypointStep(): WaypointStepReturn {
  const { schema, store, onComplete, onStepComplete, onDataChange } =
    useWaypointRuntimeContext();
  const router = useRouter();
  const pathname = usePathname();

  // Subscribe to store state
  const { data, externalVars, currentStepId, isSubmitting } = useStore(
    store,
    (s: WaypointRuntimeStore) => ({
      data: s.data,
      externalVars: s.externalVars,
      currentStepId: s.currentStepId,
      isSubmitting: s.isSubmitting,
    })
  );

  // Resolve the full tree
  const tree = useMemo(
    () => resolveTree(schema, data, externalVars),
    [schema, data, externalVars]
  );

  // Find the step matching the current pathname
  const currentStep = useMemo(() => {
    return tree.steps.find((s) => {
      const stepUrl = s.definition.url;
      // Exact match, or pathname ends with step URL (handles leading slash variants)
      return pathname === stepUrl || pathname.endsWith(stepUrl);
    });
  }, [tree.steps, pathname]);

  // Sync currentStepId into the store whenever the page changes
  useEffect(() => {
    if (currentStep && currentStep.definition.id !== currentStepId) {
      store.getState().setCurrentStep(currentStep.definition.id);
    }
  }, [currentStep, currentStepId, store]);

  // Visible fields for the current step
  const visibleFields = useMemo(
    () => currentStep?.fields.filter((f) => f.visible) ?? [],
    [currentStep]
  );

  // Build the Zod schema from visible fields
  const zodSchema = useMemo(() => buildZodSchema(visibleFields), [visibleFields]);

  // Existing step data used as default values
  const defaultValues = useMemo(
    () => (currentStep ? (data[currentStep.definition.id] ?? {}) : {}),
    // Only recompute when the step changes (not on every data write)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep?.definition.id]
  );

  // React Hook Form instance
  const form = useForm<FieldValues>({
    resolver: zodResolver(zodSchema),
    defaultValues,
  });

  // Reset form defaults when step changes
  useEffect(() => {
    if (currentStep) {
      form.reset(data[currentStep.definition.id] ?? {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.definition.id]);

  // Navigation position
  const stepIndex = currentStep
    ? findStepIndex(tree.steps, currentStep.definition.id)
    : -1;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === tree.steps.length - 1;
  const progress = currentStep
    ? calculateProgress(tree.steps, currentStep.definition.id)
    : 0;

  // goBack
  const goBack = useCallback(() => {
    if (!currentStep) return;
    const prev = getPreviousStep(tree.steps, currentStep.definition.id);
    if (prev) {
      router.push(prev.definition.url);
    }
  }, [currentStep, tree.steps, router]);

  // handleSubmit
  const handleSubmit = useCallback(async () => {
    if (!currentStep) return;

    // 1. Validate via RHF + Zod
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();

    // 2. Persist data + update submitting state
    store.getState().setIsSubmitting(true);

    try {
      // 3. Snapshot visible step IDs before writing (to detect tree changes)
      const oldVisibleIds = tree.steps.map((s) => s.definition.id).join(",");

      // 4. Write validated data into the store
      store.getState().setStepData(currentStep.definition.id, values);

      // 5. Re-resolve tree with updated data — step visibility may have changed
      const allData = store.getState().data;
      const updatedTree = resolveTree(schema, allData, externalVars);
      const newVisibleIds = updatedTree.steps.map((s) => s.definition.id).join(",");

      // 6. If the visible tree changed, truncate stale forward history
      // (e.g. user went back, changed a dep value, tree changed → old path is invalid)
      if (oldVisibleIds !== newVisibleIds) {
        store.getState().truncateHistoryAt(currentStep.definition.id);
      }

      // 7. onDataChange callback
      onDataChange?.(allData);

      // 8. onStepComplete callback (may be async, e.g. backend-step mode)
      if (onStepComplete) {
        await onStepComplete(currentStep.definition.id, values);
      }

      // 9. Navigate using the UPDATED tree so we follow the new step order
      const nextStep = getNextStep(updatedTree.steps, currentStep.definition.id);
      if (nextStep) {
        router.push(nextStep.definition.url);
      } else {
        store.getState().setCompleted(true);
        await onComplete?.(allData);
      }
    } finally {
      store.getState().setIsSubmitting(false);
    }
  }, [
    currentStep,
    form,
    store,
    schema,
    tree.steps,
    externalVars,
    onDataChange,
    onStepComplete,
    onComplete,
    router,
  ]);

  return {
    currentStep,
    progress,
    isFirstStep,
    isLastStep,
    form,
    fields: visibleFields,
    handleSubmit,
    goBack,
    isSubmitting,
    errors: form.formState.errors,
  };
}
