"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { SIMPLE_JOURNEY_ID } from "@/lib/simple-journey-config";

export default function Step4() {
  useStepWaypoint("savings");
  const nav = useWaypoint({ journeyId: SIMPLE_JOURNEY_ID });

  return (
    <StepCard
      title="Step 4 — Your Savings"
      onBack={() => nav.goBack()}
      onNext={() => nav.goNext()}
    >
      <p className="text-gray-600">How much do you have in savings?</p>
      <div className="mt-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Current savings (€)
          </span>
          <input
            type="number"
            placeholder="10000"
            className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
      </div>
    </StepCard>
  );
}
