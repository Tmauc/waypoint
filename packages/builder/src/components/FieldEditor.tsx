"use client";

import { useState } from "react";
import type { ValidationRule } from "@waypointjs/core";
import { useBuilderStore } from "../store/builder-store";
import { useBuilderExternalEnums, useBuilderReadOnly } from "../context";
import { ConditionBuilder } from "./ConditionBuilder";
import { ValidationBuilder } from "./ValidationBuilder";
import { DependsOnInput } from "./DependsOnInput";
import { Modal } from "./Modal";

const ENUM_FIELD_TYPES = ["select", "multiselect", "radio"];

export function FieldEditor() {
  const {
    schema, selectedStepId, selectedFieldId,
    updateField, setFieldCondition,
  } = useBuilderStore();
  const readOnly = useBuilderReadOnly();
  const externalEnums = useBuilderExternalEnums();

  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

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

  const handleValidationChange = (rules: ValidationRule[]) => {
    updateField(step.id, field.id, { validation: rules.length ? rules : undefined });
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

        {/* External enum — shown for select/multiselect/radio when externalEnums are available */}
        {ENUM_FIELD_TYPES.includes(field.type) && externalEnums.length > 0 && (
          <div style={styles.group}>
            <label style={styles.label}>Options source</label>
            <select
              style={styles.input}
              disabled={readOnly}
              value={field.externalEnumId ?? ""}
              onChange={(e) => {
                const enumId = e.target.value || undefined;
                updateField(step.id, field.id, {
                  externalEnumId: enumId,
                  // Clear hardcoded options when switching to an enum
                  options: enumId ? undefined : field.options,
                });
              }}
            >
              <option value="">— Hardcoded options —</option>
              {externalEnums.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.label} ({en.values.length} items)
                </option>
              ))}
            </select>
            {field.externalEnumId && (
              <div style={styles.enumInfo}>
                {(() => {
                  const en = externalEnums.find((e) => e.id === field.externalEnumId);
                  return en ? (
                    <span style={styles.enumBadge}>
                      ⊞ {en.label} · {en.values.length} options
                    </span>
                  ) : (
                    <span style={styles.enumMissing}>⚠ Enum "{field.externalEnumId}" not found</span>
                  );
                })()}
              </div>
            )}
          </div>
        )}

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

        {/* Validation — summary */}
        <div style={styles.conditionRow}>
          <div style={styles.conditionInfo}>
            <div style={styles.label}>Validation</div>
            {validation.length > 0 ? (
              <div style={styles.conditionSummary}>
                <span style={styles.validationBadge}>
                  {validation.length} rule{validation.length !== 1 ? "s" : ""}
                  {isRequired ? " · required" : ""}
                </span>
                <span style={styles.conditionDesc}>
                  {validation.map((r) => r.type).join(", ")}
                </span>
              </div>
            ) : (
              <div style={styles.conditionNone}>No rules · field is optional</div>
            )}
          </div>
          <div style={styles.conditionActions}>
            <button style={styles.editConditionBtn} onClick={() => setValidationModalOpen(true)}>
              {validation.length > 0 ? "Edit" : "Add"}
            </button>
            {validation.length > 0 && (
              <button
                style={styles.clearConditionBtn}
                onClick={() => updateField(step.id, field.id, { validation: undefined })}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation modal */}
      {validationModalOpen && (
        <Modal
          title={`Validation — "${field.label}"`}
          onClose={() => setValidationModalOpen(false)}
          width={680}
        >
          <p style={styles.modalHint}>
            Define validation rules for this field. All rules must pass for the field to be valid.
          </p>
          <ValidationBuilder
            value={validation}
            onChange={handleValidationChange}
          />
          <div style={styles.modalFooter}>
            <button style={styles.modalCloseBtn} onClick={() => setValidationModalOpen(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}

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
  validationBadge: {
    fontSize: 11, fontWeight: 700, background: "var(--wp-primary-bg)", color: "var(--wp-primary-dark)",
    padding: "2px 8px", borderRadius: 4,
  },
  enumInfo: { marginTop: 4 },
  enumBadge: {
    fontSize: 11, fontWeight: 600, padding: "2px 8px",
    background: "var(--wp-info-bg)", color: "var(--wp-info-text)", borderRadius: 4,
  },
  enumMissing: {
    fontSize: 11, fontWeight: 600, padding: "2px 8px",
    background: "var(--wp-warning-bg)", color: "var(--wp-warning)", borderRadius: 4,
  },
  modalHint: { fontSize: 13, color: "var(--wp-text-muted)", marginBottom: 16, marginTop: 0 },
  modalFooter: { marginTop: 20, display: "flex", justifyContent: "flex-end" },
  modalCloseBtn: {
    fontSize: 13, padding: "7px 20px", background: "var(--wp-primary)", color: "var(--wp-canvas)",
    border: "none", borderRadius: "var(--wp-radius-lg)", cursor: "pointer", fontWeight: 600,
  },
};
