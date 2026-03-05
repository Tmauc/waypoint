"use client";

import type { WaypointSchema } from "@waypoint/core";
import { createRuntimeStore } from "@waypoint/core";
import type { RuntimeStore } from "@waypoint/core";
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
  const { loadSchema, schema } = useBuilderStore();
  const [previewMode, setPreviewMode] = useState(false);

  // Preview store — singleton, no localStorage persistence
  const previewStoreRef = useRef<RuntimeStore | null>(null);
  if (previewStoreRef.current === null) {
    previewStoreRef.current = createRuntimeStore();
  }

  useEffect(() => {
    if (defaultValue) loadSchema(defaultValue);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onChange?.(schema);
  }, [schema, onChange]);

  function handleTest() {
    previewStoreRef.current!.getState().init(schema);
    setPreviewMode(true);
  }

  const themeVars = buildThemeVars(theme);

  return (
    <div className={className} style={{ ...rootStyle, ...themeVars, ...style }}>
      <Toolbar
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
