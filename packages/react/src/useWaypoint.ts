import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  URLTemplateEngine,
  calculateStepProgress,
  extractURLParamsFromTree,
  mergeContextParams,
  useWaypointStore,
} from "@waypoint/core";
import type { WaypointParams } from "@waypoint/core";

// ── Router abstraction ────────────────────────────────────────────────────────

/**
 * Minimal router adapter interface.
 * Provide this from your framework (e.g. @waypoint/next does this automatically).
 */
export interface RouterAdapter {
  push: (url: string) => void;
  pathname: string;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface NavigationOptions {
  /** Journey ID to use. Falls back to the active journey when omitted. */
  journeyId?: string;
  /**
   * Step names to exclude from the navigation sequence.
   * Useful for conditional flows (e.g. skip certain steps for a product type).
   */
  excludeSteps?: string[];
  /** Router adapter — injected automatically by @waypoint/next */
  router: RouterAdapter;
}

export interface NavigateToOptions {
  isBackAction?: boolean;
  params?: WaypointParams;
  url?: string;
}

export interface WaypointNavigation {
  buildUrl: (url: string, params?: WaypointParams) => string;
  extractedParams: WaypointParams;
  getStepUrl: (stepName: string, params?: WaypointParams) => string | undefined;
  goBack: (params?: WaypointParams) => void;
  goNext: (params?: WaypointParams) => void;
  goStart: (params?: WaypointParams) => void;
  goTo: (options: NavigateToOptions) => void;
  handleRestartNavigation: (params?: WaypointParams) => void;
  /** The resolved journey ID being used */
  journeyId: string;
  urls: {
    previous?: string;
    next?: string;
    start?: string;
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Core navigation hook for waypoint journeys.
 *
 * Requires a `RouterAdapter` — use `@waypoint/next` if you're in a Next.js app.
 *
 * @example
 * const router = { push: (url) => window.location.assign(url), pathname: window.location.pathname };
 * const nav = useWaypoint({ router });
 * nav.goNext();
 */
export const useWaypoint = ({
  journeyId,
  excludeSteps = [],
  router,
}: NavigationOptions): WaypointNavigation => {
  const { pathname } = router;

  const {
    resolvedJourneyId,
    journey,
    setHistory,
    setProgress,
    setCurrentStep,
    setDeepestStepVisited,
  } = useWaypointStore(
    useShallow((state) => {
      const resolvedId = journeyId || state.activeJourneyId;

      if (!resolvedId) {
        return {
          resolvedJourneyId: null,
          journey: null,
          setHistory: (_h: string[]) => {},
          setProgress: (_p: number) => {},
          setCurrentStep: (_s: string | null) => {},
          setDeepestStepVisited: (_s: string) => {},
        };
      }

      const j = state.getJourney(resolvedId);

      return {
        resolvedJourneyId: resolvedId,
        journey: j,
        setHistory: (history: string[]) => state.setHistory(resolvedId, history),
        setProgress: (progress: number) => state.setProgress(resolvedId, progress),
        setCurrentStep: (step: string | null) =>
          state.setCurrentStep(resolvedId, step),
        setDeepestStepVisited: (step: string) =>
          state.setDeepestStepVisited(resolvedId, step),
      };
    })
  );

  const tree = journey?.tree ?? [];
  const currentStep = journey?.currentStep ?? null;
  const history = journey?.history ?? [];
  const deepestStepVisited = journey?.deepestStepVisited ?? "";
  const currentProgress = journey?.progress ?? 0;
  const canResumeToDeepestStep = journey?.canResumeToDeepestStep ?? false;

  // Flatten steps (always called for consistent hook ordering)
  const allSteps = useMemo(
    () => (Array.isArray(tree) ? tree.flatMap((cat) => cat.steps) : []),
    [tree]
  );

  // Update deepestStep & progress when currentStep changes
  useEffect(() => {
    if (!resolvedJourneyId || !journey || !currentStep || !tree.length) return;

    if (!history.includes(currentStep) && deepestStepVisited !== currentStep) {
      setDeepestStepVisited(currentStep);
    }

    const newProgress = calculateStepProgress(currentStep, tree);
    if (currentProgress !== newProgress) {
      setProgress(newProgress);
    }
  }, [resolvedJourneyId, journey, currentStep, history, tree, deepestStepVisited, currentProgress]);

  // Auto-enable canResumeToDeepestStep if the step declares enableResumeFromHere
  useEffect(() => {
    if (!resolvedJourneyId || !journey || !currentStep) return;

    const stepConfig = allSteps.find((s) => s.step === currentStep);
    if (stepConfig?.enableResumeFromHere && !canResumeToDeepestStep) {
      useWaypointStore
        .getState()
        .setCanResumeToDeepestStep(resolvedJourneyId, true);
    }
  }, [resolvedJourneyId, journey, currentStep, allSteps, canResumeToDeepestStep]);

  // Extracted params from the current URL
  const extractedParams = useMemo(
    () => extractURLParamsFromTree(pathname, allSteps),
    [pathname, allSteps]
  );

  // Compute navigation URLs
  const navigationUrls = useMemo(() => {
    const filteredSteps = allSteps.filter(
      (s) => !excludeSteps.includes(s.step)
    );

    const startURL = filteredSteps[0]?.url;
    const stepIndex = filteredSteps.findIndex((s) => s.step === currentStep);

    if (stepIndex === -1) return { start: startURL };

    let previousStep =
      stepIndex > 0 ? filteredSteps[stepIndex - 1] : null;
    for (
      let offset = 1;
      previousStep && !history.includes(previousStep.step);
      offset++
    ) {
      previousStep =
        stepIndex - offset >= 0 ? filteredSteps[stepIndex - offset] : null;
    }

    const nextStep =
      stepIndex < filteredSteps.length - 1
        ? filteredSteps[stepIndex + 1]
        : null;

    // Prune future history when the user diverges from it
    if (currentStep && history.includes(currentStep)) {
      const currentIdx = history.indexOf(currentStep);
      const expectedNext =
        currentIdx < history.length - 1 ? history[currentIdx + 1] : null;
      if (nextStep && expectedNext && nextStep.step !== expectedNext) {
        setHistory(history.slice(0, currentIdx + 1));
      }
    }

    return {
      previous: previousStep?.url,
      next: nextStep?.url,
      start: startURL,
    };
  }, [currentStep, excludeSteps, allSteps, history, setHistory]);

  // ── Navigation primitives ──────────────────────────────────────────────────

  const navigateToURL = ({
    url,
    params = {},
    isBackAction = false,
  }: NavigateToOptions) => {
    if (!resolvedJourneyId || !journey || !url) return;

    const mergedParams = mergeContextParams(params, pathname, allSteps, url);
    const formattedURL = URLTemplateEngine.format(url, mergedParams);

    if (process.env.NODE_ENV === "development") {
      const { isValid, missingParams } = URLTemplateEngine.validate(
        url,
        mergedParams
      );
      if (!isValid) {
        console.warn(
          `Waypoint: navigating with incomplete parameters. Missing: ${missingParams.join(", ")}`
        );
      }
    }

    if (!isBackAction && currentStep && !history.some((s) => s === currentStep)) {
      setHistory([...history, currentStep]);
    }

    router.push(formattedURL);
  };

  const buildUrl = (url: string, params: WaypointParams = {}): string => {
    if (!resolvedJourneyId || !journey) return "";
    const merged = mergeContextParams(params, pathname, allSteps, url);
    return URLTemplateEngine.format(url, merged);
  };

  const getStepUrl = (
    stepName: string,
    params: WaypointParams = {}
  ): string | undefined => {
    if (!resolvedJourneyId || !journey) return undefined;
    const target = allSteps.find((s) => s.step === stepName);
    if (!target) return undefined;
    return buildUrl(target.url, params);
  };

  const handleRestartNavigation = (params: WaypointParams = {}) => {
    if (!resolvedJourneyId || !journey) return;
    setCurrentStep(null);
    setHistory([]);
    navigateToURL({ url: navigationUrls.start, params });
  };

  // ── No-op fallback when no journey is resolved ─────────────────────────────

  if (!resolvedJourneyId || !journey) {
    return {
      journeyId: resolvedJourneyId ?? "",
      goBack: () => {},
      goNext: () => {},
      goStart: () => {},
      goTo: () => {},
      handleRestartNavigation: () => {},
      urls: {},
      extractedParams: {},
      buildUrl: () => "",
      getStepUrl: () => undefined,
    };
  }

  return {
    journeyId: resolvedJourneyId,
    goBack: (params?) =>
      navigateToURL({
        url: navigationUrls.previous,
        params,
        isBackAction: true,
      }),
    goNext: (params?) =>
      navigateToURL({ url: navigationUrls.next, params, isBackAction: false }),
    goStart: (params?) =>
      navigateToURL({ url: navigationUrls.start, params, isBackAction: false }),
    goTo: ({ url, params, isBackAction = false }) =>
      navigateToURL({ url, params, isBackAction }),
    handleRestartNavigation,
    urls: navigationUrls,
    extractedParams,
    buildUrl,
    getStepUrl,
  };
};
