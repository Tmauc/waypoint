"use client";

import { useWaypoint } from "@waypoint/next";
import { useWaypointStore } from "@waypoint/core";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { JOURNEY_A_ID } from "@/lib/multi-journey-config";

export default function JourneyAStep3() {
  useStepWaypoint("a-confirm");
  const nav = useWaypoint({ journeyId: JOURNEY_A_ID });
  const journey = useWaypointStore((s) => s.getJourney(JOURNEY_A_ID));

  return (
    <StepCard
      title="A3 — Confirm"
      isLast
      onBack={() => nav.goBack()}
      onNext={() => nav.handleRestartNavigation()}
      nextLabel="Start over"
    >
      <p className="text-gray-600 mb-4">Journey A state snapshot:</p>
      <pre className="rounded-lg bg-blue-50 p-4 font-mono text-xs text-blue-900 overflow-auto">
        {JSON.stringify(journey, null, 2)}
      </pre>
    </StepCard>
  );
}
