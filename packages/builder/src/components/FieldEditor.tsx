"use client";

import { useState } from "react";
import type { ValidationRule, ValidationRuleType } from "@waypointjs/core";
import { useBuilderStore } from "../store/builder-store";
import { ConditionBuilder } from "./ConditionBuilder";
import { DependsOnInput } from "./DependsOnInput";
import { Modal } from "./Modal";

const VALIDATION_TYPES: { type: ValidationRuleType; label: string; hasValue: boolean }[] = [
  { type: "required", label: "Required", hasValue: false },
  { type: "min", label: "Min value", hasValue: true },
  { type: "max", label: "Max value", hasValue: true },
  { type: "minLength", label: "Min length", hasValue: true },
  { type: "maxLength", label: "Max length", hasValue: true },
  { type: "email", label: "Email format", hasValue: false },
  { type: "url", label: "URL format", hasValue: false },
  { type: "regex", label: "Regex pattern", hasValue: true },
];

export function FieldEditor() {
  const {
    schema, selectedStepId, selectedFieldId,
    updateField, setFieldCondition,
  } = useBuilderStore();

  const [newValidationType, setNewValidationType] = useState<ValidationRuleType>("required");
  const [conditionModalOpen, setConditionModalOpen] = useState(false);

  const step = schema.steps.find((s) => s.id === selectedStepId);
  const field = step?.fields.find((f) => f.id === selectedFieldId);

  if (!field || !step) {
    return (
      <div style={styles.empty}>
        Select a field in the middle panel to edit its properties.
      </div>
    );
  }

  const validation = field.validation ?? [];
  const isRequired = validation.some((v) => v.type === "required");
  const hasCondition = !!field.visibleWhen;
  const ruleCount = field.visibleWhen?.rules.length ?? 0;

  const updateValidationRule = (index: number, updates: Partial<ValidationRule>) => {
    const updated = validation.map((v, i) => (i === index ? { ...v, ...updates } : v));
    updateField(step.id, field.id, { validation: updated });
  };

  const removeValidationRule = (index: number) => {
    const updated = validation.filter((_, i) => i !== index);
    updateField(step.id, field.id, { validation: updated.length ? updated : undefined });
  };

  const addValidationRule = () => {
    const newRule: ValidationRule = {
      type: newValidationType,
      message: `${newValidationType} error`,
    };
    updateField(step.id, field.id, { validation: [...validation, newRule] });
  };

  const handleDependsOnChange = (paths: string[]) => {
    updateField(step.id, field.id, { dependsOn: paths.length ? paths : undefined });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>Field Editor</span>
          {!isRequired && <span style={styles.optionalBadge}>optional</span>}
          {isRequired && <span style={styles.requiredBadge}>required</span>}
        </div>
        <div style={styles.fieldId}>id: {field.id}</div>
      </div>

      <div style={styles.body}>
        {/* Label */}
        <div style={styles.group}>
          <label style={styles.label}>Label</label>
          <input
            style={styles.input}
            value={field.label}
            onChange={(e) => updateField(step.id, field.id, { label: e.target.value })}
          />
        </div>

        {/* Placeholder */}
        <div style={styles.group}>
          <label style={styles.label}>Placeholder</label>
          <input
            style={styles.input}
            value={field.placeholder ?? ""}
            placeholder="Optional"
            onChange={(e) =>
              updateField(step.id, field.id, { placeholder: e.target.value || undefined })
            }
          />
        </div>

        {/* Default value */}
        <div style={styles.group}>
          <label style={styles.label}>Default value</label>
          <input
            style={styles.input}
            value={field.defaultValue != null ? String(field.defaultValue) : ""}
            placeholder="Optional"
            onChange={(e) =>
              updateField(step.id, field.id, { defaultValue: e.target.value || undefined })
            }
          />
        </div>

        {/* Depends on */}
        <div style={styles.group}>
          <label style={styles.label}>Depends on</label>
          <DependsOnInput
            value={field.dependsOn ?? []}
            onChange={handleDependsOnChange}
            excludeStepId={step.id}
            excludeFieldId={field.id}
          />
        </div>

        <div style={styles.divider} />

        {/* Visibility condition — summary */}
        <div style={styles.conditionRow}>
          <div style={styles.conditionInfo}>
            <div style={styles.label}>Visibility condition</div>
            {hasCondition ? (
              <div style={styles.conditionSummary}>
                <span style={styles.conditionBadge}>
                  {ruleCount} rule{ruleCount !== 1 ? "s" : ""} · {field.visibleWhen!.combinator.toUpperCase()}
                </span>
                <span style={styles.conditionDesc}>Field is conditional</span>
              </div>
            ) : (
              <div style={styles.conditionNone}>Always visible</div>
            )}
          </div>
          <div style={styles.conditionActions}>
            <button style={styles.editConditionBtn} onClick={() => setConditionModalOpen(true)}>
              {hasCondition ? "Edit" : "Add"}
            </button>
            {hasCondition && (
              <button
                style={styles.clearConditionBtn}
                onClick={() => setFieldCondition(step.id, field.id, undefined)}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Validation rules */}
        <div style={styles.sectionTitle}>
          Validation
          {!isRequired && (
            <span style={styles.optionalHint}>
              — no "required" rule → field is optional
            </span>
          )}
        </div>

        {validation.length === 0 && (
          <div style={styles.noRules}>No rules · field is optional by default.</div>
        )}

        {validation.map((rule, index) => {
          const def = VALIDATION_TYPES.find((vt) => vt.type === rule.type);
          return (
            <div key={index} style={styles.ruleCard}>
              <div style={styles.ruleHeader}>
                <span
                  style={{
                    ...styles.ruleBadge,
                    ...(rule.type === "required" ? styles.requiredRuleBadge : {}),
                  }}
                >
                  {rule.type}
                </span>
                <button style={styles.removeRuleBtn} onClick={() => removeValidationRule(index)}>
                  ✕
                </button>
              </div>
              {def?.hasValue && (
                <div style={styles.ruleRow}>
                  <label style={styles.ruleLabel}>Value</label>
                  <input
                    style={styles.ruleInput}
                    value={rule.value != null ? String(rule.value) : ""}
                    onChange={(e) => updateValidationRule(index, { value: e.target.value })}
                  />
                </div>
              )}
              <div style={styles.ruleRow}>
                <label style={styles.ruleLabel}>Error message</label>
                <input
                  style={styles.ruleInput}
                  value={rule.message}
                  onChange={(e) => updateValidationRule(index, { message: e.target.value })}
                />
              </div>
            </div>
          );
        })}

        <div style={styles.addRule}>
          <select
            style={styles.ruleSelect}
            value={newValidationType}
            onChange={(e) => setNewValidationType(e.target.value as ValidationRuleType)}
          >
            {VALIDATION_TYPES.map((vt) => (
              <option key={vt.type} value={vt.type}>{vt.label}</option>
            ))}
          </select>
          <button style={styles.addRuleBtn} onClick={addValidationRule}>
            + Add rule
          </button>
        </div>
      </div>

      {/* Field condition modal */}
      {conditionModalOpen && (
        <Modal
          title={`Condition — "${field.label}"`}
          onClose={() => setConditionModalOpen(false)}
          width={620}
        >
          <p style={styles.modalHint}>
            Define when this field is visible within its step.
          </p>
          <ConditionBuilder
            value={field.visibleWhen}
            onChange={(c) => setFieldCondition(step.id, field.id, c)}
            excludeStepId={step.id}
            excludeFieldId={field.id}
          />
          <div style={styles.modalFooter}>
            <button style={styles.modalCloseBtn} onClick={() => setConditionModalOpen(false)}>
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
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  headerTitle: { fontWeight: 700, fontSize: 13, color: "var(--wp-text)" },
  optionalBadge: {
    fontSize: 10, fontWeight: 600, padding: "2px 7px",
    background: "var(--wp-surface-muted)", color: "var(--wp-text-subtle)", borderRadius: 4,
  },
  requiredBadge: {
    fontSize: 10, fontWeight: 600, padding: "2px 7px",
    background: "var(--wp-danger-bg-strong)", color: "var(--wp-danger)", borderRadius: 4,
  },
  fieldId: { fontSize: 10, color: "var(--wp-text-subtle)", fontFamily: "monospace" },
  body: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  group: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 11, fontWeight: 600, color: "var(--wp-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: {
    fontSize: 13, padding: "6px 8px", border: "1px solid var(--wp-border-muted)",
    borderRadius: "var(--wp-radius)", outline: "none",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
  },
  divider: { height: 1, background: "var(--wp-border)" },
  conditionRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
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
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "var(--wp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" },
  optionalHint: { fontSize: 10, color: "var(--wp-text-subtle)", fontWeight: 400, textTransform: "none", letterSpacing: 0 },
  noRules: { fontSize: 12, color: "var(--wp-text-subtle)" },
  ruleCard: {
    background: "var(--wp-surface)", border: "1px solid var(--wp-border)", borderRadius: "var(--wp-radius-lg)",
    padding: 10, display: "flex", flexDirection: "column", gap: 8,
  },
  ruleHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  ruleBadge: {
    fontSize: 11, fontWeight: 700, color: "var(--wp-primary-dark)", background: "var(--wp-primary-bg)",
    padding: "2px 8px", borderRadius: 4,
  },
  requiredRuleBadge: { background: "var(--wp-danger-bg-strong)", color: "var(--wp-danger)" },
  removeRuleBtn: { border: "none", background: "transparent", color: "var(--wp-danger)", cursor: "pointer", fontSize: 12 },
  ruleRow: { display: "flex", flexDirection: "column", gap: 3 },
  ruleLabel: { fontSize: 10, fontWeight: 600, color: "var(--wp-text-subtle)", textTransform: "uppercase" },
  ruleInput: {
    fontSize: 12, padding: "4px 6px", border: "1px solid var(--wp-border-muted)",
    borderRadius: 4, outline: "none",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
  },
  addRule: { display: "flex", gap: 8, alignItems: "center" },
  ruleSelect: {
    flex: 1, fontSize: 12, padding: "5px 6px", border: "1px solid var(--wp-border-muted)",
    borderRadius: "var(--wp-radius)", background: "var(--wp-canvas)", color: "var(--wp-text)",
  },
  addRuleBtn: {
    fontSize: 12, padding: "5px 10px", background: "var(--wp-surface-muted)",
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)", cursor: "pointer",
    fontWeight: 500, whiteSpace: "nowrap", color: "var(--wp-text-secondary)",
  },
  modalHint: { fontSize: 13, color: "var(--wp-text-muted)", marginBottom: 16, marginTop: 0 },
  modalFooter: { marginTop: 20, display: "flex", justifyContent: "flex-end" },
  modalCloseBtn: {
    fontSize: 13, padding: "7px 20px", background: "var(--wp-primary)", color: "var(--wp-canvas)",
    border: "none", borderRadius: "var(--wp-radius-lg)", cursor: "pointer", fontWeight: 600,
  },
};
