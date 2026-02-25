"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { JOURNEY_B_ID } from "@/lib/multi-journey-config";

export default function JourneyBStep2() {
  useStepWaypoint("b-payment");
  const nav = useWaypoint({ journeyId: JOURNEY_B_ID });

  return (
    <StepCard title="B2 — Payment" onBack={() => nav.goBack()} onNext={() => nav.goNext()}>
      <p className="text-gray-600">Enter your payment details.</p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Card number</span>
          <input type="text" placeholder="4242 4242 4242 4242" className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm font-mono" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Expiry</span>
            <input type="text" placeholder="MM/YY" className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">CVC</span>
            <input type="text" placeholder="123" className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
        </div>
      </div>
    </StepCard>
  );
}
