"use client";

import { useRouter } from "next/navigation";
import { WaypointRunner } from "@waypointjs/next";
import { WaypointDevtools } from "@waypointjs/devtools";
import { projectSchema } from "./schema";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <WaypointRunner
      schema={projectSchema}
      onComplete={(data) => {
        console.log("✅ Projet créé !", data);
        router.push("/journeys?completed=project");
      }}
      onStepComplete={(stepId, data) => {
        console.log(`📌 Étape "${stepId}" sauvegardée`, data);
      }}
    >
      {children}
      <WaypointDevtools forceShow />
    </WaypointRunner>
  );
}
