"use client";

import type { WaypointSchema } from "@waypointjs/core";
import { JsonView } from "./JsonView";
import { badge, TEXT_DIM, BORDER } from "../styles";

interface ExternalVarsViewProps {
  schema: WaypointSchema;
  externalVars: Record<string, unknown>;
  missingVars: string[];
}

export function ExternalVarsView({ schema, externalVars, missingVars }: ExternalVarsViewProps) {
  const vars = schema.externalVariables ?? [];

  if (vars.length === 0) {
    return <div style={{ color: TEXT_DIM, fontStyle: "italic" }}>Aucune variable externe déclarée</div>;
  }

  return (
    <div>
      {vars.map((v) => {
        const value = externalVars[v.id];
        const isMissing = missingVars.includes(v.id);
        const hasValue = value !== undefined;

        return (
          <div
            key={v.id}
            style={{
              padding: "0.4rem 0",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.2rem", marginBottom: "0.2rem" }}>
              <span style={{ fontWeight: "bold" }}>{v.id}</span>
              {v.label && v.label !== v.id && (
                <span style={{ color: TEXT_DIM }}>— {v.label}</span>
              )}
              {v.blocking && <span style={badge("#f97316")}>blocking</span>}
              {isMissing && <span style={badge("#ef4444")}>missing</span>}
              {!hasValue && !isMissing && <span style={badge("#64748b")}>undefined</span>}
            </div>
            {hasValue && (
              <div style={{ paddingLeft: "0.5rem" }}>
                <JsonView data={value} depth={0} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
