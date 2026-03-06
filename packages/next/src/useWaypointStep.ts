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
} from "@waypointjs/core";
import type { ResolvedField, ResolvedStep, WaypointRuntimeStore } from "@waypointjs/core";

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
  /** Skip this step without validation — only available when step.skippable is true */
  skipStep: () => void;

  // State
  isSubmitting: boolean;
  /** Whether the current step can be skipped */
  canSkip: boolean;
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
  const { schema, store, onComplete, onStepComplete, onDataChange, onStepSkipped, externalEnums } =
    useWaypointRuntimeContext();
  const router = useRouter();
  const pathname = usePathname();

  // Subscribe to store state
  const { data, externalVars, currentStepId, skippedSteps, isSubmitting } = useStore(
    store,
    (s: WaypointRuntimeStore) => ({
      data: s.data,
      externalVars: s.externalVars,
      currentStepId: s.currentStepId,
      skippedSteps: s.skippedSteps,
      isSubmitting: s.isSubmitting,
    })
  );

  // Resolve the full tree
  const tree = useMemo(
    () => resolveTree(schema, data, externalVars, externalEnums, skippedSteps),
    [schema, data, externalVars, externalEnums, skippedSteps]
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

  // Existing step data used as default values, with dynamic defaults as fallback
  const defaultValues = useMemo(
    () => {
      if (!currentStep) return {};
      const stored = data[currentStep.definition.id] ?? {};
      // Merge dynamic/static defaults for fields that have no stored value
      const merged: Record<string, unknown> = { ...stored };
      for (const field of currentStep.fields) {
        const fid = field.definition.id;
        if (merged[fid] === undefined || merged[fid] === null || merged[fid] === "") {
          const dynDefault = field.resolvedDefaultValue;
          const staticDefault = field.definition.defaultValue;
          const resolved = dynDefault ?? staticDefault;
          if (resolved !== undefined) {
            merged[fid] = resolved;
          }
        }
      }
      return merged;
    },
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

  // Whether the current step can be skipped
  const canSkip = !!currentStep?.definition.skippable;

  // goBack
  const goBack = useCallback(() => {
    if (!currentStep) return;
    const prev = getPreviousStep(tree.steps, currentStep.definition.id);
    if (prev) {
      router.push(prev.definition.url);
    }
  }, [currentStep, tree.steps, router]);

  // skipStep — bypass validation, mark as skipped, navigate to next
  const skipStep = useCallback(() => {
    if (!currentStep || !currentStep.definition.skippable) return;

    const stepId = currentStep.definition.id;
    store.getState().skipStep(stepId);

    // Re-resolve tree after marking as skipped (conditions may depend on $step.X.skipped)
    const updatedTree = resolveTree(schema, store.getState().data, externalVars, externalEnums, [
      ...skippedSteps,
      stepId,
    ]);
    const nextStep = getNextStep(updatedTree.steps, stepId);

    onStepSkipped?.(stepId);

    if (nextStep) {
      router.push(nextStep.definition.url);
    } else {
      store.getState().setCompleted(true);
      onComplete?.(store.getState().data);
    }
  }, [currentStep, store, schema, externalVars, externalEnums, skippedSteps, onStepSkipped, onComplete, router]);

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

      // 4b. If this step was previously skipped, un-skip it (user filled it properly)
      if (skippedSteps.includes(currentStep.definition.id)) {
        store.getState().unskipStep(currentStep.definition.id);
      }

      // 5. Re-resolve tree with updated data — step visibility may have changed
      const allData = store.getState().data;
      const updatedSkipped = store.getState().skippedSteps;
      const updatedTree = resolveTree(schema, allData, externalVars, externalEnums, updatedSkipped);
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
    externalEnums,
    skippedSteps,
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
    skipStep,
    isSubmitting,
    canSkip,
    errors: form.formState.errors,
  };
}
