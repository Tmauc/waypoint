"use client";

import { WaypointBuilder, useBuilderStore } from "@waypoint/builder";
import { EXAMPLES } from "./examples";

function ExamplesBar() {
  const loadSchema = useBuilderStore((s) => s.loadSchema);

  return (
    <div style={styles.bar}>
      <span style={styles.barLabel}>Examples</span>
      <div style={styles.examples}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            style={{ ...styles.exBtn, borderColor: ex.color }}
            onClick={() => loadSchema(ex.schema)}
          >
            <span style={{ ...styles.exDot, background: ex.color }} />
            <div style={styles.exText}>
              <span style={styles.exLabel}>{ex.label}</span>
              <span style={styles.exDesc}>{ex.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <ExamplesBar />
      <WaypointBuilder
        style={{ flex: 1 }}
        onSave={(schema) => {
          console.log("Saved schema:", JSON.stringify(schema, null, 2));
          alert("Schema saved to console!");
        }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  barLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  examples: { display: "flex", gap: 8, flexWrap: "wrap" },
  exBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    border: "1.5px solid",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
  },
  exDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  exText: { display: "flex", flexDirection: "column" },
  exLabel: { fontSize: 12, fontWeight: 700, color: "#111827" },
  exDesc: { fontSize: 10, color: "#9ca3af" },
};
