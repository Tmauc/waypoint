import type { JourneyTreeStep, JourneyTreeType } from "./types";

/**
 * Calculate the progress percentage (0–100) for a given step within a journey tree.
 */
export const calculateStepProgress = (
  currentStep: string,
  journeyTree: JourneyTreeType
): number => {
  const steps = journeyTree.flatMap((category) =>
    category.steps.map((step) => step.step)
  );
  const maxStepNumber = steps.length + 1;
  const stepIndex = steps.indexOf(currentStep);

  if (stepIndex === -1) return 0;
  return ((stepIndex + 1) * 100) / maxStepNumber;
};

/**
 * Returns the name of the first step in the tree, or null if the tree is empty.
 */
export function getFirstStepName(tree: JourneyTreeType): string | null {
  return tree?.[0]?.steps?.[0]?.step ?? null;
}

/**
 * Finds a step by name across all categories of a journey tree.
 */
export function getStepFromTree(
  tree: JourneyTreeType,
  stepName: string
): JourneyTreeStep | null {
  const allSteps = tree.flatMap((category) => category.steps);
  return allSteps.find((s) => s.step === stepName) ?? null;
}
