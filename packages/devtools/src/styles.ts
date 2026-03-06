import type { CSSProperties } from "react";

export const PANEL_WIDTH = 340;
export const Z_INDEX = 999999;
export const ACCENT = "#6366f1";
export const BG = "rgba(13, 13, 18, 0.97)";
export const BORDER = "rgba(255,255,255,0.08)";
export const TEXT_DIM = "#64748b";
export const TEXT_BASE = "#cbd5e1";
export const TEXT_BRIGHT = "#f1f5f9";

export function panelContainer(isOpen: boolean, side: "left" | "right"): CSSProperties {
  return {
    position: "fixed",
    top: 0,
    [side]: 0,
    bottom: 0,
    width: `${PANEL_WIDTH}px`,
    zIndex: Z_INDEX - 1,
    background: BG,
    color: TEXT_BASE,
    fontFamily: "'ui-monospace','SFMono-Regular','Menlo',monospace",
    fontSize: "0.75rem",
    lineHeight: 1.5,
    transform: isOpen
      ? "translateX(0)"
      : `translateX(${side === "right" ? PANEL_WIDTH : -PANEL_WIDTH}px)`,
    transition: "transform 220ms ease-in-out",
    overflowY: "auto",
    boxShadow: side === "right"
      ? "-4px 0 24px rgba(0,0,0,0.6)"
      : "4px 0 24px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    borderLeft: side === "right" ? `1px solid ${BORDER}` : undefined,
    borderRight: side === "left" ? `1px solid ${BORDER}` : undefined,
  };
}

export const toggleBtn: CSSProperties = {
  position: "fixed",
  bottom: "1.25rem",
  right: "1.25rem",
  zIndex: Z_INDEX,
  background: ACCENT,
  color: "#fff",
  border: "none",
  borderRadius: "2rem",
  padding: "0.375rem 0.875rem",
  fontSize: "0.72rem",
  fontFamily: "'ui-monospace','SFMono-Regular','Menlo',monospace",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  userSelect: "none",
  display: "flex",
  alignItems: "center",
  gap: "0.375rem",
};

export const panelHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.75rem 1rem",
  borderBottom: `1px solid ${BORDER}`,
  background: "rgba(99,102,241,0.12)",
  flexShrink: 0,
};

export const sectionHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.4rem 1rem",
  background: "rgba(255,255,255,0.03)",
  cursor: "pointer",
  borderBottom: `1px solid ${BORDER}`,
  fontWeight: "bold",
  fontSize: "0.68rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: TEXT_DIM,
  userSelect: "none",
};

export const sectionBody: CSSProperties = {
  padding: "0.5rem 1rem",
  borderBottom: `1px solid ${BORDER}`,
};

export function badge(color: string): CSSProperties {
  return {
    display: "inline-block",
    background: color,
    color: "#fff",
    borderRadius: "0.25rem",
    padding: "0.05rem 0.35rem",
    fontSize: "0.62rem",
    fontWeight: "bold",
    marginLeft: "0.3rem",
    verticalAlign: "middle",
  };
}

export const progressTrack: CSSProperties = {
  height: "4px",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "2px",
  overflow: "hidden",
  margin: "0.5rem 0",
};

export function progressBar(pct: number): CSSProperties {
  return {
    height: "100%",
    width: `${pct}%`,
    background: ACCENT,
    borderRadius: "2px",
    transition: "width 300ms ease",
  };
}
