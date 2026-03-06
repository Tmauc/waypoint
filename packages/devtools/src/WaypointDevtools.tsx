"use client";

import { DevPanel } from "./DevPanel";
import type { DevPanelProps } from "./DevPanel";

export type WaypointDevtoolsProps = DevPanelProps & {
  /** Force display even in production. Useful for demo/staging environments. */
  forceShow?: boolean;
};

/**
 * Drop-in debug panel for Waypoint Runtime.
 *
 * - **Dev-only** by default: renders nothing in production (NODE_ENV !== "development").
 * - Use `forceShow` to display in production (e.g. demo environments).
 * - Must be placed **inside** a `<WaypointRunner>` to access the runtime context.
 *
 * @example
 * <WaypointRunner schema={mySchema} onComplete={...}>
 *   {children}
 *   <WaypointDevtools />              // dev only
 *   <WaypointDevtools forceShow />    // always visible
 * </WaypointRunner>
 */
export function WaypointDevtools({ forceShow, ...props }: WaypointDevtoolsProps) {
  if (process.env.NODE_ENV !== "development" && !forceShow) {
    return null;
  }
  return <DevPanel {...props} />;
}
