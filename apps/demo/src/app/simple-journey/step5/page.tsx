"use client";

import { useWaypoint } from "@waypoint/next";
import { useWaypointStore } from "@waypoint/core";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { SIMPLE_JOURNEY_ID } from "@/lib/simple-journey-config";

export default function Step5() {
  useStepWaypoint("summary");
  const nav = useWaypoint({ journeyId: SIMPLE_JOURNEY_ID });
  const journey = useWaypointStore((s) => s.getJourney(SIMPLE_JOURNEY_ID));

  return (
    <StepCard
      title="Step 5 — Summary"
      isLast
      onBack={() => nav.goBack()}
      onNext={() => nav.handleRestartNavigation()}
      nextLabel="Start over"
    >
      <p className="text-gray-600">Review your journey state before finishing.</p>
      <div className="mt-4 rounded-lg bg-gray-50 p-4 font-mono text-xs text-gray-700">
        <pre>{JSON.stringify(journey, null, 2)}</pre>
      </div>
    </StepCard>
  );
}
