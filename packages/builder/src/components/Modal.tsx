"use client";

import { useEffect } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 560 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.panel, width }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  panel: {
    background: "var(--wp-canvas)", borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: "1px solid var(--wp-border)",
  },
  title: { fontWeight: 700, fontSize: 14, color: "var(--wp-text)" },
  closeBtn: {
    border: "none", background: "transparent", cursor: "pointer",
    fontSize: 14, color: "var(--wp-text-subtle)", padding: 4,
  },
  body: { overflowY: "auto", padding: 20, color: "var(--wp-text)" },
};
