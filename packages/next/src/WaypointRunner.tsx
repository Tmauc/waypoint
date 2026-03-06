"use client";

import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";
import { useRouter, usePathname } from "next/navigation";

import {
  createRuntimeStore,
  hasPersistedState,
  resolveTree,
  findLastValidStep,
} from "@waypointjs/core";
import type { WaypointSchema, WaypointRuntimeStore, CustomTypeDefinition, ExternalEnum } from "@waypointjs/core";

import { WaypointRuntimeContext } from "./context";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WaypointRunnerProps {
  schema: WaypointSchema;
  externalVars?: Record<string, unknown>;
  defaultValues?: Record<string, Record<string, unknown>>;
  /** Async function to load previously-saved data (for deep-link resume) */
  fetchData?: () => Promise<Record<string, Record<string, unknown>>>;
  /** Called when the user completes the last step */
  onComplete?: (data: Record<string, Record<string, unknown>>) => void | Promise<void>;
  /** Called after each step is validated and submitted */
  onStepComplete?: (
    stepId: string,
    data: Record<string, unknown>
  ) => void | Promise<void>;
  /** Called whenever any field value changes */
  onDataChange?: (data: Record<string, Record<string, unknown>>) => void;
  /** App-provided custom field types — exposed via context for custom field rendering */
  customFieldTypes?: CustomTypeDefinition[];
  /** App-provided external enum lists — resolved into ResolvedField.resolvedOptions */
  externalEnums?: ExternalEnum[];
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Context provider that initialises the runtime store and wires up callbacks.
 *
 * ### Multi-journey support
 * Each `<WaypointRunner>` creates its own **isolated** Zustand store instance,
 * so multiple runners with different schemas can coexist in the same app
 * without any state interference:
 *
 * ```tsx
 * // Both journeys live side-by-side — each has its own store
 * <WaypointRunner schema={projectSchema}>…</WaypointRunner>
 * <WaypointRunner schema={depositSchema}>…</WaypointRunner>
 * ```
 *
 * ### Pause & Resume
 * When `schema.persistenceMode === "zustand"`, each journey's state
 * (`data`, `currentStepId`, `history`) is saved to localStorage under a
 * per-schema key (`waypoint-runtime-<schemaId>`).
 *
 * On remount, `WaypointRunner` detects the saved state and calls `resume()`
 * instead of `init()`, so the user lands back exactly where they left off —
 * navigation state and form data intact.
 *
 * @example
 * <WaypointRunner schema={mySchema} onComplete={handleComplete}>
 *   {children}
 * </WaypointRunner>
 */
export function WaypointRunner({
  schema,
  externalVars = {},
  defaultValues = {},
  fetchData,
  onComplete,
  onStepComplete,
  onDataChange,
  customFieldTypes,
  externalEnums,
  children,
}: WaypointRunnerProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Create store once per runner instance.
  // The persist middleware (when active) hydrates synchronously from localStorage,
  // so by the time the first useEffect fires, persisted state is already in the store.
  const storeRef = useRef<ReturnType<typeof createRuntimeStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createRuntimeStore({
      persistenceMode: schema.persistenceMode,
      schemaId: schema.id,
    });
  }
  const store = storeRef.current;

  // Subscribe to missing blocking vars to show error UI reactively
  const missingVars = useStore(store, (s: WaypointRuntimeStore) => {
    if (!s.schema) return [];
    return resolveTree(s.schema, s.data, s.externalVars).missingExternalVars;
  });

  // ---------------------------------------------------------------------------
  // Init / Resume on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      // ── Resume path ────────────────────────────────────────────────────────
      // When persistenceMode is "zustand", the persist middleware has already
      // synchronously hydrated the store from localStorage by the time this
      // effect runs.  If the saved schemaId matches, we resume instead of
      // resetting so the user picks up exactly where they left off.
      if (
        schema.persistenceMode === "zustand" &&
        hasPersistedState(store, schema.id)
      ) {
        // Keep data + currentStepId + history — just update schema & externalVars
        store.getState().resume(schema, externalVars);

        // Navigate to the persisted step
        const state = store.getState();
        if (state.currentStepId) {
          const tree = resolveTree(schema, state.data, state.externalVars, externalEnums);
          const step = tree.steps.find(
            (s) => s.definition.id === state.currentStepId
          );
          if (step && step.definition.url !== pathname) {
            router.push(step.definition.url);
          }
        }
        return;
      }

      // ── Fresh-start path ───────────────────────────────────────────────────
      let data = { ...defaultValues };

      if (fetchData) {
        try {
          const fetched = await fetchData();
          if (!cancelled) {
            data = { ...data, ...fetched };
          }
        } catch (err) {
          console.error("Waypoint: fetchData failed", err);
        }
      }

      if (cancelled) return;

      store.getState().init(schema, { data, externalVars });

      // Deep-link resume: if the user already has data, redirect to the last
      // valid step instead of forcing them back to step 1.
      const state = store.getState();
      const tree = resolveTree(schema, state.data, state.externalVars, externalEnums);
      const lastValid = findLastValidStep(tree.steps, state.data, state.externalVars);

      if (lastValid && lastValid.definition.url !== pathname) {
        router.push(lastValid.definition.url);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync externalVars into the store when the prop changes after mount
  useEffect(() => {
    for (const [key, value] of Object.entries(externalVars)) {
      store.getState().setExternalVar(key, value);
    }
  }, [externalVars, store]);

  const contextValue = useMemo(
    () => ({
      schema,
      store,
      onComplete,
      onStepComplete,
      onDataChange,
      customFieldTypes,
      externalEnums,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, store, externalEnums]
  );

  // Show a blocking error if required external variables are missing after init
  if (missingVars.length > 0) {
    return (
      <div
        role="alert"
        style={{
          color: "#b91c1c",
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          fontFamily: "sans-serif",
        }}
      >
        <strong>Waypoint Runtime Error</strong>
        <p style={{ margin: "0.5rem 0 0" }}>
          Missing required external variables:{" "}
          <code>{missingVars.join(", ")}</code>
        </p>
      </div>
    );
  }

  return (
    <WaypointRuntimeContext.Provider value={contextValue}>
      {children}
    </WaypointRuntimeContext.Provider>
  );
}
