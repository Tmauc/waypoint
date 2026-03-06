"use client";

import type { ValidationRule, ValidationRuleType } from "@waypointjs/core";
import { useBuilderExternalEnums } from "../context";
import { useAllFieldPaths } from "../hooks/useAllFieldPaths";

const VALIDATION_RULES: { type: ValidationRuleType; label: string; hasValue: boolean }[] = [
  { type: "required", label: "Required", hasValue: false },
  { type: "min", label: "Min value", hasValue: true },
  { type: "max", label: "Max value", hasValue: true },
  { type: "minLength", label: "Min length", hasValue: true },
  { type: "maxLength", label: "Max length", hasValue: true },
  { type: "email", label: "Email format", hasValue: false },
  { type: "url", label: "URL format", hasValue: false },
  { type: "regex", label: "Matches regex", hasValue: true },
  { type: "equals", label: "equals", hasValue: true },
  { type: "notEquals", label: "not equals", hasValue: true },
  { type: "greaterThan", label: ">", hasValue: true },
  { type: "greaterThanOrEqual", label: ">=", hasValue: true },
  { type: "lessThan", label: "<", hasValue: true },
  { type: "lessThanOrEqual", label: "<=", hasValue: true },
  { type: "contains", label: "contains", hasValue: true },
  { type: "notContains", label: "not contains", hasValue: true },
  { type: "matches", label: "matches regex", hasValue: true },
  { type: "inEnum", label: "is in enum", hasValue: true, isEnum: true },
  { type: "notInEnum", label: "not in enum", hasValue: true, isEnum: true },
  { type: "custom", label: "Custom validator", hasValue: false },
] as { type: ValidationRuleType; label: string; hasValue: boolean; isEnum?: boolean }[];

const COMPARATOR_TYPES: Set<ValidationRuleType> = new Set([
  "equals", "notEquals", "greaterThan", "greaterThanOrEqual",
  "lessThan", "lessThanOrEqual", "contains", "notContains",
]);

interface ValidationBuilderProps {
  value: ValidationRule[];
  onChange: (value: ValidationRule[]) => void;
}

export function ValidationBuilder({ value, onChange }: ValidationBuilderProps) {
  const externalEnums = useBuilderExternalEnums();
  const allFieldPaths = useAllFieldPaths();

  const updateRule = (index: number, updates: Partial<ValidationRule>) => {
    onChange(value.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const addRule = () => {
    onChange([...value, { type: "required", message: "This field is required" }]);
  };

  const removeRule = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.container}>
      {value.length === 0 && (
        <div style={styles.empty}>No rules — field is optional by default.</div>
      )}

      {value.map((rule, index) => {
        const def = VALIDATION_RULES.find((r) => r.type === rule.type);
        return (
          <div key={index} style={styles.rule}>
            {/* Type/operator selector */}
            <select
              style={styles.typeSelect}
              value={rule.type}
              onChange={(e) => updateRule(index, { type: e.target.value as ValidationRuleType })}
            >
              {VALIDATION_RULES.map((r) => (
                <option key={r.type} value={r.type}>{r.label}</option>
              ))}
            </select>

            {/* Value — enum ref selector OR text input + optional enum value picker */}
            {def?.hasValue && (
              def.isEnum ? (
                <select
                  style={{ ...styles.typeSelect, flex: "0 0 140px" }}
                  value={rule.value != null ? String(rule.value) : ""}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                >
                  <option value="">— pick enum —</option>
                  {externalEnums.map((en) => (
                    <option key={en.id} value={en.id}>{en.label}</option>
                  ))}
                </select>
              ) : (
                <div style={styles.valueGroup}>
                  {/* Toggle: static value vs field reference (only for comparator rules) */}
                  {COMPARATOR_TYPES.has(rule.type) && (
                    <button
                      type="button"
                      style={{
                        ...styles.refToggle,
                        background: rule.refField !== undefined ? "var(--wp-primary)" : "var(--wp-surface-muted)",
                        color: rule.refField !== undefined ? "#fff" : "var(--wp-text-secondary)",
                      }}
                      title={rule.refField !== undefined ? "Comparing to field — click for static value" : "Static value — click to compare to another field"}
                      onClick={() => {
                        if (rule.refField !== undefined) {
                          // Switch back to static
                          updateRule(index, { refField: undefined, value: "" });
                        } else {
                          // Switch to field ref
                          updateRule(index, { refField: "", value: undefined });
                        }
                      }}
                    >
                      ⇄
                    </button>
                  )}

                  {rule.refField !== undefined ? (
                    <select
                      style={{ ...styles.typeSelect, flex: "1 1 auto" }}
                      value={rule.refField}
                      onChange={(e) => updateRule(index, { refField: e.target.value })}
                    >
                      <option value="">— pick field —</option>
                      {allFieldPaths.filter((fp) => !fp.isExternal).map((fp) => (
                        <option key={fp.path} value={fp.path}>{fp.label}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        style={styles.valueInput}
                        placeholder="value"
                        value={rule.value != null ? String(rule.value) : ""}
                        onChange={(e) => updateRule(index, { value: e.target.value })}
                      />
                      {externalEnums.length > 0 && (
                        <select
                          style={styles.enumPicker}
                          title="Pick a value from an enum"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) updateRule(index, { value: e.target.value });
                          }}
                        >
                          <option value="">⊞</option>
                          {externalEnums.map((en) => (
                            <optgroup key={en.id} label={en.label}>
                              {en.values.map((v) => (
                                <option key={String(v.value)} value={String(v.value)}>
                                  {v.label} ({v.value})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>
              )
            )}

            {/* Custom validator ID */}
            {rule.type === "custom" && (
              <input
                style={styles.valueInput}
                placeholder="validatorId"
                value={rule.customValidatorId ?? ""}
                onChange={(e) => updateRule(index, { customValidatorId: e.target.value })}
              />
            )}

            {/* Error message */}
            <input
              style={styles.messageInput}
              placeholder="error message"
              value={rule.message}
              onChange={(e) => updateRule(index, { message: e.target.value })}
            />

            <button style={styles.removeBtn} onClick={() => removeRule(index)}>✕</button>
          </div>
        );
      })}

      <button style={styles.addBtn} onClick={addRule}>
        + Add rule
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: 10 },
  empty: { fontSize: 13, color: "var(--wp-text-subtle)", textAlign: "center", padding: "12px 0" },
  rule: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--wp-surface)", border: "1px solid var(--wp-border)",
    borderRadius: "var(--wp-radius-lg)", padding: "8px 10px",
  },
  typeSelect: {
    flex: "0 0 150px", fontSize: 12, padding: "5px 6px",
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
  },
  valueGroup: { display: "flex", alignItems: "center", gap: 4, flex: "1 1 auto" },
  refToggle: {
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    cursor: "pointer", fontSize: 11, padding: "4px 6px", flexShrink: 0,
    fontWeight: 600, lineHeight: 1,
  },
  valueInput: {
    width: 90, fontSize: 12, padding: "5px 6px",
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
  },
  enumPicker: {
    fontSize: 11, padding: "4px 4px", border: "1px solid var(--wp-border-muted)",
    borderRadius: "var(--wp-radius)", background: "var(--wp-canvas)", color: "var(--wp-primary)",
    cursor: "pointer", flexShrink: 0,
  },
  messageInput: {
    flex: 1, fontSize: 12, padding: "5px 6px",
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    background: "var(--wp-canvas)", color: "var(--wp-text)",
    minWidth: 0,
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
};
