"use client";

import { useState } from "react";
import { useBuilderStore } from "../store/builder-store";
import { useBuilderReadOnly } from "../context";
import { ConditionBuilder } from "./ConditionBuilder";
import { Modal } from "./Modal";

export function StepEditor() {
  const { schema, selectedStepId, updateStep, setStepCondition } = useBuilderStore();
  const readOnly = useBuilderReadOnly();
  const [conditionModalOpen, setConditionModalOpen] = useState(false);

  const step = schema.steps.find((s) => s.id === selectedStepId);

  if (!step) {
    return (
      <div style={styles.empty}>
        Select a step to configure its properties.
      </div>
    );
  }

  const hasCondition = !!step.visibleWhen;
  const ruleCount = step.visibleWhen?.rules.length ?? 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>Step Config</div>
        <div style={styles.stepId}>id: {step.id}</div>
      </div>

      <div style={styles.body}>
        {/* Title */}
        <div style={styles.group}>
          <label style={styles.label}>Title</label>
          <input
            style={styles.input}
            value={step.title}
            placeholder="Step title"
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => updateStep(step.id, { title: e.target.value })}
          />
        </div>

        {/* URL */}
        <div style={styles.group}>
          <label style={styles.label}>URL</label>
          <input
            style={styles.input}
            value={step.url}
            placeholder="/onboarding/step-name"
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => updateStep(step.id, { url: e.target.value })}
          />
          <div style={styles.hint}>Supports {"{{PARAM}}"} placeholders</div>
        </div>

        {/* Resume */}
        <div style={styles.checkRow}>
          <input
            type="checkbox"
            id={`resume-${step.id}`}
            checked={!!step.enableResumeFromHere}
            disabled={readOnly}
            onChange={readOnly ? undefined : (e) =>
              updateStep(step.id, { enableResumeFromHere: e.target.checked || undefined })
            }
          />
          <label htmlFor={`resume-${step.id}`} style={styles.checkLabel}>
            Resume from this step
          </label>
        </div>

        <div style={styles.divider} />

        {/* Visibility condition — summary */}
        <div style={styles.conditionRow}>
          <div style={styles.conditionInfo}>
            <div style={styles.label}>Visibility condition</div>
            {hasCondition ? (
              <div style={styles.conditionSummary}>
                <span style={styles.conditionBadge}>
                  {ruleCount} rule{ruleCount !== 1 ? "s" : ""} · {step.visibleWhen!.combinator.toUpperCase()}
                </span>
                <span style={styles.conditionDesc}>
                  Step is conditional
                </span>
              </div>
            ) : (
              <div style={styles.conditionNone}>Always visible</div>
            )}
          </div>
          {!readOnly && (
            <div style={styles.conditionActions}>
              <button
                style={styles.editConditionBtn}
                onClick={() => setConditionModalOpen(true)}
              >
                {hasCondition ? "Edit" : "Add condition"}
              </button>
              {hasCondition && (
                <button
                  style={styles.clearConditionBtn}
                  onClick={() => setStepCondition(step.id, undefined)}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Condition modal */}
      {conditionModalOpen && (
        <Modal
          title={`Condition — "${step.title}"`}
          onClose={() => setConditionModalOpen(false)}
          width={620}
        >
          <p style={styles.modalHint}>
            Define when this step is visible. Leave empty to always show it.
          </p>
          <ConditionBuilder
            value={step.visibleWhen}
            onChange={(c) => setStepCondition(step.id, c)}
          />
          <div style={styles.modalFooter}>
            <button
              style={styles.modalCloseBtn}
              onClick={() => setConditionModalOpen(false)}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  empty: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100%", color: "var(--wp-text-subtle)", fontSize: 13, textAlign: "center", padding: 32,
  },
  header: {
    padding: "12px 16px", borderBottom: "1px solid var(--wp-border)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { fontWeight: 700, fontSize: 13, color: "var(--wp-text)" },
  stepId: { fontSize: 10, color: "var(--wp-text-subtle)", fontFamily: "monospace" },
  body: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  group: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 11, fontWeight: 600, color: "var(--wp-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: {
    fontSize: 13, padding: "6px 8px", border: "1px solid var(--wp-border-muted)",
    borderRadius: "var(--wp-radius)", outline: "none",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
  },
  hint: { fontSize: 10, color: "var(--wp-text-subtle)" },
  checkRow: { display: "flex", alignItems: "center", gap: 8 },
  checkLabel: { fontSize: 13, color: "var(--wp-text-secondary)" },
  divider: { height: 1, background: "var(--wp-border)" },
  conditionRow: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
  },
  conditionInfo: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  conditionSummary: { display: "flex", alignItems: "center", gap: 8 },
  conditionBadge: {
    fontSize: 11, fontWeight: 700, background: "var(--wp-warning-bg)", color: "var(--wp-warning)",
    padding: "2px 8px", borderRadius: 4,
  },
  conditionDesc: { fontSize: 11, color: "var(--wp-text-subtle)" },
  conditionNone: { fontSize: 12, color: "var(--wp-text-subtle)", fontStyle: "italic" },
  conditionActions: { display: "flex", gap: 6, flexShrink: 0, alignItems: "flex-start", marginTop: 16 },
  editConditionBtn: {
    fontSize: 11, padding: "4px 10px", background: "var(--wp-primary)", color: "var(--wp-canvas)",
    border: "none", borderRadius: "var(--wp-radius)", cursor: "pointer", fontWeight: 500,
  },
  clearConditionBtn: {
    fontSize: 11, padding: "4px 10px", background: "var(--wp-danger-bg-strong)", color: "var(--wp-danger)",
    border: "none", borderRadius: "var(--wp-radius)", cursor: "pointer",
  },
  modalHint: { fontSize: 13, color: "var(--wp-text-muted)", marginBottom: 16, marginTop: 0 },
  modalFooter: { marginTop: 20, display: "flex", justifyContent: "flex-end" },
  modalCloseBtn: {
    fontSize: 13, padding: "7px 20px", background: "var(--wp-primary)", color: "var(--wp-canvas)",
    border: "none", borderRadius: "var(--wp-radius-lg)", cursor: "pointer", fontWeight: 600,
  },
};
