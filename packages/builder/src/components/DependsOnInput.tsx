"use client";

import { useEffect, useRef, useState } from "react";
import { useAllFieldPaths } from "../hooks/useAllFieldPaths";

interface DependsOnInputProps {
  value: string[];
  onChange: (paths: string[]) => void;
  excludeStepId?: string;
  excludeFieldId?: string;
}

export function DependsOnInput({
  value,
  onChange,
  excludeStepId,
  excludeFieldId,
}: DependsOnInputProps) {
  const allPaths = useAllFieldPaths(excludeStepId, excludeFieldId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const available = allPaths.filter(
    (p) => !value.includes(p.path) &&
      (p.path.toLowerCase().includes(query.toLowerCase()) ||
        p.label.toLowerCase().includes(query.toLowerCase()))
  );

  const add = (path: string) => {
    onChange([...value, path]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (path: string) => {
    onChange(value.filter((p) => p !== path));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getLabel = (path: string) =>
    allPaths.find((p) => p.path === path)?.label ?? path;

  const isExternal = (path: string) => path.startsWith("$ext.");

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Selected tags */}
      <div style={styles.tags}>
        {value.map((path) => (
          <span key={path} style={{ ...styles.tag, ...(isExternal(path) ? styles.tagExt : {}) }}>
            {getLabel(path)}
            <button style={styles.tagRemove} onClick={() => remove(path)}>✕</button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          style={styles.input}
          placeholder={value.length === 0 ? "Search fields or $ext vars…" : "Add more…"}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {available.length === 0 && (
            <div style={styles.noResults}>
              {allPaths.length === 0
                ? "No fields available in the tree yet."
                : "No matching fields."}
            </div>
          )}
          {available.map((p) => (
            <button
              key={p.path}
              style={styles.option}
              onMouseDown={(e) => { e.preventDefault(); add(p.path); }}
            >
              <span style={styles.optionLabel}>{p.label}</span>
              <span style={styles.optionPath}>{p.path}</span>
            </button>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div style={styles.hint}>
          This field will be blocked until all dependencies have a value.
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { position: "relative" },
  tags: {
    display: "flex", flexWrap: "wrap", gap: 4,
    border: "1px solid var(--wp-border-muted)", borderRadius: "var(--wp-radius)",
    padding: "4px 6px", background: "var(--wp-canvas)", minHeight: 34, alignItems: "center",
  },
  tag: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 600, padding: "2px 8px",
    background: "var(--wp-primary-bg)", color: "var(--wp-primary-dark)", borderRadius: 4,
  },
  tagExt: { background: "var(--wp-warning-bg)", color: "var(--wp-warning)" },
  tagRemove: {
    border: "none", background: "transparent", cursor: "pointer",
    color: "inherit", fontSize: 10, padding: 0, lineHeight: 1,
  },
  input: {
    flex: 1, minWidth: 140, fontSize: 12, border: "none",
    outline: "none", background: "transparent", padding: "2px 4px",
    color: "var(--wp-text)",
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
    background: "var(--wp-canvas)", border: "1px solid var(--wp-border)",
    borderRadius: "var(--wp-radius-lg)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    zIndex: 100, maxHeight: 200, overflowY: "auto",
  },
  noResults: { padding: "10px 12px", fontSize: 12, color: "var(--wp-text-subtle)", textAlign: "center" },
  option: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 12px", border: "none", background: "transparent",
    cursor: "pointer", textAlign: "left", gap: 8,
  },
  optionLabel: { fontSize: 13, fontWeight: 600, color: "var(--wp-text)" },
  optionPath: { fontSize: 10, fontFamily: "monospace", color: "var(--wp-text-subtle)" },
  hint: { fontSize: 10, color: "var(--wp-text-subtle)", marginTop: 4 },
};
