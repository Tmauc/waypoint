"use client";

import { useState } from "react";
import { useBuilderStore } from "../store/builder-store";
import {
  computeStepDependencies,
  getStepDependencyLabels,
  isMoveValid,
} from "../utils/step-dependencies";

export function StepList() {
  const { schema, selectedStepId, addStep, removeStep, selectStep, reorderSteps } =
    useBuilderStore();

  const [moveError, setMoveError] = useState<string | null>(null);

  const steps = schema.steps;
  const deps = computeStepDependencies(schema);

  const tryMove = (fromIndex: number, toIndex: number) => {
    const check = isMoveValid(steps, deps, fromIndex, toIndex);
    if (!check.valid) {
      setMoveError(check.reason ?? "Invalid move");
      setTimeout(() => setMoveError(null), 3000);
      return;
    }
    setMoveError(null);
    reorderSteps(fromIndex, toIndex);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Steps ({steps.length})</span>
        <button style={styles.addBtn} onClick={() => addStep()}>
          + Add step
        </button>
      </div>

      {/* Dependency violation error */}
      {moveError && (
        <div style={styles.errorBanner}>
          <span style={styles.errorIcon}>⚠</span>
          {moveError}
        </div>
      )}

      <div style={styles.list}>
        {steps.length === 0 && (
          <div style={styles.empty}>No steps yet. Click "Add step" to start.</div>
        )}

        {steps.map((step, index) => {
          const isSelected = step.id === selectedStepId;
          const hasCondition = !!step.visibleWhen;
          const depLabels = getStepDependencyLabels(step.id, deps, schema);

          const canMoveUp =
            index > 0 && isMoveValid(steps, deps, index, index - 1).valid;
          const canMoveDown =
            index < steps.length - 1 &&
            isMoveValid(steps, deps, index, index + 1).valid;

          const dependents = steps.filter((s) =>
            (deps.get(s.id) ?? new Set()).has(step.id)
          );

          return (
            <div
              key={step.id}
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
              }}
              onClick={() => selectStep(step.id)}
            >
              <div style={styles.cardMain}>
                <div style={styles.cardLeft}>
                  <div style={styles.cardIndex}>{index + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.cardTitle}>{step.title}</div>
                    <div style={styles.cardMeta}>
                      {step.fields.length} field{step.fields.length !== 1 ? "s" : ""}
                      {hasCondition && (
                        <span style={styles.conditionBadge}>conditional</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  {index > 0 && (
                    <button
                      style={{
                        ...styles.iconBtn,
                        ...(canMoveUp ? {} : styles.iconBtnBlocked),
                      }}
                      title={
                        canMoveUp
                          ? "Move up"
                          : `Can't move up — dependency order required`
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        tryMove(index, index - 1);
                      }}
                    >
                      ↑
                    </button>
                  )}
                  {index < steps.length - 1 && (
                    <button
                      style={{
                        ...styles.iconBtn,
                        ...(canMoveDown ? {} : styles.iconBtnBlocked),
                      }}
                      title={
                        canMoveDown
                          ? "Move down"
                          : `Can't move down — dependency order required`
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        tryMove(index, index + 1);
                      }}
                    >
                      ↓
                    </button>
                  )}
                  <button
                    style={{ ...styles.iconBtn, ...styles.deleteBtn }}
                    title="Remove step"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Dependency info */}
              {depLabels.length > 0 && (
                <div style={styles.depRow}>
                  <span style={styles.depLabel}>needs:</span>
                  {depLabels.map((label) => (
                    <span key={label} style={styles.depBadge}>{label}</span>
                  ))}
                </div>
              )}
              {dependents.length > 0 && (
                <div style={styles.depRow}>
                  <span style={styles.depLabelUsed}>used by:</span>
                  {dependents.map((s) => (
                    <span key={s.id} style={styles.depBadgeUsed}>{s.title}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", height: "100%" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px", borderBottom: "1px solid var(--wp-border)",
  },
  title: { fontWeight: 600, fontSize: 13, color: "var(--wp-text-secondary)" },
  addBtn: {
    fontSize: 12, padding: "4px 10px", background: "var(--wp-primary)", color: "var(--wp-canvas)",
    border: "none", borderRadius: "var(--wp-radius)", cursor: "pointer", fontWeight: 500,
  },
  errorBanner: {
    margin: "8px 8px 0", padding: "8px 12px", background: "var(--wp-danger-bg)",
    border: "1px solid var(--wp-danger-border)", borderRadius: "var(--wp-radius-lg)", fontSize: 12,
    color: "var(--wp-danger-text)", display: "flex", alignItems: "center", gap: 6,
  },
  errorIcon: { fontSize: 14 },
  list: { flex: 1, overflowY: "auto", padding: 8 },
  empty: { padding: 24, textAlign: "center", color: "var(--wp-text-subtle)", fontSize: 13 },
  card: {
    padding: "10px 12px", borderRadius: "var(--wp-radius-lg)", marginBottom: 4,
    border: "1px solid transparent", cursor: "pointer",
    background: "var(--wp-surface)", transition: "all 0.1s",
    display: "flex", flexDirection: "column", gap: 6,
  },
  cardSelected: { background: "var(--wp-primary-muted)", border: "1px solid var(--wp-primary-border)" },
  cardMain: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 },
  cardIndex: {
    width: 24, height: 24, borderRadius: "50%", background: "var(--wp-border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, color: "var(--wp-text-muted)", flexShrink: 0,
  },
  cardTitle: { fontSize: 13, fontWeight: 600, color: "var(--wp-text)" },
  cardMeta: {
    fontSize: 11, color: "var(--wp-text-subtle)", display: "flex",
    alignItems: "center", gap: 6, marginTop: 2,
  },
  conditionBadge: {
    fontSize: 10, background: "var(--wp-warning-bg)", color: "var(--wp-warning)",
    padding: "1px 6px", borderRadius: 4, fontWeight: 600,
  },
  cardActions: { display: "flex", gap: 4, flexShrink: 0 },
  iconBtn: {
    width: 24, height: 24, border: "none", background: "transparent",
    cursor: "pointer", borderRadius: 4, fontSize: 12, color: "var(--wp-text-subtle)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  iconBtnBlocked: {
    color: "var(--wp-border-muted)", cursor: "not-allowed", opacity: 0.4,
  },
  deleteBtn: { color: "var(--wp-danger)" },
  depRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 },
  depLabel: { fontSize: 10, fontWeight: 600, color: "var(--wp-text-muted)", textTransform: "uppercase" },
  depLabelUsed: { fontSize: 10, fontWeight: 600, color: "var(--wp-success)", textTransform: "uppercase" },
  depBadge: {
    fontSize: 10, fontWeight: 600, padding: "1px 6px",
    background: "var(--wp-primary-bg)", color: "var(--wp-primary-dark)", borderRadius: 4,
  },
  depBadgeUsed: {
    fontSize: 10, fontWeight: 600, padding: "1px 6px",
    background: "var(--wp-success-bg)", color: "var(--wp-success)", borderRadius: 4,
  },
};
