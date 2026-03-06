"use client";

import { TEXT_DIM, TEXT_BRIGHT, ACCENT } from "../styles";

interface HistoryViewProps {
  history: string[];
  currentStepId: string | null;
}

export function HistoryView({ history, currentStepId }: HistoryViewProps) {
  if (history.length === 0) {
    return <div style={{ color: TEXT_DIM, fontStyle: "italic" }}>Aucune navigation</div>;
  }

  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {history.map((stepId, i) => {
        const isCurrent = stepId === currentStepId;
        return (
          <li
            key={`${stepId}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.2rem 0",
              color: isCurrent ? TEXT_BRIGHT : TEXT_DIM,
              fontWeight: isCurrent ? "bold" : "normal",
            }}
          >
            <span style={{ color: ACCENT, minWidth: "1.2rem", fontSize: "0.65rem" }}>
              {i + 1}.
            </span>
            <span>{stepId}</span>
            {isCurrent && (
              <span style={{
                fontSize: "0.6rem",
                background: ACCENT,
                color: "#fff",
                borderRadius: "0.2rem",
                padding: "0 0.3rem",
              }}>
                ici
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
