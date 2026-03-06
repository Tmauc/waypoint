import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage } from "zustand/middleware";

import type { WaypointSchema } from "./schema";
import {
  resolveTree,
  calculateProgress,
  getNextStep,
  getPreviousStep,
} from "./tree-resolver";
import type { ResolvedStep, ResolvedTree } from "./tree-resolver";

// ---------------------------------------------------------------------------
// State + Actions
// ---------------------------------------------------------------------------

export interface WaypointRuntimeState {
  schema: WaypointSchema | null;
  /** { stepId: { fieldId: value } } */
  data: Record<string, Record<string, unknown>>;
  /** { varId: value } */
  externalVars: Record<string, unknown>;
  currentStepId: string | null;
  /** Step IDs visited in order */
  history: string[];
  isSubmitting: boolean;
  /** True once onComplete has been called (all steps validated) */
  completed: boolean;
}

export interface WaypointRuntimeActions {
  /**
   * Fresh start: sets schema + data and navigates to the first step (or startStepId).
   * Always resets navigation state (currentStepId, history).
   */
  init(
    schema: WaypointSchema,
    options?: {
      data?: Record<string, Record<string, unknown>>;
      externalVars?: Record<string, unknown>;
      startStepId?: string;
    }
  ): void;

  /**
   * Resume a previously-started journey.
   * Updates schema + externalVars but preserves data, currentStepId and history
   * as they were persisted (e.g. from localStorage).
   */
  resume(schema: WaypointSchema, externalVars?: Record<string, unknown>): void;

  setFieldValue(stepId: string, fieldId: string, value: unknown): void;
  setStepData(stepId: string, data: Record<string, unknown>): void;
  setExternalVar(varId: string, value: unknown): void;
  setCurrentStep(stepId: string): void;
  setIsSubmitting(b: boolean): void;
  setCompleted(b: boolean): void;
  /**
   * Truncates history to include only steps up to and including stepId.
   * Called before navigating forward so stale steps from a previous path are removed.
   */
  truncateHistoryAt(stepId: string): void;
  reset(): void;
}

export type WaypointRuntimeStore = WaypointRuntimeState & WaypointRuntimeActions;

// ---------------------------------------------------------------------------
// What the persist middleware saves to localStorage
// ---------------------------------------------------------------------------

interface PersistedSlice {
  /** The schema id that was active — used to detect stale persisted data */
  schemaId: string | null;
  data: WaypointRuntimeState["data"];
  currentStepId: WaypointRuntimeState["currentStepId"];
  history: WaypointRuntimeState["history"];
  completed: WaypointRuntimeState["completed"];
}

// ---------------------------------------------------------------------------
// Computed helpers (pure functions — no hooks)
// ---------------------------------------------------------------------------

export function getResolvedTree(state: WaypointRuntimeState): ResolvedTree {
  if (!state.schema) {
    return { steps: [], hiddenSteps: [], missingExternalVars: [] };
  }
  return resolveTree(state.schema, state.data, state.externalVars);
}

export function getCurrentStep(state: WaypointRuntimeState): ResolvedStep | undefined {
  if (!state.currentStepId) return undefined;
  return getResolvedTree(state).steps.find(
    (s) => s.definition.id === state.currentStepId
  );
}

export function getNextStepFromState(state: WaypointRuntimeState): ResolvedStep | undefined {
  if (!state.currentStepId) return undefined;
  const tree = getResolvedTree(state);
  return getNextStep(tree.steps, state.currentStepId);
}

export function getPreviousStepFromState(state: WaypointRuntimeState): ResolvedStep | undefined {
  if (!state.currentStepId) return undefined;
  const tree = getResolvedTree(state);
  return getPreviousStep(tree.steps, state.currentStepId);
}

export function calculateProgressFromState(state: WaypointRuntimeState): number {
  if (!state.currentStepId) return 0;
  const tree = getResolvedTree(state);
  return calculateProgress(tree.steps, state.currentStepId);
}

export function getMissingBlockingVars(state: WaypointRuntimeState): string[] {
  return getResolvedTree(state).missingExternalVars;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: WaypointRuntimeState = {
  schema: null,
  data: {},
  externalVars: {},
  currentStepId: null,
  history: [],
  isSubmitting: false,
  completed: false,
};

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

export interface CreateRuntimeStoreOptions {
  persistenceMode?: string;
  schemaId?: string;
}

function buildStateCreator() {
  return (
    set: (
      partial:
        | Partial<WaypointRuntimeStore>
        | ((state: WaypointRuntimeStore) => Partial<WaypointRuntimeStore>)
    ) => void,
    _get: () => WaypointRuntimeStore
  ): WaypointRuntimeStore => ({
    ...initialState,

    init(schema, options = {}) {
      const { data = {}, externalVars = {}, startStepId } = options;
      const firstStepId = startStepId ?? schema.steps[0]?.id ?? null;
      set({
        schema,
        data,
        externalVars,
        currentStepId: firstStepId,
        history: firstStepId ? [firstStepId] : [],
        isSubmitting: false,
        completed: false,
      });
    },

    resume(schema, externalVars = {}) {
      // Preserve data, currentStepId, history and completed — only update schema + externalVars.
      set((state) => ({
        schema,
        externalVars: { ...state.externalVars, ...externalVars },
        isSubmitting: false,
      }));
    },

    setFieldValue(stepId, fieldId, value) {
      set((state) => ({
        data: {
          ...state.data,
          [stepId]: { ...state.data[stepId], [fieldId]: value },
        },
      }));
    },

    setStepData(stepId, data) {
      set((state) => ({
        data: { ...state.data, [stepId]: data },
      }));
    },

    setExternalVar(varId, value) {
      set((state) => ({
        externalVars: { ...state.externalVars, [varId]: value },
      }));
    },

    setCurrentStep(stepId) {
      set((state) => ({
        currentStepId: stepId,
        history: state.history.includes(stepId)
          ? state.history
          : [...state.history, stepId],
      }));
    },

    setIsSubmitting(b) {
      set({ isSubmitting: b });
    },

    setCompleted(b) {
      set({ completed: b });
    },

    truncateHistoryAt(stepId) {
      set((state) => {
        const idx = state.history.indexOf(stepId);
        if (idx === -1 || idx === state.history.length - 1) return state;
        return { history: state.history.slice(0, idx + 1) };
      });
    },

    reset() {
      set(initialState);
    },
  });
}

/**
 * Creates a new runtime store instance (vanilla Zustand, no React dependency).
 *
 * Each schema gets its own isolated store — multiple `<WaypointRunner>` instances
 * with different schemas can coexist simultaneously without sharing state.
 *
 * @param options.persistenceMode - If "zustand", activates localStorage persistence
 * @param options.schemaId - Used to build the persistence key (and to validate resume)
 */
export function createRuntimeStore(options: CreateRuntimeStoreOptions = {}) {
  const { persistenceMode, schemaId } = options;

  if (persistenceMode === "zustand") {
    const storageKey = schemaId
      ? `waypoint-runtime-${schemaId}`
      : "waypoint-runtime";

    return createStore<WaypointRuntimeStore>()(
      persist(buildStateCreator(), {
        name: storageKey,
        storage: createJSONStorage(() => {
          // SSR-safe: fall back to an in-memory noop if localStorage is unavailable
          if (typeof window === "undefined") {
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            };
          }
          return window.localStorage;
        }),
        partialize: (state): PersistedSlice => ({
          // Persist the schema id so WaypointRunner can verify the saved data
          // belongs to this schema (guards against stale data from a renamed schema).
          schemaId: state.schema?.id ?? null,
          data: state.data,
          currentStepId: state.currentStepId,
          history: state.history,
          completed: state.completed,
        }),
      })
    );
  }

  return createStore<WaypointRuntimeStore>()(buildStateCreator());
}

// ---------------------------------------------------------------------------
// Resume detection helper (used by WaypointRunner)
// ---------------------------------------------------------------------------

/**
 * Returns true if the store has valid persisted state for the given schema id.
 * Used by WaypointRunner to decide whether to call `resume()` or `init()`.
 *
 * Relies on the fact that localStorage hydration is synchronous, so by the time
 * the first `useEffect` runs, the persisted slice is already merged into state.
 */
export function hasPersistedState(
  store: ReturnType<typeof createRuntimeStore>,
  schemaId: string
): boolean {
  const state = store.getState();
  // The persist middleware merges the PersistedSlice fields directly onto the state object,
  // adding `schemaId` as an extra field not declared in WaypointRuntimeState.
  const persistedSchemaId = (state as unknown as Record<string, unknown>)["schemaId"] as
    | string
    | null
    | undefined;
  return (
    persistedSchemaId === schemaId &&
    state.currentStepId !== null &&
    !state.completed
  );
}

export type RuntimeStore = ReturnType<typeof createRuntimeStore>;
