import { validateSchema } from "@waypointjs/core";
import { useBuilderStore } from "../store/builder-store";

interface ToolbarProps {
  onSave?: (schema: ReturnType<typeof useBuilderStore.getState>["schema"]) => void | Promise<void>;
  previewMode?: boolean;
  onTest?: () => void;
  isMobile?: boolean;
}

export function Toolbar({ onSave, previewMode, onTest, isMobile }: ToolbarProps) {
  const { schema, isDirty, resetSchema } = useBuilderStore();

  const handleExport = () => {
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schema.id}.waypoint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          const result = validateSchema(parsed);
          if (!result.valid) {
            alert(`Invalid schema:\n\n${result.errors.map((e) => `• ${e}`).join("\n")}`);
            return;
          }
          useBuilderStore.getState().loadSchema(parsed);
        } catch {
          alert("Invalid JSON file — could not parse");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (previewMode) {
    return (
      <div style={styles.toolbar}>
        <div style={styles.left}>
          <span style={styles.logo}>◈ waypoint</span>
          <span style={styles.separator}>/</span>
          <button
            style={{ ...styles.btn, ...styles.editBtn }}
            onClick={onTest}
          >
            ← Éditer
          </button>
        </div>
        <div style={styles.right}>
          <span style={{ fontSize: 12, color: "var(--wp-text-muted)", fontStyle: "italic" }}>
            Mode aperçu
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.toolbar}>
      <div style={styles.left}>
        {!isMobile && <span style={styles.logo}>◈ waypoint</span>}
        {!isMobile && <span style={styles.separator}>/</span>}
        <input
          style={{
            ...styles.journeyName,
            ...(isMobile ? { maxWidth: 120, fontSize: 12 } : {}),
          }}
          value={schema.name}
          placeholder="Journey name"
          onChange={(e) =>
            useBuilderStore.setState((s) => ({
              schema: { ...s.schema, name: e.target.value },
              isDirty: true,
            }))
          }
        />
        {isDirty && <span style={styles.dirtyDot} title="Unsaved changes" />}
      </div>

      <div style={styles.right}>
        {onTest && (
          <button style={{ ...styles.btn, ...styles.testBtn }} onClick={onTest} title="Tester">
            {isMobile ? "▶" : "▶ Tester"}
          </button>
        )}
        <button style={styles.btn} onClick={handleImport} title="Import">
          {isMobile ? "↓" : "Import"}
        </button>
        <button style={styles.btn} onClick={handleExport} title="Export JSON">
          {isMobile ? "↑" : "Export JSON"}
        </button>
        {onSave && (
          <button
            style={{ ...styles.btn, ...styles.saveBtn }}
            onClick={() => onSave(schema)}
            title="Save"
          >
            {isMobile ? "✓" : "Save"}
          </button>
        )}
        <button
          style={{ ...styles.btn, color: "var(--wp-danger)" }}
          title="Reset"
          onClick={() => {
            if (confirm("Reset the journey? All changes will be lost.")) resetSchema();
          }}
        >
          {isMobile ? "⟳" : "Reset"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 16px", height: 48, background: "var(--wp-toolbar-bg)",
    borderBottom: "1px solid var(--wp-toolbar-border)", flexShrink: 0,
  },
  left: { display: "flex", alignItems: "center", gap: 8 },
  logo: { fontSize: 14, fontWeight: 800, color: "var(--wp-toolbar-logo)", letterSpacing: "-0.5px" },
  separator: { color: "var(--wp-toolbar-text-subtle)", fontSize: 16 },
  journeyName: {
    fontSize: 13, fontWeight: 600, color: "var(--wp-toolbar-text)",
    background: "transparent", border: "none", outline: "none",
    borderBottom: "1px solid transparent",
  },
  dirtyDot: {
    width: 6, height: 6, borderRadius: "50%", background: "var(--wp-warning-strong)",
    flexShrink: 0,
  },
  right: { display: "flex", alignItems: "center", gap: 8 },
  btn: {
    fontSize: 12, padding: "5px 12px", border: "1px solid var(--wp-toolbar-border)",
    background: "transparent", color: "var(--wp-toolbar-text-muted)", borderRadius: "var(--wp-radius)",
    cursor: "pointer", fontWeight: 500,
  },
  saveBtn: { background: "var(--wp-primary)", color: "var(--wp-canvas)", border: "1px solid var(--wp-primary)" },
  testBtn: { background: "var(--wp-success, #22c55e)", color: "#fff", border: "1px solid var(--wp-success, #22c55e)", fontWeight: 600 },
  editBtn: { background: "transparent", color: "var(--wp-toolbar-text)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13, padding: "5px 0" },
};
