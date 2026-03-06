"use client";

import { useRouter, useParams } from "next/navigation";
import { WaypointRunner } from "@waypointjs/next";
import { EXAMPLES } from "../../../builder/examples";
import type { WaypointSchema } from "@waypointjs/core";

function rewriteUrls(schema: WaypointSchema, schemaId: string): WaypointSchema {
  return {
    ...schema,
    steps: schema.steps.map((step) => ({
      ...step,
      url: `/journeys/run/${schemaId}/${step.id}`,
    })),
  };
}

export default function RunLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.schemaId as string;

  const example = EXAMPLES.find((e) => e.id === schemaId);
  if (!example) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
        Schema not found
      </div>
    );
  }

  const schema = rewriteUrls(example.schema, schemaId);

  return (
    <WaypointRunner
      schema={schema}
      onComplete={(data) => {
        console.log("Journey completed!", data);
        router.push(`/journeys?completed=${schema.id}`);
      }}
      onStepComplete={(stepId, data) => {
        console.log(`Step "${stepId}" saved`, data);
      }}
    >
      {children}
    </WaypointRunner>
  );
}
