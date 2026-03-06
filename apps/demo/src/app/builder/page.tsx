"use client";

import { useEffect, useState } from "react";
import { WaypointBuilder, useBuilderStore, DARK_THEME } from "@waypointjs/builder";
import { EXAMPLES } from "./examples";

function ExamplesBar() {
  const loadSchema = useBuilderStore((s) => s.loadSchema);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ ...styles.bar, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center" }}>
      <span style={styles.barLabel}>Examples</span>
      <div style={{ ...styles.examples, flexDirection: isMobile ? "column" : "row" }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            style={{ ...styles.exBtn, borderColor: `${ex.color}40` }}
            onClick={() => loadSchema(ex.schema)}
          >
            <span style={{ ...styles.exDot, background: ex.color, boxShadow: `0 0 6px ${ex.color}60` }} />
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
        padding: 12,
        boxSizing: "border-box",
        gap: 0,
        background: "#050510",
      }}
    >
      <ExamplesBar />
      <WaypointBuilder
        style={{ flex: 1 }}
        theme={DARK_THEME}
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
  examples: { display: "flex", gap: 8, flexWrap: "wrap" },
  exBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    border: "1px solid",
    borderRadius: 8,
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 150ms",
  },
  exDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  exText: { display: "flex", flexDirection: "column" },
  exLabel: { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" },
  exDesc: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
};
