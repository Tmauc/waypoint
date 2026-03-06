/**
 * @waypointjs/builder — Theming
 *
 * All design tokens used by the builder UI.
 * Pass a partial `WaypointTheme` to `<WaypointBuilder theme={...} />` to override any token.
 *
 * Built-in themes: `DEFAULT_THEME` (light) and `DARK_THEME`.
 */

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

export interface WaypointTheme {
  // ── Primary accent ─────────────────────────────────────────────────────
  /** Main brand color — buttons, selected state accent. Default: #6366f1 */
  primary?: string;
  /** Darker shade of primary — hover states, dep badge text. Default: #4338ca */
  primaryDark?: string;
  /** Light primary background — dep badges, type badges. Default: #e0e7ff */
  primaryBg?: string;
  /** Very light primary — selected card background. Default: #ede9fe */
  primaryMuted?: string;
  /** Primary border — selected card outline. Default: #a78bfa */
  primaryBorder?: string;

  // ── Toolbar ────────────────────────────────────────────────────────────
  /** Toolbar background. Default: #111827 */
  toolbarBg?: string;
  /** Toolbar bottom border. Default: #1f2937 */
  toolbarBorder?: string;
  /** Toolbar logo / accent color. Default: #a78bfa */
  toolbarLogo?: string;
  /** Toolbar primary text color. Default: #f9fafb */
  toolbarText?: string;
  /** Toolbar muted text (buttons). Default: #d1d5db */
  toolbarTextMuted?: string;
  /** Toolbar subtle text (separator). Default: #4b5563 */
  toolbarTextSubtle?: string;

  // ── Canvas & surfaces ──────────────────────────────────────────────────
  /** Main background (panels, dropdowns). Default: #ffffff */
  canvas?: string;
  /** Subtle surface (card backgrounds, inputs). Default: #f9fafb */
  surface?: string;
  /** Slightly darker surface (hover, alternate rows). Default: #f3f4f6 */
  surfaceMuted?: string;
  /** Alternative surface (code blocks, preview bg). Default: #f1f5f9 */
  surfaceAlt?: string;

  // ── Borders ────────────────────────────────────────────────────────────
  /** Default border color. Default: #e5e7eb */
  border?: string;
  /** Muted border (inputs, selects). Default: #d1d5db */
  borderMuted?: string;

  // ── Text ───────────────────────────────────────────────────────────────
  /** Primary text. Default: #111827 */
  text?: string;
  /** Secondary text (labels, sub-headings). Default: #374151 */
  textSecondary?: string;
  /** Muted text (helper labels). Default: #6b7280 */
  textMuted?: string;
  /** Subtle text (metadata, hints). Default: #9ca3af */
  textSubtle?: string;
  /** Monospace / code text. Default: #475569 */
  textMono?: string;

  // ── Semantic — danger ──────────────────────────────────────────────────
  /** Danger foreground. Default: #ef4444 */
  danger?: string;
  /** Darker danger text. Default: #dc2626 */
  dangerText?: string;
  /** Danger background (very light). Default: #fef2f2 */
  dangerBg?: string;
  /** Danger background (strong). Default: #fee2e2 */
  dangerBgStrong?: string;
  /** Danger border. Default: #fecaca */
  dangerBorder?: string;

  // ── Semantic — warning ─────────────────────────────────────────────────
  /** Warning text / badge foreground. Default: #d97706 */
  warning?: string;
  /** Warning strong (dirty dot). Default: #f59e0b */
  warningStrong?: string;
  /** Warning background. Default: #fef3c7 */
  warningBg?: string;

  // ── Semantic — success ─────────────────────────────────────────────────
  /** Success text. Default: #059669 */
  success?: string;
  /** Success background. Default: #d1fae5 */
  successBg?: string;

  // ── Semantic — info ────────────────────────────────────────────────────
  /** Info icon / text. Default: #3b82f6 */
  info?: string;
  /** Info text (used-by ref chips). Default: #3b82f6 */
  infoText?: string;
  /** Info background (light). Default: #eff6ff */
  infoBg?: string;
  /** Info background (strong, ref chip bg). Default: #eff6ff */
  infoBgStrong?: string;
  /** Info border. Default: #bfdbfe */
  infoBorder?: string;

  // ── Typography & shape ─────────────────────────────────────────────────
  /** Font stack. Default: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif */
  font?: string;
  /** Base border radius. Default: 6px */
  radius?: string;
  /** Large border radius (cards, modals). Default: 8px */
  radiusLg?: string;
}

// ---------------------------------------------------------------------------
// Default (light) theme
// ---------------------------------------------------------------------------

export const DEFAULT_THEME: Required<WaypointTheme> = {
  primary: "#6366f1",
  primaryDark: "#4338ca",
  primaryBg: "#e0e7ff",
  primaryMuted: "#ede9fe",
  primaryBorder: "#a78bfa",

  toolbarBg: "#111827",
  toolbarBorder: "#1f2937",
  toolbarLogo: "#a78bfa",
  toolbarText: "#f9fafb",
  toolbarTextMuted: "#d1d5db",
  toolbarTextSubtle: "#4b5563",

  canvas: "#ffffff",
  surface: "#f9fafb",
  surfaceMuted: "#f3f4f6",
  surfaceAlt: "#f1f5f9",

  border: "#e5e7eb",
  borderMuted: "#d1d5db",

  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6b7280",
  textSubtle: "#9ca3af",
  textMono: "#475569",

  danger: "#ef4444",
  dangerText: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBgStrong: "#fee2e2",
  dangerBorder: "#fecaca",

  warning: "#d97706",
  warningStrong: "#f59e0b",
  warningBg: "#fef3c7",

  success: "#059669",
  successBg: "#d1fae5",

  info: "#3b82f6",
  infoText: "#3b82f6",
  infoBg: "#eff6ff",
  infoBgStrong: "#eff6ff",
  infoBorder: "#bfdbfe",

  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  radius: "6px",
  radiusLg: "8px",
};

// ---------------------------------------------------------------------------
// Dark theme
// ---------------------------------------------------------------------------

export const DARK_THEME: Required<WaypointTheme> = {
  primary: "#818cf8",
  primaryDark: "#6366f1",
  primaryBg: "#1e1b4b",
  primaryMuted: "#1e1b4b",
  primaryBorder: "#6366f1",

  toolbarBg: "#0a0a0a",
  toolbarBorder: "#1a1a1a",
  toolbarLogo: "#818cf8",
  toolbarText: "#f1f5f9",
  toolbarTextMuted: "#9ca3af",
  toolbarTextSubtle: "#374151",

  canvas: "#141414",
  surface: "#1e1e1e",
  surfaceMuted: "#2a2a2a",
  surfaceAlt: "#242424",

  border: "#2e2e2e",
  borderMuted: "#404040",

  text: "#f1f5f9",
  textSecondary: "#e2e8f0",
  textMuted: "#94a3b8",
  textSubtle: "#64748b",
  textMono: "#94a3b8",

  danger: "#f87171",
  dangerText: "#fca5a5",
  dangerBg: "#1c0a0a",
  dangerBgStrong: "#2d1515",
  dangerBorder: "#7f1d1d",

  warning: "#fbbf24",
  warningStrong: "#fbbf24",
  warningBg: "#1a1000",

  success: "#34d399",
  successBg: "#052e16",

  info: "#60a5fa",
  infoText: "#93c5fd",
  infoBg: "#0a1628",
  infoBgStrong: "#0f1f3d",
  infoBorder: "#1e3a5f",

  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  radius: "6px",
  radiusLg: "8px",
};

// ---------------------------------------------------------------------------
// CSS variable builder
// ---------------------------------------------------------------------------

/**
 * Converts a WaypointTheme (merged with defaults) into a React inline style object
 * containing all CSS custom properties (`--wp-*`).
 *
 * Apply this to the root element of `<WaypointBuilder />`.
 */
export function buildThemeVars(theme: WaypointTheme = {}): React.CSSProperties {
  const t: Required<WaypointTheme> = { ...DEFAULT_THEME, ...theme };

  return {
    "--wp-primary": t.primary,
    "--wp-primary-dark": t.primaryDark,
    "--wp-primary-bg": t.primaryBg,
    "--wp-primary-muted": t.primaryMuted,
    "--wp-primary-border": t.primaryBorder,

    "--wp-toolbar-bg": t.toolbarBg,
    "--wp-toolbar-border": t.toolbarBorder,
    "--wp-toolbar-logo": t.toolbarLogo,
    "--wp-toolbar-text": t.toolbarText,
    "--wp-toolbar-text-muted": t.toolbarTextMuted,
    "--wp-toolbar-text-subtle": t.toolbarTextSubtle,

    "--wp-canvas": t.canvas,
    "--wp-surface": t.surface,
    "--wp-surface-muted": t.surfaceMuted,
    "--wp-surface-alt": t.surfaceAlt,

    "--wp-border": t.border,
    "--wp-border-muted": t.borderMuted,

    "--wp-text": t.text,
    "--wp-text-secondary": t.textSecondary,
    "--wp-text-muted": t.textMuted,
    "--wp-text-subtle": t.textSubtle,
    "--wp-text-mono": t.textMono,

    "--wp-danger": t.danger,
    "--wp-danger-text": t.dangerText,
    "--wp-danger-bg": t.dangerBg,
    "--wp-danger-bg-strong": t.dangerBgStrong,
    "--wp-danger-border": t.dangerBorder,

    "--wp-warning": t.warning,
    "--wp-warning-strong": t.warningStrong,
    "--wp-warning-bg": t.warningBg,

    "--wp-success": t.success,
    "--wp-success-bg": t.successBg,

    "--wp-info": t.info,
    "--wp-info-text": t.infoText,
    "--wp-info-bg": t.infoBg,
    "--wp-info-bg-strong": t.infoBgStrong,
    "--wp-info-border": t.infoBorder,

    "--wp-font": t.font,
    "--wp-radius": t.radius,
    "--wp-radius-lg": t.radiusLg,
  } as React.CSSProperties;
}
