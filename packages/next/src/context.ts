import { createContext, useContext } from "react";
import type { StoreApi } from "zustand";

import type { WaypointSchema } from "@waypointjs/core";
import type { WaypointRuntimeStore } from "@waypointjs/core";

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

export interface WaypointRuntimeContextValue {
  schema: WaypointSchema;
  store: StoreApi<WaypointRuntimeStore>;
  onComplete?: (data: Record<string, Record<string, unknown>>) => void | Promise<void>;
  onStepComplete?: (
    stepId: string,
    data: Record<string, unknown>
  ) => void | Promise<void>;
  onDataChange?: (data: Record<string, Record<string, unknown>>) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const WaypointRuntimeContext =
  createContext<WaypointRuntimeContextValue | null>(null);

/**
 * Returns the current WaypointRunner context.
 * Must be used inside a `<WaypointRunner>` component.
 */
export function useWaypointRuntimeContext(): WaypointRuntimeContextValue {
  const ctx = useContext(WaypointRuntimeContext);
  if (!ctx) {
    throw new Error(
      "useWaypointRuntimeContext must be called inside a <WaypointRunner> component."
    );
  }
  return ctx;
}
