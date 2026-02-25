"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { SIMPLE_JOURNEY_ID } from "@/lib/simple-journey-config";

export default function Step3() {
  useStepWaypoint("income");
  const nav = useWaypoint({ journeyId: SIMPLE_JOURNEY_ID });

  return (
    <StepCard
      title="Step 3 — Your Income"
      onBack={() => nav.goBack()}
      onNext={() => nav.goNext()}
    >
      <p className="text-gray-600">Tell us about your annual income.</p>
      <div className="mt-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Annual income (€)
          </span>
          <input
            type="number"
            placeholder="50000"
            className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
      </div>
    </StepCard>
  );
}
