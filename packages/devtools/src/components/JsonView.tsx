"use client";

import { useState } from "react";

interface JsonViewProps {
  data: unknown;
  depth?: number;
}

const COLOR = {
  string: "#86efac",   // green-300
  number: "#93c5fd",   // blue-300
  boolean: "#fdba74",  // orange-300
  null: "#f87171",     // red-400
  key: "#c4b5fd",      // violet-300
  bracket: "#94a3b8",  // slate-400
  toggle: "#6366f1",   // indigo-500
};

function Primitive({ value }: { value: string | number | boolean | null }) {
  if (value === null) return <span style={{ color: COLOR.null }}>null</span>;
  if (typeof value === "boolean")
    return <span style={{ color: COLOR.boolean }}>{String(value)}</span>;
  if (typeof value === "number")
    return <span style={{ color: COLOR.number }}>{value}</span>;
  return <span style={{ color: COLOR.string }}>"{value}"</span>;
}

export function JsonView({ data, depth = 0 }: JsonViewProps) {
  const [open, setOpen] = useState(depth === 0);

  if (data === null || typeof data !== "object") {
    return <Primitive value={data as string | number | boolean | null} />;
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(data as Record<string, unknown>);

  const count = entries.length;
  const open_b = isArray ? "[" : "{";
  const close_b = isArray ? "]" : "}";

  if (count === 0) {
    return (
      <span style={{ color: COLOR.bracket }}>
        {open_b}{close_b}
      </span>
    );
  }

  return (
    <span>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          color: COLOR.toggle,
          cursor: "pointer",
          padding: 0,
          fontSize: "0.72rem",
          fontFamily: "inherit",
        }}
      >
        {open ? "▾" : "▸"}
      </button>
      <span style={{ color: COLOR.bracket }}>{open_b}</span>
      {!open && (
        <span style={{ color: COLOR.bracket, opacity: 0.6 }}>
          {count} {isArray ? "item" : "key"}{count > 1 ? "s" : ""}
        </span>
      )}
      <span style={{ color: COLOR.bracket }}>{!open ? close_b : ""}</span>

      {open && (
        <span>
          {entries.map(([k, v]) => (
            <div
              key={k}
              style={{ paddingLeft: "1rem" }}
            >
              {!isArray && (
                <span style={{ color: COLOR.key }}>"{k}"</span>
              )}
              {!isArray && <span style={{ color: COLOR.bracket }}>: </span>}
              <JsonView data={v} depth={depth + 1} />
              <span style={{ color: COLOR.bracket }}>,</span>
            </div>
          ))}
          <span style={{ color: COLOR.bracket }}>{close_b}</span>
        </span>
      )}
    </span>
  );
}
