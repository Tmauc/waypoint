"use client";

import { useWaypointStore } from "@waypoint/core";
import { useWaypointInitializer } from "@waypoint/next";
import { ProgressBar } from "@/components/ProgressBar";
import { JOURNEY_B_ID, JOURNEY_B_TREE } from "@/lib/multi-journey-config";

export default function JourneyBLayout({ children }: { children: React.ReactNode }) {
  useWaypointInitializer({
    journeyId: JOURNEY_B_ID,
    tree: JOURNEY_B_TREE,
    dataAsLoaded: true,
  });

  const progress = useWaypointStore(
    (s) => s.getJourney(JOURNEY_B_ID)?.progress ?? 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-purple-700">Journey B — Subscription</h2>
        <a href="/multi-journey" className="text-sm text-gray-500 hover:text-gray-700">← Back to overview</a>
      </div>
      <ProgressBar progress={progress} label="Journey B progress" />
      {children}
    </div>
  );
}
