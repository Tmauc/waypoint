"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WaypointBuilder, useBuilderStore, DARK_THEME } from "@waypointjs/builder";
import type { CustomTypeDefinition, ExternalEnum } from "@waypointjs/core";
import { EXAMPLE_CATEGORIES, EXAMPLES } from "./examples";

// ---------------------------------------------------------------------------
// Responsive hook
// ---------------------------------------------------------------------------

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  const check = useCallback(() => setIsMobile(window.innerWidth < breakpoint), [breakpoint]);
  useEffect(() => {
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [check]);
  return isMobile;
}

// ---------------------------------------------------------------------------
// Default seed data
// ---------------------------------------------------------------------------

const DEFAULT_ENUMS: ExternalEnum[] = [
  {
    id: "countries",
    label: "Countries",
    values: [
      { label: "France", value: "fr" },
      { label: "United States", value: "us" },
      { label: "Germany", value: "de" },
      { label: "Spain", value: "es" },
    ],
  },
  {
    id: "job_roles",
    label: "Job Roles",
    values: [
      { label: "Engineer", value: "engineer" },
      { label: "Designer", value: "designer" },
      { label: "Product Manager", value: "pm" },
      { label: "Marketing", value: "marketing" },
    ],
  },
];

const DEFAULT_CUSTOM_TYPES: CustomTypeDefinition[] = [
  { id: "rich-text", label: "Rich Text", icon: "T" },
  { id: "date-range", label: "Date Range", icon: "D" },
  { id: "file-upload", label: "File Upload", icon: "F" },
];

// ---------------------------------------------------------------------------
// ExamplesSection — category select dropdowns
// ---------------------------------------------------------------------------

function ExamplesSection() {
  const loadSchema = useBuilderStore((s) => s.loadSchema);
  const isMobile = useIsMobile();

  function handleSelect(exampleId: string, selectEl: HTMLSelectElement) {
    if (!exampleId) return;
    const ex = EXAMPLES.find((e) => e.id === exampleId);
    if (ex) {
      loadSchema(ex.schema);
      selectEl.value = "";
    }
  }

  // On mobile: single dropdown with all examples grouped by category
  if (isMobile) {
    return (
      <div style={styles.bar}>
        <span style={styles.barLabel}>Examples</span>
        <select
          defaultValue=""
          onChange={(e) => handleSelect(e.target.value, e.target)}
          style={{ ...styles.selectEl, borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc", flex: 1, minWidth: 0 }}
        >
          <option value="" disabled>Load an example...</option>
          {EXAMPLE_CATEGORIES.map((cat) => (
            <optgroup key={cat.id} label={`${cat.icon} ${cat.label}`}>
              {cat.examples.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={styles.bar}>
      <span style={styles.barLabel}>Examples</span>
      <div style={styles.categorySelects}>
        {EXAMPLE_CATEGORIES.map((cat) => (
          <select
            key={cat.id}
            defaultValue=""
            onChange={(e) => handleSelect(e.target.value, e.target)}
            style={{ ...styles.selectEl, borderColor: `${cat.color}40`, color: cat.color }}
          >
            <option value="" disabled style={{ color: "rgba(255,255,255,0.5)" }}>
              {cat.icon} {cat.label}
            </option>
            {cat.examples.map((ex) => (
              <option key={ex.id} value={ex.id} style={{ color: "#fff" }}>
                {ex.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EnumEditor modal
// ---------------------------------------------------------------------------

interface EnumEditorProps {
  initial?: ExternalEnum;
  onClose: () => void;
  onSave: (e: ExternalEnum) => void;
}

function EnumEditor({ initial, onClose, onSave }: EnumEditorProps) {
  const [id, setId] = useState(initial?.id ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [valuesRaw, setValuesRaw] = useState(
    initial?.values.map((v) => `${v.value}=${v.label}`).join("\n") ?? ""
  );

  function handleSave() {
    const trimId = id.trim();
    const trimLabel = label.trim();
    if (!trimId || !trimLabel) return;
    const values = valuesRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const eq = line.indexOf("=");
        if (eq === -1) return { value: line, label: line };
        return { value: line.slice(0, eq).trim(), label: line.slice(eq + 1).trim() };
      });
    onSave({ id: trimId, label: trimLabel, values });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>{initial ? "Edit Enum" : "Add Enum"}</span>
          <button style={styles.modalClose} onClick={onClose}>x</button>
        </div>
        <div style={styles.modalBody}>
          <label style={styles.mLabel}>ID <span style={styles.mHint}>(used in externalEnumId)</span></label>
          <input style={styles.mInput} value={id} onChange={(e) => setId(e.target.value)} placeholder="countries" spellCheck={false} />

          <label style={styles.mLabel}>Label</label>
          <input style={styles.mInput} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Countries" />

          <label style={styles.mLabel}>Values <span style={styles.mHint}>(one per line: value=Label)</span></label>
          <textarea
            style={{ ...styles.mInput, minHeight: 120, resize: "vertical", fontFamily: "monospace" }}
            value={valuesRaw}
            onChange={(e) => setValuesRaw(e.target.value)}
            placeholder={"fr=France\nus=United States\nde=Germany"}
            spellCheck={false}
          />
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomTypeEditor modal
// ---------------------------------------------------------------------------

interface CustomTypeEditorProps {
  initial?: CustomTypeDefinition;
  onClose: () => void;
  onSave: (t: CustomTypeDefinition) => void;
}

function CustomTypeEditor({ initial, onClose, onSave }: CustomTypeEditorProps) {
  const [id, setId] = useState(initial?.id ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");

  function handleSave() {
    const trimId = id.trim();
    const trimLabel = label.trim();
    if (!trimId || !trimLabel) return;
    onSave({ id: trimId, label: trimLabel, icon: icon.trim() || undefined });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>{initial ? "Edit Custom Type" : "Add Custom Type"}</span>
          <button style={styles.modalClose} onClick={onClose}>x</button>
        </div>
        <div style={styles.modalBody}>
          <label style={styles.mLabel}>ID <span style={styles.mHint}>(becomes FieldType)</span></label>
          <input style={styles.mInput} value={id} onChange={(e) => setId(e.target.value)} placeholder="rich-text" spellCheck={false} />

          <label style={styles.mLabel}>Label</label>
          <input style={styles.mInput} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rich Text" />

          <label style={styles.mLabel}>Icon <span style={styles.mHint}>(emoji or text)</span></label>
          <input style={styles.mInput} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="T" />
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfigPanel
// ---------------------------------------------------------------------------

interface ConfigPanelProps {
  externalEnums: ExternalEnum[];
  appCustomTypes: CustomTypeDefinition[];
  onEnumsChange: (enums: ExternalEnum[]) => void;
  onCustomTypesChange: (types: CustomTypeDefinition[]) => void;
}

function ConfigPanel({ externalEnums, appCustomTypes, onEnumsChange, onCustomTypesChange }: ConfigPanelProps) {
  const [enumModal, setEnumModal] = useState<{ mode: "add" | "edit"; index?: number } | null>(null);
  const [typeModal, setTypeModal] = useState<{ mode: "add" | "edit"; index?: number } | null>(null);
  const isMobile = useIsMobile();

  return (
    <div style={{ ...styles.configPanel, ...(isMobile ? { flexDirection: "column", alignItems: "flex-start", columnGap: 0, rowGap: 6 } : {}) }}>
      {/* External Enums */}
      <div style={styles.configSection}>
        <span style={styles.configLabel}>External Enums</span>
        <div style={styles.configChips}>
          {externalEnums.map((en, i) => (
            <button
              key={en.id}
              style={styles.chip}
              title={`${en.values.length} values - click to edit`}
              onClick={() => setEnumModal({ mode: "edit", index: i })}
            >
              <span style={styles.chipDot} />
              <span style={styles.chipLabel}>{en.label}</span>
              <span style={styles.chipCount}>{en.values.length}</span>
              <span
                style={styles.chipRemove}
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnumsChange(externalEnums.filter((_, j) => j !== i));
                }}
              >x</span>
            </button>
          ))}
          <button style={styles.addChip} onClick={() => setEnumModal({ mode: "add" })}>
            + Add
          </button>
        </div>
      </div>

      {!isMobile && <div style={styles.configDivider} />}

      {/* Custom Types */}
      <div style={styles.configSection}>
        <span style={styles.configLabel}>Custom Types</span>
        <div style={styles.configChips}>
          {appCustomTypes.map((ct, i) => (
            <button
              key={ct.id}
              style={{ ...styles.chip, ...styles.chipType }}
              title={`id: ${ct.id} - click to edit`}
              onClick={() => setTypeModal({ mode: "edit", index: i })}
            >
              {ct.icon && <span>{ct.icon}</span>}
              <span style={styles.chipLabel}>{ct.label}</span>
              <span
                style={styles.chipRemove}
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomTypesChange(appCustomTypes.filter((_, j) => j !== i));
                }}
              >x</span>
            </button>
          ))}
          <button style={styles.addChip} onClick={() => setTypeModal({ mode: "add" })}>
            + Add
          </button>
        </div>
      </div>

      {/* Modals */}
      {enumModal && (
        <EnumEditor
          initial={enumModal.index !== undefined ? externalEnums[enumModal.index] : undefined}
          onClose={() => setEnumModal(null)}
          onSave={(e) => {
            if (enumModal.mode === "add") {
              onEnumsChange([...externalEnums, e]);
            } else if (enumModal.index !== undefined) {
              onEnumsChange(externalEnums.map((x, i) => (i === enumModal.index ? e : x)));
            }
            setEnumModal(null);
          }}
        />
      )}
      {typeModal && (
        <CustomTypeEditor
          initial={typeModal.index !== undefined ? appCustomTypes[typeModal.index] : undefined}
          onClose={() => setTypeModal(null)}
          onSave={(t) => {
            if (typeModal.mode === "add") {
              onCustomTypesChange([...appCustomTypes, t]);
            } else if (typeModal.index !== undefined) {
              onCustomTypesChange(appCustomTypes.map((x, i) => (i === typeModal.index ? t : x)));
            }
            setTypeModal(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page content (uses useSearchParams for auto-load)
// ---------------------------------------------------------------------------

function BuilderPageContent() {
  const searchParams = useSearchParams();
  const loadSchema = useBuilderStore((s) => s.loadSchema);
  const isMobile = useIsMobile();
  const [externalEnums, setExternalEnums] = useState<ExternalEnum[]>(DEFAULT_ENUMS);
  const [appCustomTypes, setAppCustomTypes] = useState<CustomTypeDefinition[]>(DEFAULT_CUSTOM_TYPES);

  useEffect(() => {
    const exId = searchParams.get("example");
    if (exId) {
      const ex = EXAMPLES.find((e) => e.id === exId);
      if (ex) loadSchema(ex.schema);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ ...styles.page, padding: isMobile ? 6 : 12 }}>
      <ExamplesSection />
      <ConfigPanel
        externalEnums={externalEnums}
        appCustomTypes={appCustomTypes}
        onEnumsChange={setExternalEnums}
        onCustomTypesChange={setAppCustomTypes}
      />
      <WaypointBuilder
        style={{ flex: 1 }}
        theme={DARK_THEME}
        externalEnums={externalEnums}
        appCustomTypes={appCustomTypes}
        onSave={(schema) => {
          console.log("Saved schema:", JSON.stringify(schema, null, 2));
          alert("Schema saved to console!");
        }}
      />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
          Loading...
        </div>
      }
    >
      <BuilderPageContent />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: 12,
    boxSizing: "border-box",
    gap: 0,
    background: "#050510",
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 4px 10px",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  barLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    flexShrink: 0,
  },
  categorySelects: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  selectEl: {
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: 8,
    border: "1px solid",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    paddingRight: 22,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.3)'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    backgroundSize: "8px 5px",
    outline: "none",
  },

  // Config panel
  configPanel: {
    display: "flex",
    alignItems: "center",
    columnGap: 0,
    rowGap: 6,
    padding: "6px 4px 10px",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  configSection: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  configLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  configChips: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
  },
  configDivider: {
    width: 1,
    height: 24,
    background: "rgba(255,255,255,0.08)",
    margin: "0 12px",
    flexShrink: 0,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid rgba(99,102,241,0.3)",
    background: "rgba(99,102,241,0.08)",
    cursor: "pointer",
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: 600,
  },
  chipType: {
    border: "1px solid rgba(34,197,94,0.3)",
    background: "rgba(34,197,94,0.07)",
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#6366f1",
    flexShrink: 0,
  },
  chipLabel: { color: "rgba(255,255,255,0.8)" },
  chipCount: {
    fontSize: 10,
    background: "rgba(99,102,241,0.25)",
    color: "#a5b4fc",
    padding: "0 4px",
    borderRadius: 3,
    fontWeight: 700,
  },
  chipRemove: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    marginLeft: 2,
    cursor: "pointer",
    lineHeight: 1,
  },
  addChip: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px dashed rgba(255,255,255,0.15)",
    background: "transparent",
    cursor: "pointer",
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: 600,
  },

  // Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#0f1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    width: "calc(100% - 24px)",
    maxWidth: 460,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    overflow: "hidden",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(255,255,255,0.9)",
  },
  modalClose: {
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.3)",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    padding: 2,
  },
  modalBody: {
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  mLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  mHint: {
    fontSize: 10,
    fontWeight: 400,
    color: "rgba(255,255,255,0.2)",
    textTransform: "none",
    letterSpacing: 0,
  },
  mInput: {
    fontSize: 13,
    padding: "7px 10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "rgba(255,255,255,0.85)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    padding: "12px 18px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },
  cancelBtn: {
    padding: "7px 16px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    fontSize: 13,
  },
  saveBtn: {
    padding: "7px 20px",
    borderRadius: 6,
    border: "none",
    background: "#6366f1",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
};
