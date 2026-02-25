"use client";

import { useWaypoint } from "@waypoint/next";
import { useWaypointStore } from "@waypoint/core";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { JOURNEY_B_ID } from "@/lib/multi-journey-config";

export default function JourneyBStep3() {
  useStepWaypoint("b-confirm");
  const nav = useWaypoint({ journeyId: JOURNEY_B_ID });
  const journey = useWaypointStore((s) => s.getJourney(JOURNEY_B_ID));

  return (
    <StepCard
      title="B3 — Confirm"
      isLast
      onBack={() => nav.goBack()}
      onNext={() => nav.handleRestartNavigation()}
      nextLabel="Start over"
    >
      <p className="text-gray-600 mb-4">Journey B state snapshot:</p>
      <pre className="rounded-lg bg-purple-50 p-4 font-mono text-xs text-purple-900 overflow-auto">
        {JSON.stringify(journey, null, 2)}
      </pre>
    </StepCard>
  );
}
