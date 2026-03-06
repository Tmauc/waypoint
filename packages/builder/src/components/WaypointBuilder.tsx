"use client";

import type { WaypointSchema } from "@waypointjs/core";
import { createRuntimeStore } from "@waypointjs/core";
import type { RuntimeStore } from "@waypointjs/core";
import { useEffect, useRef, useState } from "react";
import { buildThemeVars, type WaypointTheme } from "../theme";
import { useBuilderStore } from "../store/builder-store";
import { ExternalVariablePanel } from "./ExternalVariablePanel";
import { FieldEditor } from "./FieldEditor";
import { FieldList } from "./FieldList";
import { PreviewPanel } from "./PreviewPanel";
import { StepEditor } from "./StepEditor";
import { StepList } from "./StepList";
import { Toolbar } from "./Toolbar";

type MobileTab = "steps" | "fields" | "config";

export interface WaypointBuilderProps {
  /** Initial schema to load into the builder */
  defaultValue?: WaypointSchema;
  /** Called whenever the schema changes */
  onChange?: (schema: WaypointSchema) => void;
  /** Called when the user clicks "Save" */
  onSave?: (schema: WaypointSchema) => void | Promise<void>;
  /** Theme override — partial or full WaypointTheme */
  theme?: WaypointTheme;
  /** CSS class applied to the root element */
  className?: string;
  /** Inline style applied to the root element */
  style?: React.CSSProperties;
}

export function WaypointBuilder({
  defaultValue,
  onChange,
  onSave,
  theme,
  className,
  style,
}: WaypointBuilderProps) {
  const { loadSchema, schema, selectedStepId, selectedFieldId } = useBuilderStore();
  const [previewMode, setPreviewMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("steps");

  // Preview store — singleton, no localStorage persistence
  const previewStoreRef = useRef<RuntimeStore | null>(null);
  if (previewStoreRef.current === null) {
    previewStoreRef.current = createRuntimeStore();
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (defaultValue) loadSchema(defaultValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onChange?.(schema);
  }, [schema, onChange]);

  // Auto-navigate on mobile: selecting a step → Fields tab
  useEffect(() => {
    if (isMobile && selectedStepId) setActiveTab("fields");
  }, [selectedStepId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate on mobile: selecting a field → Config tab
  useEffect(() => {
    if (isMobile && selectedFieldId) setActiveTab("config");
  }, [selectedFieldId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTest() {
    previewStoreRef.current!.getState().init(schema);
    setPreviewMode(true);
  }

  const themeVars = buildThemeVars(theme);

  return (
    <div className={className} style={{ ...rootStyle, ...themeVars, ...style }}>
      <Toolbar
        isMobile={isMobile}
        onSave={!previewMode && onSave ? () => onSave(schema) : undefined}
        previewMode={previewMode}
        onTest={previewMode ? () => setPreviewMode(false) : handleTest}
      />
      {previewMode ? (
        <PreviewPanel
          store={previewStoreRef.current}
          schema={schema}
          onEdit={() => setPreviewMode(false)}
        />
      ) : isMobile ? (
        <>
          {/* Steps panel */}
          <div style={{ ...colStyle, display: activeTab === "steps" ? "flex" : "none" }}>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <StepList />
            </div>
            <div style={{ borderTop: "1px solid var(--wp-border)", flexShrink: 0, overflow: "auto", maxHeight: 200 }}>
              <ExternalVariablePanel />
            </div>
          </div>

          {/* Fields panel */}
          <div style={{ ...colStyle, display: activeTab === "fields" ? "flex" : "none" }}>
            <FieldList />
          </div>

          {/* Config panel */}
          <div style={{ ...colStyle, display: activeTab === "config" ? "flex" : "none" }}>
            <div style={{ flex: 1, borderBottom: "1px solid var(--wp-border)", overflow: "hidden" }}>
              <StepEditor />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <FieldEditor />
            </div>
          </div>

          {/* Bottom tab bar */}
          <div style={tabBarStyle}>
            {(["steps", "fields", "config"] as MobileTab[]).map((tab) => (
              <button
                key={tab}
                style={{ ...tabBtnStyle, ...(activeTab === tab ? tabBtnActiveStyle : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                <span style={{ fontSize: 14 }}>
                  {tab === "steps" ? "⚡" : tab === "fields" ? "⊞" : "⚙"}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                  {tab}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={layoutStyle}>
          {/* Column 1 — Steps + External Variables */}
          <div style={colStyle}>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <StepList />
            </div>
            <div style={{ borderTop: "1px solid var(--wp-border)", flexShrink: 0, overflow: "auto", maxHeight: 280 }}>
              <ExternalVariablePanel />
            </div>
          </div>

          {/* Divider */}
          <div style={dividerStyle} />

          {/* Column 2 — Fields */}
          <div style={colStyle}>
            <FieldList />
          </div>

          {/* Divider */}
          <div style={dividerStyle} />

          {/* Column 3 — Step config + Field editor */}
          <div style={{ ...colStyle, flex: 1.2, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, borderBottom: "1px solid var(--wp-border)", overflow: "hidden" }}>
              <StepEditor />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <FieldEditor />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--wp-canvas)",
  borderRadius: 12,
  border: "1px solid var(--wp-border)",
  overflow: "hidden",
  fontFamily: "var(--wp-font)",
};

const layoutStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const colStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  minWidth: 0,
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  background: "var(--wp-border)",
  flexShrink: 0,
};

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  borderTop: "1px solid var(--wp-border)",
  background: "var(--wp-toolbar-bg)",
  flexShrink: 0,
};

const tabBtnStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  padding: "8px 4px",
  border: "none",
  background: "transparent",
  color: "var(--wp-text-subtle)",
  cursor: "pointer",
};

const tabBtnActiveStyle: React.CSSProperties = {
  color: "var(--wp-primary)",
  borderTop: "2px solid var(--wp-primary)",
};
