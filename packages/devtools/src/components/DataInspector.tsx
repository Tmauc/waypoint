"use client";

import { useState } from "react";
import { JsonView } from "./JsonView";
import { TEXT_DIM, TEXT_BRIGHT, ACCENT, BORDER } from "../styles";

interface DataInspectorProps {
  data: Record<string, Record<string, unknown>>;
  currentStepId: string | null;
}

export function DataInspector({ data, currentStepId }: DataInspectorProps) {
  const entries = Object.entries(data);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (entries.length === 0) {
    return <div style={{ color: TEXT_DIM, fontStyle: "italic" }}>Aucune donnée</div>;
  }

  return (
    <div>
      {entries.map(([stepId, stepData]) => {
        const isCurrent = stepId === currentStepId;
        const isCollapsed = collapsed[stepId] ?? !isCurrent;
        const fieldCount = Object.keys(stepData).length;

        return (
          <div key={stepId} style={{ marginBottom: "0.4rem" }}>
            <button
              onClick={() => setCollapsed((p) => ({ ...p, [stepId]: !isCollapsed }))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                width: "100%",
                background: isCurrent ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isCurrent ? ACCENT : BORDER}`,
                borderRadius: "0.25rem",
                color: isCurrent ? TEXT_BRIGHT : TEXT_DIM,
                cursor: "pointer",
                padding: "0.3rem 0.5rem",
                fontSize: "0.72rem",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <span>{isCollapsed ? "▸" : "▾"}</span>
              <span style={{ fontWeight: isCurrent ? "bold" : "normal" }}>{stepId}</span>
              <span style={{ color: TEXT_DIM, marginLeft: "auto" }}>
                {fieldCount} champ{fieldCount > 1 ? "s" : ""}
              </span>
              {isCurrent && (
                <span style={{
                  background: ACCENT,
                  color: "#fff",
                  borderRadius: "0.2rem",
                  padding: "0 0.3rem",
                  fontSize: "0.6rem",
                }}>
                  actuel
                </span>
              )}
            </button>

            {!isCollapsed && (
              <div style={{ paddingLeft: "0.75rem", paddingTop: "0.25rem" }}>
                <JsonView data={stepData} depth={0} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
