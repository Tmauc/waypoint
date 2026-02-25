"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { JOURNEY_B_ID } from "@/lib/multi-journey-config";

export default function JourneyBStep1() {
  useStepWaypoint("b-plan");
  const nav = useWaypoint({ journeyId: JOURNEY_B_ID });

  return (
    <StepCard title="B1 — Choose Plan" isFirst onNext={() => nav.goNext()}>
      <p className="text-gray-600">Select a subscription plan.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {["Starter", "Pro", "Enterprise"].map((plan) => (
          <label key={plan} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-purple-50">
            <input type="radio" name="plan" value={plan} className="accent-purple-600" />
            <span className="text-sm font-medium">{plan}</span>
          </label>
        ))}
      </div>
    </StepCard>
  );
}
