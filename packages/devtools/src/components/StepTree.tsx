"use client";

import type { WaypointSchema } from "@waypointjs/core";
import type { ResolvedTree } from "@waypointjs/core";
import { badge, progressBar, progressTrack, TEXT_DIM, TEXT_BRIGHT, ACCENT } from "../styles";

interface StepTreeProps {
  schema: WaypointSchema;
  tree: ResolvedTree;
  currentStepId: string | null;
  progress: number;
  completed: boolean;
}

export function StepTree({ schema, tree, currentStepId, progress, completed }: StepTreeProps) {
  const currentIdx = tree.steps.findIndex((s) => s.definition.id === currentStepId);

  return (
    <div>
      {/* Schema info */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ color: TEXT_DIM, fontSize: "0.65rem" }}>schema</div>
        <div style={{ color: TEXT_BRIGHT, fontWeight: "bold" }}>{schema.name}</div>
        <div style={{ color: TEXT_DIM }}>{schema.id} · v{schema.version}</div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: TEXT_DIM, fontSize: "0.65rem" }}>
          <span>progression</span>
          <span>{completed ? "✓ terminé" : `${progress}%`}</span>
        </div>
        <div style={progressTrack}>
          <div style={progressBar(completed ? 100 : progress)} />
        </div>
      </div>

      {/* Visible steps */}
      <div style={{ marginBottom: "0.5rem" }}>
        {tree.steps.map((step, i) => {
          const isCurrent = step.definition.id === currentStepId;
          const isDone = completed || i < currentIdx;
          return (
            <div
              key={step.definition.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.3rem 0",
                borderLeft: isCurrent ? `2px solid ${ACCENT}` : "2px solid transparent",
                paddingLeft: "0.5rem",
                marginLeft: "-0.5rem",
                opacity: (!isDone && !isCurrent) ? 0.45 : 1,
              }}
            >
              <div style={{
                width: "1.1rem",
                height: "1.1rem",
                borderRadius: "50%",
                background: isDone ? "#22c55e" : isCurrent ? ACCENT : "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                flexShrink: 0,
                marginTop: "0.1rem",
              }}>
                {isDone ? "✓" : i + 1}
              </div>
              <div>
                <div style={{ color: isCurrent ? TEXT_BRIGHT : TEXT_DIM, fontWeight: isCurrent ? "bold" : "normal" }}>
                  {step.definition.title}
                </div>
                <div style={{ color: TEXT_DIM, fontSize: "0.65rem" }}>{step.definition.url}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden steps */}
      {tree.hiddenSteps.length > 0 && (
        <div>
          <div style={{ color: TEXT_DIM, fontSize: "0.65rem", marginBottom: "0.25rem" }}>
            steps cachées ({tree.hiddenSteps.length})
          </div>
          {tree.hiddenSteps.map((step) => (
            <div key={step.definition.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.15rem 0", opacity: 0.5 }}>
              <span style={{ fontSize: "0.65rem" }}>⊘</span>
              <span style={{ color: TEXT_DIM }}>{step.definition.title}</span>
              <span style={badge("#94a3b8")}>hidden</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
