"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/react";
import { StepCard } from "@/components/StepCard";
import { JOURNEY_A_ID } from "@/lib/multi-journey-config";

export default function JourneyAStep1() {
  useStepWaypoint("a-credentials");
  const nav = useWaypoint({ journeyId: JOURNEY_A_ID });

  return (
    <StepCard title="A1 — Credentials" isFirst onNext={() => nav.goNext()}>
      <p className="text-gray-600">Create your account credentials.</p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input type="email" placeholder="you@example.com" className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input type="password" placeholder="••••••••" className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
      </div>
    </StepCard>
  );
}
