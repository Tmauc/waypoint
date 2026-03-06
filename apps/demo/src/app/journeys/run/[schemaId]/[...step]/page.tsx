"use client";

import { useParams } from "next/navigation";
import { StepRenderer } from "../../../_components/StepRenderer";
import { EXAMPLES } from "../../../../builder/examples";

export default function RunStepPage() {
  const params = useParams();
  const schemaId = params.schemaId as string;
  const example = EXAMPLES.find((e) => e.id === schemaId);

  return (
    <StepRenderer
      journeyName={example?.label ?? "Journey"}
      journeyHref={`/journeys/run/${schemaId}/${example?.schema.steps[0]?.id ?? ""}`}
    />
  );
}
