import { usePathname, useRouter } from "next/navigation";

import {
  useWaypoint as useWaypointReact,
  useWaypointInitializer as useWaypointInitializerReact,
} from "@waypoint/react";
import type {
  NavigationOptions,
  UseWaypointInitializerParams,
} from "@waypoint/react";

// Re-export framework-agnostic hooks directly
export { useStepWaypoint } from "@waypoint/react";
export type {
  NavigateToOptions,
  RouterAdapter,
  WaypointNavigation,
  UseWaypointInitializerParams,
} from "@waypoint/react";

// ── Next.js-wired hooks ───────────────────────────────────────────────────────

type NextNavigationOptions = Omit<NavigationOptions, "router">;

/**
 * Drop-in waypoint navigation hook for Next.js App Router.
 * Automatically injects `useRouter` and `usePathname`.
 *
 * @example
 * const nav = useWaypoint();
 * nav.goNext();
 */
export const useWaypoint = (options: NextNavigationOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();

  return useWaypointReact({
    ...options,
    router: { push: router.push, pathname },
  });
};

type NextInitializerParams = Omit<UseWaypointInitializerParams, "router">;

/**
 * Initializes a waypoint journey in Next.js App Router.
 * Automatically injects `useRouter` and `usePathname`.
 */
export const useWaypointInitializer = (params: NextInitializerParams) => {
  const router = useRouter();
  const pathname = usePathname();

  return useWaypointInitializerReact({
    ...params,
    router: { push: router.push, pathname },
  });
};
