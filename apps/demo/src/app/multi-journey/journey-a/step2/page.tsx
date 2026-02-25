"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { JOURNEY_A_ID } from "@/lib/multi-journey-config";

export default function JourneyAStep2() {
  useStepWaypoint("a-profile");
  const nav = useWaypoint({ journeyId: JOURNEY_A_ID });

  return (
    <StepCard title="A2 — Profile" onBack={() => nav.goBack()} onNext={() => nav.goNext()}>
      <p className="text-gray-600">Fill in your profile information.</p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Display name</span>
          <input type="text" placeholder="johndoe" className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
      </div>
    </StepCard>
  );
}
