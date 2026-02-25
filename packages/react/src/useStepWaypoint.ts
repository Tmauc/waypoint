import { useEffect } from "react";

import { calculateStepProgress, useWaypointStore } from "@waypoint/core";

/**
 * Declare the current step in a page/component.
 * Automatically updates `currentStep` and `progress` in the active journey.
 *
 * Subscribes to `activeJourneyId` so it re-runs if `useWaypointInitializer`
 * sets the active journey after the step component has already mounted
 * (common in Next.js App Router where layout effects run after child effects).
 *
 * @param stepName - The step identifier as declared in the journey tree.
 * @param journeyId - Optional: target a specific journey instead of the active one.
 *
 * @example
 * useStepWaypoint("personalInfo");
 * useStepWaypoint("checkout", "subscription-journey");
 */
export const useStepWaypoint = (stepName: string, journeyId?: string) => {
  // Subscribe to activeJourneyId so this effect re-runs when the layout's
  // useWaypointInitializer finishes calling setActiveJourney (which happens
  // in a parent useEffect, i.e. after this child effect on first mount).
  const activeJourneyId = useWaypointStore((s) => s.activeJourneyId);

  useEffect(() => {
    const state = useWaypointStore.getState();
    const targetId = journeyId ?? activeJourneyId;

    if (!targetId || !stepName) return;

    const journey = state.getJourney(targetId);
    if (!journey) return;

    if (journey.currentStep !== stepName) {
      const progress = calculateStepProgress(stepName, journey.tree);
      state.setProgress(targetId, progress);
      state.setCurrentStep(targetId, stepName);
    }
  }, [stepName, journeyId, activeJourneyId]);
};
