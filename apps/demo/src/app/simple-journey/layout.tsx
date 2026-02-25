"use client";

import { useWaypointStore } from "@waypoint/core";
import { useWaypointInitializer } from "@waypoint/next";
import { ProgressBar } from "@/components/ProgressBar";
import {
  SIMPLE_JOURNEY_ID,
  SIMPLE_JOURNEY_TREE,
} from "@/lib/simple-journey-config";

export default function SimpleJourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isReady } = useWaypointInitializer({
    journeyId: SIMPLE_JOURNEY_ID,
    tree: SIMPLE_JOURNEY_TREE,
    dataAsLoaded: true,
  });

  const progress = useWaypointStore(
    (s) => s.getJourney(SIMPLE_JOURNEY_ID)?.progress ?? 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Simple Journey</h1>
        <p className="mt-1 text-gray-500">A 5-step form demo</p>
      </div>
      <ProgressBar progress={progress} label="Overall progress" />
      {isReady ? children : (
        <div className="text-center text-gray-400 py-12">Initializing…</div>
      )}
    </div>
  );
}
