"use client";

import { useState } from "react";
import { useBuilderStore } from "../store/builder-store";
import { isFieldMoveValid } from "../utils/step-dependencies";

const FIELD_TYPES = [
  "text", "number", "email", "password", "tel", "url",
  "textarea", "select", "multiselect", "checkbox", "radio", "date", "file",
];

export function FieldList() {
  const {
    schema, selectedStepId, selectedFieldId,
    addField, removeField, updateField, selectField, reorderFields,
  } = useBuilderStore();

  const [moveError, setMoveError] = useState<string | null>(null);

  const step = schema.steps.find((s) => s.id === selectedStepId);

  const allDependencyTargets = new Set<string>();
  for (const s of schema.steps) {
    for (const f of s.fields) {
      for (const dep of f.dependsOn ?? []) {
        allDependencyTargets.add(dep);
      }
    }
  }

  if (!step) {
    return (
      <div style={styles.empty}>
        Select a step on the left to manage its fields.
      </div>
    );
  }

  const tryMove = (fromIndex: number, toIndex: number) => {
    const check = isFieldMoveValid(step.fields, step.id, fromIndex, toIndex);
    if (!check.valid) {
      setMoveError(check.reason ?? "Invalid move");
      setTimeout(() => setMoveError(null), 3000);
      return;
    }
    setMoveError(null);
    reorderFields(step.id, fromIndex, toIndex);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.stepTitle}>{step.title}</div>
          <div style={styles.stepSub}>{step.fields.length} field{step.fields.length !== 1 ? "s" : ""}</div>
        </div>
        <button style={styles.addBtn} onClick={() => addField(step.id)}>
          + Add field
        </button>
      </div>

      {moveError && (
        <div style={styles.errorBanner}>
          <span>⚠</span> {moveError}
        </div>
      )}

      <div style={styles.list}>
        {step.fields.length === 0 && (
          <div style={styles.emptyFields}>No fields yet. Click "Add field" to start.</div>
        )}
        {step.fields.map((field, index) => {
          const isSelected = field.id === selectedFieldId;
          const isRequired = field.validation?.some((v) => v.type === "required") ?? false;
          const hasCondition = !!field.visibleWhen;
          const hasDeps = (field.dependsOn?.length ?? 0) > 0;
          const isUsedAsDep = allDependencyTargets.has(`${step.id}.${field.id}`);

          const canMoveUp = index > 0 &&
            isFieldMoveValid(step.fields, step.id, index, index - 1).valid;
          const canMoveDown = index < step.fields.length - 1 &&
            isFieldMoveValid(step.fields, step.id, index, index + 1).valid;

          const intraStepDeps = (field.dependsOn ?? [])
            .filter((p) => p.startsWith(`${step.id}.`))
            .map((p) => {
              const fieldId = p.slice(step.id.length + 1);
              return step.fields.find((f) => f.id === fieldId)?.label ?? fieldId;
            });

          const intraStepDependents = step.fields.filter((f) =>
            f.id !== field.id &&
            (f.dependsOn ?? []).includes(`${step.id}.${field.id}`)
          );

          return (
            <div
              key={field.id}
              style={{ ...styles.card, ...(isSelected ? styles.cardSelected : {}) }}
              onClick={() => selectField(field.id)}
            >
              <div style={styles.cardTop}>
                <div style={styles.cardLeft}>
                  <span style={styles.typeBadge}>{field.type}</span>
                  <span style={styles.fieldLabel}>{field.label}</span>
                </div>
                <div style={styles.cardRight}>
                  <select
                    style={styles.typeSelect}
                    value={field.type}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateField(step.id, field.id, { type: e.target.value })}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {index > 0 && (
                    <button
                      style={{ ...styles.iconBtn, ...(canMoveUp ? {} : styles.iconBtnBlocked) }}
                      title={canMoveUp ? "Move up" : "Can't move — dependency order required"}
                      onClick={(e) => { e.stopPropagation(); tryMove(index, index - 1); }}
                    >↑</button>
                  )}
                  {index < step.fields.length - 1 && (
                    <button
                      style={{ ...styles.iconBtn, ...(canMoveDown ? {} : styles.iconBtnBlocked) }}
                      title={canMoveDown ? "Move down" : "Can't move — dependency order required"}
                      onClick={(e) => { e.stopPropagation(); tryMove(index, index + 1); }}
                    >↓</button>
                  )}
                  <button
                    style={{ ...styles.iconBtn, color: "var(--wp-danger)" }}
                    title="Remove field"
                    onClick={(e) => { e.stopPropagation(); removeField(step.id, field.id); }}
                  >✕</button>
                </div>
              </div>

              {/* Badges */}
              <div style={styles.badges}>
                {!isRequired && <span style={styles.badgeOptional}>optional</span>}
                {isRequired && <span style={styles.badgeRequired}>required</span>}
                {hasCondition && <span style={styles.badgeCondition}>conditional</span>}
                {hasDeps && <span style={styles.badgeDep}>depends on {field.dependsOn!.length}</span>}
                {isUsedAsDep && <span style={styles.badgeUsed}>← dependency</span>}
              </div>

              {/* Intra-step dependency info */}
              {intraStepDeps.length > 0 && (
                <div style={styles.depRow}>
                  <span style={styles.depLabel}>needs:</span>
                  {intraStepDeps.map((label) => (
                    <span key={label} style={styles.depBadge}>{label}</span>
                  ))}
                </div>
              )}
              {intraStepDependents.length > 0 && (
                <div style={styles.depRow}>
                  <span style={styles.depLabelUsed}>used by:</span>
                  {intraStepDependents.map((f) => (
                    <span key={f.id} style={styles.depBadgeUsed}>{f.label}</span>
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
  empty: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100%", color: "var(--wp-text-subtle)", fontSize: 13, textAlign: "center", padding: 32,
  },
  emptyFields: { padding: 24, textAlign: "center", color: "var(--wp-text-subtle)", fontSize: 13 },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px", borderBottom: "1px solid var(--wp-border)",
  },
  stepTitle: { fontWeight: 700, fontSize: 14, color: "var(--wp-text)" },
  stepSub: { fontSize: 11, color: "var(--wp-text-subtle)", marginTop: 2 },
  addBtn: {
    fontSize: 12, padding: "4px 10px", background: "var(--wp-primary)", color: "var(--wp-canvas)",
    border: "none", borderRadius: "var(--wp-radius)", cursor: "pointer", fontWeight: 500,
  },
  errorBanner: {
    margin: "8px 8px 0", padding: "8px 12px", background: "var(--wp-danger-bg)",
    border: "1px solid var(--wp-danger-border)", borderRadius: "var(--wp-radius-lg)", fontSize: 12,
    color: "var(--wp-danger-text)", display: "flex", alignItems: "center", gap: 6,
  },
  list: { flex: 1, overflowY: "auto", padding: 8 },
  card: {
    padding: "10px 12px", borderRadius: "var(--wp-radius-lg)", marginBottom: 4,
    border: "1px solid transparent", cursor: "pointer",
    background: "var(--wp-surface)", display: "flex", flexDirection: "column", gap: 6,
  },
  cardSelected: { background: "var(--wp-primary-muted)", border: "1px solid var(--wp-primary-border)" },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  cardRight: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  typeBadge: {
    fontSize: 10, background: "var(--wp-primary-bg)", color: "var(--wp-primary-dark)",
    padding: "2px 7px", borderRadius: 4, fontWeight: 600, flexShrink: 0,
  },
  fieldLabel: {
    fontSize: 13, fontWeight: 600, color: "var(--wp-text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  typeSelect: {
    fontSize: 11, border: "1px solid var(--wp-border)", borderRadius: 4,
    padding: "2px 4px", background: "var(--wp-canvas)", cursor: "pointer",
    color: "var(--wp-text-secondary)",
  },
  iconBtn: {
    width: 22, height: 22, border: "none", background: "transparent",
    cursor: "pointer", borderRadius: 4, fontSize: 11, color: "var(--wp-text-subtle)",
  },
  iconBtnBlocked: { color: "var(--wp-border-muted)", cursor: "not-allowed", opacity: 0.4 },
  badges: { display: "flex", flexWrap: "wrap", gap: 4 },
  badgeOptional: {
    fontSize: 9, fontWeight: 600, padding: "1px 6px",
    background: "var(--wp-surface-muted)", color: "var(--wp-text-subtle)", borderRadius: 3, textTransform: "uppercase",
  },
  badgeRequired: {
    fontSize: 9, fontWeight: 600, padding: "1px 6px",
    background: "var(--wp-danger-bg-strong)", color: "var(--wp-danger)", borderRadius: 3, textTransform: "uppercase",
  },
  badgeCondition: {
    fontSize: 9, fontWeight: 600, padding: "1px 6px",
    background: "var(--wp-warning-bg)", color: "var(--wp-warning)", borderRadius: 3, textTransform: "uppercase",
  },
  badgeDep: {
    fontSize: 9, fontWeight: 600, padding: "1px 6px",
    background: "var(--wp-primary-bg)", color: "var(--wp-primary-dark)", borderRadius: 3, textTransform: "uppercase",
  },
  badgeUsed: {
    fontSize: 9, fontWeight: 600, padding: "1px 6px",
    background: "var(--wp-success-bg)", color: "var(--wp-success)", borderRadius: 3, textTransform: "uppercase",
  },
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
