"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { SIMPLE_JOURNEY_ID } from "@/lib/simple-journey-config";

export default function Step2() {
  useStepWaypoint("address");
  const nav = useWaypoint({ journeyId: SIMPLE_JOURNEY_ID });

  return (
    <StepCard
      title="Step 2 — Your Address"
      onBack={() => nav.goBack()}
      onNext={() => nav.goNext()}
    >
      <p className="text-gray-600">Where do you live?</p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Street</span>
          <input
            type="text"
            placeholder="123 Main St"
            className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">City</span>
          <input
            type="text"
            placeholder="Paris"
            className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
      </div>
    </StepCard>
  );
}
