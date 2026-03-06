import { useState, useEffect } from "react";
import type { StoreApi } from "zustand";
import { useWaypoint, useWaypointStep } from "@waypointjs/react";
import type { WaypointRuntimeStore } from "@waypointjs/core";
import { resolveTree, getNextStep, getPreviousStep } from "@waypointjs/core";
import type { ExternalEnum, WaypointSchema } from "@waypointjs/core";
import type { ResolvedField, SelectOption } from "@waypointjs/core";
import { DevPanel } from "@waypointjs/devtools";

interface PreviewPanelProps {
  store: StoreApi<WaypointRuntimeStore>;
  schema: WaypointSchema;
  externalEnums?: ExternalEnum[];
  onEdit?: () => void;
}

export function PreviewPanel({ store, schema, externalEnums }: PreviewPanelProps) {
  const [done, setDone] = useState(false);

  const { tree, currentStep, progress } = useWaypoint(store, externalEnums);
  const stepId = currentStep?.definition.id ?? "";
  const { fields, stepData, setFieldValue } = useWaypointStep(store, stepId);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // External variable mocks — initialized with defaults based on type
  const extVarDefs = schema.externalVariables ?? [];
  const [mockVars, setMockVars] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const v of extVarDefs) {
      initial[v.id] = v.type === "boolean" ? false : v.type === "number" ? 0 : "";
    }
    return initial;
  });

  // Sync mockVars → store whenever they change
  useEffect(() => {
    for (const [varId, value] of Object.entries(mockVars)) {
      store.getState().setExternalVar(varId, value);
    }
  }, [mockVars]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMockVarChange(varId: string, value: unknown) {
    setMockVars((prev) => ({ ...prev, [varId]: value }));
  }

  function handleNext() {
    // 1. Validate required fields
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const isRequired = field.definition.validation?.some((r) => r.type === "required");
      if (isRequired) {
        const val = stepData[field.definition.id];
        if (val === undefined || val === null || val === "" || val === false) {
          const rule = field.definition.validation?.find((r) => r.type === "required");
          newErrors[field.definition.id] = rule?.message ?? "Ce champ est requis";
        }
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    // 2. Snapshot old step IDs
    const oldIds = tree.steps.map((s) => s.definition.id).join(",");

    // 3. Save current step data
    store.getState().setStepData(stepId, stepData);

    // 4. Re-resolve tree with new data
    const newData = store.getState().data;
    const newTree = resolveTree(schema, newData, store.getState().externalVars, externalEnums);
    const newIds = newTree.steps.map((s) => s.definition.id).join(",");

    // 5. Truncate history if tree changed
    if (oldIds !== newIds) {
      store.getState().truncateHistoryAt(stepId);
    }

    // 6. Navigate
    const next = getNextStep(newTree.steps, stepId);
    if (next) {
      store.getState().setCurrentStep(next.definition.id);
    } else {
      setDone(true);
    }
  }

  function handlePrev() {
    const prev = getPreviousStep(tree.steps, stepId);
    if (prev) store.getState().setCurrentStep(prev.definition.id);
  }

  function handleRestart() {
    store.getState().init(schema);
    // Re-apply mock vars after init (init clears externalVars)
    for (const [varId, value] of Object.entries(mockVars)) {
      store.getState().setExternalVar(varId, value);
    }
    setDone(false);
    setErrors({});
  }

  // Compute step index for status icons
  const currentIdx = tree.steps.findIndex(
    (s) => s.definition.id === currentStep?.definition.id
  );

  if (done) {
    return (
      <div style={styles.panel}>
        <div style={styles.leftCol}>
          <StepList
            tree={tree}
            currentIdx={currentIdx}
            onSelect={(id) => store.getState().setCurrentStep(id)}
          />
          {extVarDefs.length > 0 && (
            <MockVarPanel
              extVarDefs={extVarDefs}
              mockVars={mockVars}
              onChange={handleMockVarChange}
            />
          )}
        </div>
        <div style={styles.divider} />
        <div style={styles.rightCol}>
          <div style={styles.doneScreen}>
            <div style={styles.doneIcon}>✓</div>
            <div style={styles.doneTitle}>Parcours terminé !</div>
            <p style={styles.doneText}>
              Toutes les étapes ont été complétées avec succès.
            </p>
            <button style={styles.primaryBtn} onClick={handleRestart}>
              Recommencer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <DevPanel store={store} />

      {/* Left column — step list + mock vars */}
      <div style={styles.leftCol}>
        <StepList
          tree={tree}
          currentIdx={currentIdx}
          onSelect={(id) => store.getState().setCurrentStep(id)}
        />
        {extVarDefs.length > 0 && (
          <MockVarPanel
            extVarDefs={extVarDefs}
            mockVars={mockVars}
            onChange={handleMockVarChange}
          />
        )}
      </div>

      <div style={styles.divider} />

      {/* Right column — step renderer */}
      <div style={styles.rightCol}>
        <div style={styles.stepRenderer}>
          {/* Progress bar */}
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>

          {/* Step title */}
          <h2 style={styles.stepTitle}>
            {currentStep?.definition.title ?? ""}
          </h2>

          {/* Fields */}
          <div style={styles.fieldsContainer}>
            {fields.map((field) => (
              <FieldRenderer
                key={field.definition.id}
                field={field}
                value={stepData[field.definition.id]}
                error={errors[field.definition.id]}
                onChange={(val) => {
                  setFieldValue(field.definition.id, val);
                  if (errors[field.definition.id]) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next[field.definition.id];
                      return next;
                    });
                  }
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div style={styles.navRow}>
            {currentIdx > 0 && (
              <button style={styles.secondaryBtn} onClick={handlePrev}>
                ← Précédent
              </button>
            )}
            <button style={{ ...styles.primaryBtn, marginLeft: "auto" }} onClick={handleNext}>
              {getNextStep(tree.steps, stepId) ? "Continuer →" : "Terminer ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepList sub-component
// ---------------------------------------------------------------------------

interface StepListProps {
  tree: { steps: { definition: { id: string; title: string } }[]; hiddenSteps: { definition: { id: string; title: string } }[] };
  currentIdx: number;
  onSelect: (id: string) => void;
}

function StepList({ tree, currentIdx, onSelect }: StepListProps) {
  const allSteps = [
    ...tree.steps.map((s) => ({ ...s, hidden: false })),
    ...tree.hiddenSteps.map((s) => ({ ...s, hidden: true })),
  ];

  return (
    <div style={styles.stepList}>
      <div style={styles.stepListTitle}>Étapes</div>
      {allSteps.map((step) => {
        const isVisible = !step.hidden;
        const visIdx = tree.steps.findIndex((s) => s.definition.id === step.definition.id);
        let status: "done" | "current" | "upcoming" | "hidden" = "hidden";
        if (isVisible) {
          if (visIdx < currentIdx) status = "done";
          else if (visIdx === currentIdx) status = "current";
          else status = "upcoming";
        }

        return (
          <div
            key={step.definition.id}
            style={{
              ...styles.stepItem,
              ...(status === "current" ? styles.stepItemCurrent : {}),
              ...(status === "hidden" ? styles.stepItemHidden : {}),
              cursor: status === "done" ? "pointer" : "default",
            }}
            onClick={() => {
              if (status === "done") onSelect(step.definition.id);
            }}
          >
            <span style={styles.stepStatus}>
              {status === "done" && "✓"}
              {status === "current" && "→"}
              {status === "upcoming" && "○"}
              {status === "hidden" && "–"}
            </span>
            <span style={styles.stepName}>{step.definition.title}</span>
            {status === "hidden" && <span style={styles.hiddenBadge}>hidden</span>}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MockVarPanel sub-component
// ---------------------------------------------------------------------------

import type { ExternalVariable } from "@waypointjs/core";

interface MockVarPanelProps {
  extVarDefs: ExternalVariable[];
  mockVars: Record<string, unknown>;
  onChange: (varId: string, value: unknown) => void;
}

function MockVarPanel({ extVarDefs, mockVars, onChange }: MockVarPanelProps) {
  return (
    <div style={styles.mockPanel}>
      <div style={styles.mockPanelTitle}>
        <span>⚡ External Variables</span>
        <span style={styles.mockPanelHint}>mock values</span>
      </div>
      {extVarDefs.map((v) => (
        <div key={v.id} style={styles.mockVarRow}>
          <div style={styles.mockVarLabel}>
            <span style={styles.mockVarId}>${`ext.${v.id}`}</span>
            {v.blocking && <span style={styles.mockBlockingBadge}>!</span>}
          </div>
          {v.type === "boolean" ? (
            <label style={styles.mockCheckRow}>
              <input
                type="checkbox"
                checked={Boolean(mockVars[v.id])}
                onChange={(e) => onChange(v.id, e.target.checked)}
              />
              <span style={{ fontSize: 11, color: "var(--wp-text-muted)" }}>
                {String(mockVars[v.id])}
              </span>
            </label>
          ) : (
            <input
              style={styles.mockInput}
              type={v.type === "number" ? "number" : "text"}
              value={String(mockVars[v.id] ?? "")}
              placeholder={v.label}
              onChange={(e) =>
                onChange(v.id, v.type === "number" ? Number(e.target.value) : e.target.value)
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRenderer sub-component
// ---------------------------------------------------------------------------

interface FieldRendererProps {
  field: ResolvedField;
  value: unknown;
  error?: string;
  onChange: (val: unknown) => void;
}

function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
  const { definition } = field;
  const options: SelectOption[] = field.resolvedOptions ?? definition.options ?? [];
  const inputStyle = { ...styles.input, ...(error ? styles.inputError : {}) };

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>
        {definition.label}
        {definition.validation?.some((r) => r.type === "required") && (
          <span style={styles.required}> *</span>
        )}
      </label>

      {(definition.type === "text" ||
        definition.type === "email" ||
        definition.type === "tel" ||
        definition.type === "password" ||
        definition.type === "url" ||
        definition.type === "number" ||
        definition.type === "date") && (
        <input
          type={definition.type}
          style={inputStyle}
          value={(value as string) ?? ""}
          placeholder={definition.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {definition.type === "textarea" && (
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          value={(value as string) ?? ""}
          placeholder={definition.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {definition.type === "select" && (
        <select
          style={inputStyle}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Choisir —</option>
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {definition.type === "multiselect" && (
        <select
          style={{ ...inputStyle, minHeight: 80 }}
          multiple
          value={(value as string[]) ?? []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
            onChange(selected);
          }}
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {definition.type === "radio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {options.map((opt) => (
            <label key={String(opt.value)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input
                type="radio"
                name={definition.id}
                value={String(opt.value)}
                checked={value === String(opt.value)}
                onChange={() => onChange(String(opt.value))}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {definition.type === "checkbox" && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          {definition.placeholder ?? definition.label}
        </label>
      )}

      {error && <div style={styles.errorMsg}>{error}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  leftCol: {
    width: 220,
    flexShrink: 0,
    overflowY: "auto",
    borderRight: "1px solid var(--wp-border)",
    background: "var(--wp-panel-bg)",
  },
  divider: {
    width: 1,
    background: "var(--wp-border)",
    flexShrink: 0,
  },
  rightCol: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 24px",
  },
  stepRenderer: {
    width: "100%",
    maxWidth: 520,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  progressTrack: {
    height: 4,
    background: "var(--wp-border)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "var(--wp-primary)",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--wp-text)",
    margin: 0,
  },
  fieldsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--wp-text)",
  },
  required: {
    color: "var(--wp-danger)",
  },
  input: {
    fontSize: 13,
    padding: "8px 10px",
    border: "1px solid var(--wp-border)",
    borderRadius: "var(--wp-radius)",
    background: "var(--wp-canvas)",
    color: "var(--wp-text)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  inputError: {
    borderColor: "var(--wp-danger)",
  },
  errorMsg: {
    fontSize: 11,
    color: "var(--wp-danger)",
    marginTop: 2,
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  primaryBtn: {
    fontSize: 13,
    fontWeight: 600,
    padding: "9px 20px",
    background: "var(--wp-primary)",
    color: "var(--wp-canvas)",
    border: "none",
    borderRadius: "var(--wp-radius)",
    cursor: "pointer",
  },
  secondaryBtn: {
    fontSize: 13,
    fontWeight: 500,
    padding: "9px 16px",
    background: "transparent",
    color: "var(--wp-text-muted)",
    border: "1px solid var(--wp-border)",
    borderRadius: "var(--wp-radius)",
    cursor: "pointer",
  },
  // Step list
  stepList: {
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  stepListTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--wp-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: 8,
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px",
    borderRadius: 6,
    fontSize: 12,
    color: "var(--wp-text-muted)",
  },
  stepItemCurrent: {
    background: "var(--wp-primary-subtle, rgba(99,102,241,0.08))",
    color: "var(--wp-primary)",
    fontWeight: 600,
  },
  stepItemHidden: {
    opacity: 0.45,
  },
  stepStatus: {
    fontSize: 11,
    width: 14,
    flexShrink: 0,
    textAlign: "center" as const,
  },
  stepName: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  hiddenBadge: {
    fontSize: 9,
    fontWeight: 700,
    padding: "1px 5px",
    borderRadius: 4,
    background: "var(--wp-border)",
    color: "var(--wp-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.3px",
    flexShrink: 0,
  },
  // Mock var panel
  mockPanel: {
    borderTop: "1px solid var(--wp-border)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  mockPanelTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--wp-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: 4,
  },
  mockPanelHint: {
    fontSize: 9,
    fontWeight: 500,
    color: "var(--wp-warning)",
    textTransform: "none" as const,
    background: "var(--wp-warning-bg)",
    padding: "1px 5px",
    borderRadius: 4,
  },
  mockVarRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 3,
  },
  mockVarLabel: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  mockVarId: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: 600,
    color: "var(--wp-text-secondary)",
  },
  mockBlockingBadge: {
    fontSize: 9,
    fontWeight: 700,
    width: 13,
    height: 13,
    borderRadius: "50%",
    background: "var(--wp-danger-bg-strong)",
    color: "var(--wp-danger)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  mockInput: {
    fontSize: 11,
    padding: "4px 6px",
    border: "1px solid var(--wp-border-muted)",
    borderRadius: "var(--wp-radius)",
    background: "var(--wp-canvas)",
    color: "var(--wp-text)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  mockCheckRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  // Done screen
  doneScreen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 12,
    paddingTop: 60,
    textAlign: "center" as const,
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "var(--wp-success-subtle, rgba(34,197,94,0.1))",
    color: "var(--wp-success, #22c55e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--wp-text)",
  },
  doneText: {
    fontSize: 14,
    color: "var(--wp-text-muted)",
    margin: 0,
  },
};
