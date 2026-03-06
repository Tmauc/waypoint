"use client";

import { type ConditionGroup, type ConditionOperator, type ConditionRule } from "@waypoint/core";
import { useAllFieldPaths } from "../hooks/useAllFieldPaths";

const OPERATORS: { value: ConditionOperator; label: string; hasValue: boolean }[] = [
  { value: "equals", label: "equals", hasValue: true },
  { value: "notEquals", label: "not equals", hasValue: true },
  { value: "greaterThan", label: ">", hasValue: true },
  { value: "greaterThanOrEqual", label: ">=", hasValue: true },
  { value: "lessThan", label: "<", hasValue: true },
  { value: "lessThanOrEqual", label: "<=", hasValue: true },
  { value: "contains", label: "contains", hasValue: true },
  { value: "notContains", label: "not contains", hasValue: true },
  { value: "in", label: "in (comma list)", hasValue: true },
  { value: "notIn", label: "not in (comma list)", hasValue: true },
  { value: "matches", label: "matches regex", hasValue: true },
  { value: "exists", label: "exists", hasValue: false },
  { value: "notExists", label: "not exists", hasValue: false },
];

interface ConditionBuilderProps {
  value: ConditionGroup | undefined;
  onChange: (value: ConditionGroup | undefined) => void;
  excludeStepId?: string;
  excludeFieldId?: string;
}

export function ConditionBuilder({
  value,
  onChange,
  excludeStepId,
  excludeFieldId,
}: ConditionBuilderProps) {
  const allPaths = useAllFieldPaths(excludeStepId, excludeFieldId);

  const group: ConditionGroup = value ?? { combinator: "and", rules: [] };

  const updateRule = (index: number, updates: Partial<ConditionRule>) => {
    const rules = group.rules.map((r, i) => (i === index ? { ...r, ...updates } : r));
    onChange({ ...group, rules });
  };

  const addRule = () => {
    const firstPath = allPaths[0]?.path ?? "";
    onChange({
      ...group,
      rules: [...group.rules, { field: firstPath, operator: "equals", value: "" }],
    });
  };

  const removeRule = (index: number) => {
    const rules = group.rules.filter((_, i) => i !== index);
    if (rules.length === 0) { onChange(undefined); return; }
    onChange({ ...group, rules });
  };

  return (
    <div style={styles.container}>
      {/* Combinator toggle */}
      {group.rules.length > 1 && (
        <div style={styles.combinatorRow}>
          <span style={styles.combinatorLabel}>Match</span>
          {(["and", "or"] as const).map((c) => (
            <button
              key={c}
              style={{
                ...styles.combinatorBtn,
                ...(group.combinator === c ? styles.combinatorActive : {}),
              }}
              onClick={() => onChange({ ...group, combinator: c })}
            >
              {c.toUpperCase()}
            </button>
          ))}
          <span style={styles.combinatorLabel}>rules</span>
        </div>
      )}

      {/* Empty state */}
      {group.rules.length === 0 && (
        <div style={styles.empty}>
          No conditions — this step/field is always visible.
        </div>
      )}

      {/* Rules */}
      {group.rules.map((rule, index) => {
        const opDef = OPERATORS.find((o) => o.value === rule.operator);
        return (
          <div key={index} style={styles.rule}>
            {/* Field selector */}
            <select
              style={styles.select}
              value={rule.field}
              onChange={(e) => updateRule(index, { field: e.target.value })}
            >
              {allPaths.length === 0 && (
                <option value="">No fields available</option>
              )}
              {allPaths.map((p) => (
                <option key={p.path} value={p.path}>{p.label}</option>
              ))}
            </select>

            {/* Operator selector */}
            <select
              style={{ ...styles.select, width: 140 }}
              value={rule.operator}
              onChange={(e) =>
                updateRule(index, { operator: e.target.value as ConditionOperator })
              }
            >
              {OPERATORS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Value */}
            {opDef?.hasValue && (
              <input
                style={styles.valueInput}
                placeholder="value"
                value={rule.value != null ? String(rule.value) : ""}
                onChange={(e) => updateRule(index, { value: e.target.value })}
              />
            )}

            <button style={styles.removeBtn} onClick={() => removeRule(index)}>✕</button>
          </div>
        );
      })}

      <button style={styles.addBtn} onClick={addRule}>
        + Add rule
      </button>

      {/* Preview */}
      {group.rules.length > 0 && (
        <div style={styles.preview}>
          <span style={styles.previewLabel}>Preview</span>
          <pre style={styles.previewCode}>{JSON.stringify(group, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: 10 },
  combinatorRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  combinatorLabel: { fontSize: 12, color: "var(--wp-text-muted)" },
  combinatorBtn: {
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 5,
    border: "1px solid var(--wp-border-muted)", background: "var(--wp-surface)",
    cursor: "pointer", color: "var(--wp-text-secondary)",
  },
  combinatorActive: {
    background: "var(--wp-primary)", color: "var(--wp-canvas)",
    border: "1px solid var(--wp-primary)",
  },
  empty: { fontSize: 13, color: "var(--wp-text-subtle)", textAlign: "center", padding: "12px 0" },
  rule: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--wp-surface)", border: "1px solid var(--wp-border)",
    borderRadius: "var(--wp-radius-lg)", padding: "8px 10px",
  },
  select: {
    flex: 1, fontSize: 12, padding: "5px 6px",
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
    minWidth: 0,
  },
  valueInput: {
    width: 100, fontSize: 12, padding: "5px 6px",
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
  },
  removeBtn: {
    border: "none", background: "transparent", color: "var(--wp-danger)",
    cursor: "pointer", fontSize: 13, flexShrink: 0,
  },
  addBtn: {
    fontSize: 12, padding: "6px 12px", background: "var(--wp-surface-muted)",
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    cursor: "pointer", fontWeight: 500, alignSelf: "flex-start",
    color: "var(--wp-text-secondary)",
  },
  preview: { marginTop: 4 },
  previewLabel: {
    fontSize: 10, fontWeight: 600, color: "var(--wp-text-subtle)",
    textTransform: "uppercase", display: "block", marginBottom: 4,
  },
  previewCode: {
    fontSize: 10, background: "var(--wp-surface-alt)", border: "1px solid var(--wp-border)",
    borderRadius: "var(--wp-radius)", padding: 8, overflow: "auto", maxHeight: 120,
    margin: 0, color: "var(--wp-text-mono)",
  },
};
