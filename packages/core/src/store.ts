import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { JourneyState, JourneyTreeType } from "./types";

/**
 * Multi-journey store — manages multiple parallel journeys.
 */
interface WaypointStore {
  /** Currently active journey ID */
  activeJourneyId: string | null;

  /** Remove all journeys marked for deferred deletion */
  cleanMarkedJourneys: () => void;

  /**
   * Create a new journey.
   * @returns the provided journeyId
   */
  createJourney: (
    journeyId: string,
    tree: JourneyTreeType,
    canResumeToDeepestStep?: boolean
  ) => string;

  /** Delete a journey immediately */
  deleteJourney: (journeyId: string) => void;

  /** Get the active journey state */
  getActiveJourney: () => JourneyState | undefined;

  /** Get all journey IDs */
  getAllJourneyIds: () => string[];

  /** Get a specific journey state */
  getJourney: (journeyId: string) => JourneyState | undefined;

  /** Check if a journey exists */
  hasJourney: (journeyId: string) => boolean;

  /** Map of all journeys keyed by journeyId */
  journeys: Record<string, JourneyState>;

  /** IDs of journeys queued for deferred deletion */
  journeysToDelete: string[];

  /** Mark a journey for deferred deletion */
  markJourneyForDeletion: (journeyId: string) => void;

  /** Reset all journeys */
  resetAll: () => void;

  /** Reset a single journey to its initial state (tree is preserved) */
  resetJourney: (journeyId: string) => void;

  /** Set which journey is active, or null to deactivate all */
  setActiveJourney: (journeyId: string | null) => void;

  /** Toggle the resume-to-deepest-step feature for a journey */
  setCanResumeToDeepestStep: (journeyId: string, canResume: boolean) => void;

  /** Update the current step of a journey */
  setCurrentStep: (journeyId: string, currentStep: string | null) => void;

  /** Update the deepest visited step of a journey */
  setDeepestStepVisited: (journeyId: string, deepestStepVisited: string) => void;

  /** Update the history of a journey */
  setHistory: (journeyId: string, history: string[]) => void;

  /** Update the progress of a journey (clamped 0–100) */
  setProgress: (journeyId: string, progress: number) => void;

  /** Update the navigation tree of a journey */
  setTree: (journeyId: string, tree: JourneyTreeType) => void;
}

const initialJourneyState: JourneyState = {
  canResumeToDeepestStep: false,
  currentStep: null,
  deepestStepVisited: "",
  history: [],
  progress: 0,
  tree: [],
};

const initialStore = {
  journeys: {} as Record<string, JourneyState>,
  activeJourneyId: null,
  journeysToDelete: [] as string[],
};

export const useWaypointStore = create<WaypointStore>()(
  persist(
    (set, get) => ({
      ...initialStore,

      createJourney: (journeyId, tree, canResumeToDeepestStep = false) => {
        set((state) => ({
          journeys: {
            ...state.journeys,
            [journeyId]: {
              ...initialJourneyState,
              canResumeToDeepestStep,
              tree,
            },
          },
        }));
        return journeyId;
      },

      deleteJourney: (journeyId) => {
        set((state) => {
          const { [journeyId]: _removed, ...remainingJourneys } = state.journeys;
          const newActiveJourneyId =
            state.activeJourneyId === journeyId ? null : state.activeJourneyId;
          return {
            journeys: remainingJourneys,
            activeJourneyId: newActiveJourneyId,
          };
        });
      },

      markJourneyForDeletion: (journeyId) => {
        set((state) => {
          if (state.journeysToDelete.includes(journeyId)) return state;
          return { journeysToDelete: [...state.journeysToDelete, journeyId] };
        });
      },

      cleanMarkedJourneys: () => {
        const state = get();
        if (state.journeysToDelete.length === 0) return;
        state.journeysToDelete.forEach((id) => state.deleteJourney(id));
        set({ journeysToDelete: [] });
      },

      setActiveJourney: (journeyId) => {
        if (journeyId === null) {
          set({ activeJourneyId: null });
          return;
        }
        const journey = get().journeys[journeyId];
        if (!journey) {
          console.warn(`Waypoint: journey "${journeyId}" does not exist. Cannot set as active.`);
          return;
        }
        set({ activeJourneyId: journeyId });
      },

      setCanResumeToDeepestStep: (journeyId, canResume) => {
        set((state) => {
          const journey = state.journeys[journeyId];
          if (!journey) {
            console.warn(`Waypoint: journey "${journeyId}" does not exist.`);
            return state;
          }
          return {
            journeys: {
              ...state.journeys,
              [journeyId]: { ...journey, canResumeToDeepestStep: canResume },
            },
          };
        });
      },

      getJourney: (journeyId) => get().journeys[journeyId],

      getActiveJourney: () => {
        const { activeJourneyId, journeys } = get();
        if (!activeJourneyId) return undefined;
        return journeys[activeJourneyId];
      },

      setTree: (journeyId, tree) => {
        set((state) => {
          const journey = state.journeys[journeyId];
          if (!journey) {
            console.warn(`Waypoint: journey "${journeyId}" does not exist.`);
            return state;
          }
          return {
            journeys: { ...state.journeys, [journeyId]: { ...journey, tree } },
          };
        });
      },

      setCurrentStep: (journeyId, currentStep) => {
        set((state) => {
          const journey = state.journeys[journeyId];
          if (!journey) {
            console.warn(`Waypoint: journey "${journeyId}" does not exist.`);
            return state;
          }
          return {
            journeys: {
              ...state.journeys,
              [journeyId]: { ...journey, currentStep },
            },
          };
        });
      },

      setHistory: (journeyId, history) => {
        set((state) => {
          const journey = state.journeys[journeyId];
          if (!journey) {
            console.warn(`Waypoint: journey "${journeyId}" does not exist.`);
            return state;
          }
          return {
            journeys: {
              ...state.journeys,
              [journeyId]: { ...journey, history },
            },
          };
        });
      },

      setProgress: (journeyId, progress) => {
        set((state) => {
          const journey = state.journeys[journeyId];
          if (!journey) {
            console.warn(`Waypoint: journey "${journeyId}" does not exist.`);
            return state;
          }
          return {
            journeys: {
              ...state.journeys,
              [journeyId]: {
                ...journey,
                progress: Math.max(0, Math.min(100, progress)),
              },
            },
          };
        });
      },

      setDeepestStepVisited: (journeyId, deepestStepVisited) => {
        set((state) => {
          const journey = state.journeys[journeyId];
          if (!journey) {
            console.warn(`Waypoint: journey "${journeyId}" does not exist.`);
            return state;
          }
          return {
            journeys: {
              ...state.journeys,
              [journeyId]: { ...journey, deepestStepVisited },
            },
          };
        });
      },

      resetJourney: (journeyId) => {
        set((state) => {
          const journey = state.journeys[journeyId];
          if (!journey) {
            console.warn(`Waypoint: journey "${journeyId}" does not exist.`);
            return state;
          }
          return {
            journeys: {
              ...state.journeys,
              [journeyId]: { ...initialJourneyState, tree: journey.tree },
            },
          };
        });
      },

      resetAll: () => set(initialStore),

      getAllJourneyIds: () => Object.keys(get().journeys),

      hasJourney: (journeyId) => journeyId in get().journeys,
    }),
    { name: "waypoint-store" }
  )
);
