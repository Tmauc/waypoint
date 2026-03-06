"use client";

import { useParams, redirect } from "next/navigation";
import { EXAMPLES } from "../../../builder/examples";

export default function RunIndexPage() {
  const params = useParams();
  const schemaId = params.schemaId as string;
  const example = EXAMPLES.find((e) => e.id === schemaId);

  if (!example) redirect("/journeys");

  const firstStepId = example.schema.steps[0]?.id;
  redirect(`/journeys/run/${schemaId}/${firstStepId}`);
}
