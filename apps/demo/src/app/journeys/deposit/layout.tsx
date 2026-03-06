"use client";

import { useRouter } from "next/navigation";
import { WaypointRunner } from "@waypoint/next";
import { WaypointDevtools } from "@waypoint/devtools";
import { depositSchema } from "./schema";

export default function DepositLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <WaypointRunner
      schema={depositSchema}
      onComplete={(data) => {
        console.log("✅ Versement confirmé !", data);
        router.push("/journeys?completed=deposit");
      }}
      onStepComplete={(stepId, data) => {
        console.log(`📌 Étape "${stepId}" sauvegardée`, data);
      }}
    >
      {children}
      <WaypointDevtools />
    </WaypointRunner>
  );
}
