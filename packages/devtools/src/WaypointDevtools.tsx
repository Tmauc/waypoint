"use client";

import { DevPanel } from "./DevPanel";
import type { DevPanelProps } from "./DevPanel";

export type WaypointDevtoolsProps = DevPanelProps;

/**
 * Drop-in debug panel for Waypoint Runtime.
 *
 * - **Dev-only** : renders nothing in production (NODE_ENV !== "development").
 * - Must be placed **inside** a `<WaypointRunner>` to access the runtime context.
 *
 * @example
 * <WaypointRunner schema={mySchema} onComplete={...}>
 *   {children}
 *   <WaypointDevtools />
 * </WaypointRunner>
 */
export function WaypointDevtools(props: WaypointDevtoolsProps) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return <DevPanel {...props} />;
}
