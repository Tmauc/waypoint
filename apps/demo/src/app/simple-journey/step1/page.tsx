"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { SIMPLE_JOURNEY_ID } from "@/lib/simple-journey-config";

export default function Step1() {
  useStepWaypoint("name");
  const nav = useWaypoint({ journeyId: SIMPLE_JOURNEY_ID });

  return (
    <StepCard
      title="Step 1 — Your Name"
      isFirst
      onNext={() => nav.goNext()}
    >
      <p className="text-gray-600">
        This is step 1 of 5. Enter your personal information.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">First name</span>
          <input
            type="text"
            placeholder="John"
            className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Last name</span>
          <input
            type="text"
            placeholder="Doe"
            className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="mt-4 text-xs text-gray-400">
        Journey ID: {nav.journeyId}
      </p>
    </StepCard>
  );
}
