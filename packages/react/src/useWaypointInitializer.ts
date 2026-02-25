import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { findMatchingStep, getFirstStepName, useWaypointStore } from "@waypoint/core";
import type { JourneyTreeType } from "@waypoint/core";

import { useWaypoint } from "./useWaypoint";
import type { RouterAdapter } from "./useWaypoint";

export interface UseWaypointInitializerParams {
  /** Set to true once your async data is ready */
  dataAsLoaded?: boolean;
  journeyId: string;
  /** Optional callback fired once the journey is set up */
  onSetup?: () => void;
  tree: JourneyTreeType;
  /** URL params used to build the initial navigation URL */
  urlParams?: Record<string, string>;
  router: RouterAdapter;
}

/**
 * Initializes a journey: creates it if it doesn't exist, activates it,
 * and navigates to the correct starting step (or resumes from deepest step).
 */
export const useWaypointInitializer = ({
  journeyId,
  tree,
  urlParams = {},
  onSetup,
  dataAsLoaded = true,
  router,
}: UseWaypointInitializerParams) => {
  const { pathname } = router;

  const { journey, hasJourney, createJourney, setActiveJourney } =
    useWaypointStore(
      useShallow((state) => ({
        journey: state.getJourney(journeyId),
        hasJourney: state.hasJourney(journeyId),
        createJourney: state.createJourney,
        setActiveJourney: state.setActiveJourney,
      }))
    );

  const navigation = useWaypoint({ journeyId, router });

  // 1. Create journey if it doesn't exist
  useEffect(() => {
    if (!hasJourney) {
      createJourney(journeyId, tree);
    }
  }, [journeyId, hasJourney, createJourney, tree]);

  // 2. Set as active journey
  useEffect(() => {
    setActiveJourney(journeyId);
  }, [journeyId, setActiveJourney]);

  // 3. Fire onSetup callback once journey exists
  useEffect(() => {
    if (journey && onSetup) {
      onSetup();
    }
  }, [journey, onSetup]);

  // 4. Navigate to first/deepest step — only when NOT already on a journey step.
  //    In Next.js App Router layouts persist across navigations, so without this
  //    guard the effect would redirect back to step1 every time the user advances.
  useEffect(() => {
    if (!journey || !pathname || !dataAsLoaded) return;

    // If the current URL already matches a step in this journey, do nothing.
    const allSteps = journey.tree.flatMap((cat) => cat.steps);
    if (findMatchingStep(pathname, allSteps) !== null) return;

    const firstStep = getFirstStepName(journey.tree);
    const deepestStep = journey.deepestStepVisited;
    const targetStep = !journey.canResumeToDeepestStep
      ? firstStep
      : deepestStep || firstStep;

    if (!targetStep) return;

    const targetUrl = navigation.getStepUrl(targetStep, urlParams);
    if (!targetUrl) return;

    if (!pathname.includes(targetUrl)) {
      navigation.goTo({ url: targetUrl, params: urlParams });
    }
  }, [journey, pathname, navigation, urlParams, dataAsLoaded]);

  return {
    journey,
    navigation,
    isReady: !!journey && dataAsLoaded,
  };
};
