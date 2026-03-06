"use client";

import type { ExternalVariable } from "@waypointjs/core";
import { useState } from "react";
import { useBuilderStore } from "../store/builder-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VarType = ExternalVariable["type"];

interface FormState {
  id: string;
  label: string;
  type: VarType;
  blocking: boolean;
}

const BLANK_FORM: FormState = { id: "", label: "", type: "string", blocking: false };

// ---------------------------------------------------------------------------
// ExternalVariablePanel
// ---------------------------------------------------------------------------

export function ExternalVariablePanel() {
  const { schema, addExternalVariable, updateExternalVariable, removeExternalVariable } = useBuilderStore();
  const variables = schema.externalVariables ?? [];

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [error, setError] = useState<string | null>(null);

  // Compute which vars are actually referenced in the schema
  const usageMap = computeUsageMap(schema.steps ?? []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function startAdd() {
    setIsAdding(true);
    setEditingId(null);
    setForm(BLANK_FORM);
    setError(null);
  }

  function startEdit(v: ExternalVariable) {
    setEditingId(v.id);
    setIsAdding(false);
    setForm({ id: v.id, label: v.label, type: v.type, blocking: v.blocking });
    setError(null);
  }

  function cancelForm() {
    setIsAdding(false);
    setEditingId(null);
    setError(null);
  }

  function validateForm(): string | null {
    if (!form.id.trim()) return "ID is required";
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.id.trim())) return "ID must be alphanumeric (no spaces)";
    if (!form.label.trim()) return "Label is required";
    if (isAdding && variables.some((v) => v.id === form.id.trim())) return `ID "${form.id}" already exists`;
    return null;
  }

  function submitAdd() {
    const err = validateForm();
    if (err) { setError(err); return; }
    addExternalVariable({ id: form.id.trim(), label: form.label.trim(), type: form.type, blocking: form.blocking });
    setIsAdding(false);
    setForm(BLANK_FORM);
    setError(null);
  }

  function submitEdit() {
    const err = validateForm();
    if (err) { setError(err); return; }
    if (!editingId) return;
    updateExternalVariable(editingId, { label: form.label.trim(), type: form.type, blocking: form.blocking });
    setEditingId(null);
    setError(null);
  }

  function remove(id: string) {
    removeExternalVariable(id);
    if (editingId === id) { setEditingId(null); setError(null); }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>External Variables</span>
        {!isAdding && (
          <button style={addBtnStyle} onClick={startAdd} title="Add external variable">
            + Add
          </button>
        )}
      </div>

      {/* Empty state */}
      {variables.length === 0 && !isAdding && (
        <p style={emptyStyle}>
          No external variables declared.<br />
          External vars are injected at runtime<br />
          (e.g. <code style={codeStyle}>$ext.userId</code>).
        </p>
      )}

      {/* Variable list */}
      {variables.map((v) => {
        const refs = usageMap.get(v.id) ?? [];
        const isBeingEdited = editingId === v.id;

        return (
          <div key={v.id} style={{ ...varRowStyle, ...(isBeingEdited ? varRowActiveStyle : {}) }}>
            {isBeingEdited ? (
              <VarForm
                form={form}
                onChange={setForm}
                error={error}
                onSubmit={submitEdit}
                onCancel={cancelForm}
                submitLabel="Save"
                idReadOnly
              />
            ) : (
              <>
                <div style={varMainStyle}>
                  <div style={varTopRowStyle}>
                    <span style={varIdStyle}>${`ext.${v.id}`}</span>
                    <div style={badgeRowStyle}>
                      <TypeBadge type={v.type} />
                      {v.blocking && <span style={blockingBadgeStyle}>blocking</span>}
                    </div>
                  </div>
                  <span style={varLabelStyle}>{v.label}</span>
                  {refs.length > 0 && (
                    <div style={refsStyle}>
                      {refs.map((ref, i) => (
                        <span key={i} style={refChipStyle}>{ref}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={varActionsStyle}>
                  <button style={actionBtnStyle} onClick={() => startEdit(v)}>Edit</button>
                  <button style={{ ...actionBtnStyle, color: "#ef4444" }} title="Remove variable" onClick={() => remove(v.id)}>✕</button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {isAdding && (
        <div style={{ ...varRowStyle, ...varRowActiveStyle }}>
          <VarForm
            form={form}
            onChange={setForm}
            error={error}
            onSubmit={submitAdd}
            onCancel={cancelForm}
            submitLabel="Add"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VarForm — inline form for add/edit
// ---------------------------------------------------------------------------

interface VarFormProps {
  form: FormState;
  onChange: (f: FormState) => void;
  error: string | null;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  idReadOnly?: boolean;
}

function VarForm({ form, onChange, error, onSubmit, onCancel, submitLabel, idReadOnly }: VarFormProps) {
  function set(key: keyof FormState, value: unknown) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div style={formStyle}>
      {/* ID */}
      <label style={formLabelStyle}>ID</label>
      <input
        style={{ ...inputStyle, ...(idReadOnly ? { background: "#f9fafb", color: "#6b7280" } : {}) }}
        value={form.id}
        onChange={(e) => set("id", e.target.value)}
        placeholder="e.g. userId"
        readOnly={idReadOnly}
      />

      {/* Label */}
      <label style={formLabelStyle}>Label</label>
      <input
        style={inputStyle}
        value={form.label}
        onChange={(e) => set("label", e.target.value)}
        placeholder="Human-readable description"
      />

      {/* Type */}
      <label style={formLabelStyle}>Type</label>
      <select style={selectStyle} value={form.type} onChange={(e) => set("type", e.target.value as VarType)}>
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="object">object</option>
      </select>

      {/* Blocking */}
      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={form.blocking}
          onChange={(e) => set("blocking", e.target.checked)}
          style={{ marginRight: 6 }}
        />
        <span style={formLabelStyle}>Blocking — throw if missing at runtime</span>
      </label>

      {/* Error */}
      {error && <p style={errorStyle}>{error}</p>}

      {/* Actions */}
      <div style={formActionsStyle}>
        <button style={cancelBtnStyle} onClick={onCancel}>Cancel</button>
        <button style={submitBtnStyle} onClick={onSubmit}>{submitLabel}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TypeBadge
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: VarType }) {
  const colors: Record<VarType, string> = {
    string: "#d1fae5",
    number: "#dbeafe",
    boolean: "#fef3c7",
    object: "#f3e8ff",
  };
  return (
    <span style={{ ...typeBadgeStyle, background: colors[type] ?? "#f3f4f6" }}>{type}</span>
  );
}

// ---------------------------------------------------------------------------
// computeUsageMap — scan all steps/fields for $ext.varId references
// ---------------------------------------------------------------------------

import type { StepDefinition, ConditionGroup } from "@waypointjs/core";

function computeUsageMap(steps: StepDefinition[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  function addRef(varId: string, label: string) {
    const existing = map.get(varId) ?? [];
    if (!existing.includes(label)) existing.push(label);
    map.set(varId, existing);
  }

  function scanPaths(paths: string[] | undefined, context: string) {
    for (const path of paths ?? []) {
      if (path.startsWith("$ext.")) addRef(path.slice(5), context);
    }
  }

  function scanCondition(group: ConditionGroup | undefined, context: string) {
    if (!group) return;
    for (const rule of group.rules ?? []) {
      if (rule.field.startsWith("$ext.")) addRef(rule.field.slice(5), context);
    }
    for (const nested of group.groups ?? []) scanCondition(nested, context);
  }

  for (const step of steps) {
    scanCondition(step.visibleWhen, step.title);
    for (const field of step.fields ?? []) {
      scanPaths(field.dependsOn, `${step.title} › ${field.label}`);
      scanCondition(field.visibleWhen, `${step.title} › ${field.label}`);
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "8px 0",
  gap: 0,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 12px 8px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const addBtnStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#6366f1",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "2px 4px",
};

const emptyStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
  padding: "8px 12px 12px",
  lineHeight: 1.5,
  margin: 0,
};

const codeStyle: React.CSSProperties = {
  fontFamily: "monospace",
  background: "#f3f4f6",
  borderRadius: 3,
  padding: "1px 3px",
};

const varRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  padding: "8px 12px",
  borderTop: "1px solid #f3f4f6",
};

const varRowActiveStyle: React.CSSProperties = {
  background: "#f9fafb",
};

const varMainStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const varTopRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
};

const varIdStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "monospace",
  fontWeight: 600,
  color: "#374151",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
};

const typeBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "1px 5px",
  borderRadius: 4,
  color: "#374151",
};

const blockingBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "1px 5px",
  borderRadius: 4,
  background: "#fee2e2",
  color: "#dc2626",
};

const varLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 1,
};

const refsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  marginTop: 4,
};

const refChipStyle: React.CSSProperties = {
  fontSize: 10,
  padding: "1px 6px",
  borderRadius: 4,
  background: "#eff6ff",
  color: "#3b82f6",
  border: "1px solid #bfdbfe",
};

const varActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 2,
  flexShrink: 0,
};

const actionBtnStyle: React.CSSProperties = {
  fontSize: 11,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#6b7280",
  padding: "2px 4px",
};

// Form styles
const formStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const formLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "5px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#ef4444",
  margin: 0,
  padding: "4px 8px",
  background: "#fef2f2",
  borderRadius: 4,
  border: "1px solid #fca5a5",
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  justifyContent: "flex-end",
  marginTop: 2,
};

const cancelBtnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  background: "none",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  cursor: "pointer",
  color: "#374151",
};

const submitBtnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 12px",
  background: "#6366f1",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  color: "#fff",
  fontWeight: 600,
};
