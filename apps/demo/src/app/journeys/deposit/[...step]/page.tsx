"use client";

import { StepRenderer } from "../../_components/StepRenderer";

export default function DepositStepPage() {
  return (
    <StepRenderer
      journeyName="Versement"
      journeyHref="/journeys/deposit/compte"
    />
  );
}
