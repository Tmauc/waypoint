"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useStore } from "zustand";
import { WaypointRuntimeContext } from "@waypointjs/next";
import {
  getResolvedTree,
  calculateProgressFromState,
  getMissingBlockingVars,
} from "@waypointjs/core";
import type { WaypointRuntimeStore } from "@waypointjs/core";

import { StepTree } from "./components/StepTree";
import { DataInspector } from "./components/DataInspector";
import { ExternalVarsView } from "./components/ExternalVarsView";
import { HistoryView } from "./components/HistoryView";
import { JsonView } from "./components/JsonView";
import {
  panelContainer,
  panelHeader,
  sectionHeader,
  sectionBody,
  toggleBtn,
  TEXT_DIM,
  TEXT_BRIGHT,
} from "./styles";

export interface DevPanelProps {
  position?: "bottom-right" | "bottom-left";
  defaultOpen?: boolean;
  /** Pass a store directly instead of reading from WaypointRuntimeContext */
  store?: import("zustand").StoreApi<WaypointRuntimeStore>;
}

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function Section({
  id,
  label,
  collapsed,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={sectionHeader} onClick={() => onToggle(id)}>
        <span>{label}</span>
        <span style={{ fontSize: "0.65rem" }}>{collapsed ? "▸" : "▾"}</span>
      </div>
      {!collapsed && <div style={sectionBody}>{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DevPanel
// ---------------------------------------------------------------------------

export function DevPanel({ position = "bottom-right", defaultOpen = false, store: storeProp }: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMounted, setIsMounted] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    nav: false,
    data: false,
    vars: true,
    history: true,
    raw: true,
  });

  // SSR safety — don't render until client-side hydration is complete
  useEffect(() => setIsMounted(true), []);

  const ctx = useContext(WaypointRuntimeContext);
  const store = storeProp ?? ctx?.store;

  const schema       = useStore(store!, (s: WaypointRuntimeStore) => s.schema);
  const data         = useStore(store!, (s: WaypointRuntimeStore) => s.data);
  const externalVars = useStore(store!, (s: WaypointRuntimeStore) => s.externalVars);
  const currentStepId = useStore(store!, (s: WaypointRuntimeStore) => s.currentStepId);
  const history      = useStore(store!, (s: WaypointRuntimeStore) => s.history);
  const isSubmitting = useStore(store!, (s: WaypointRuntimeStore) => s.isSubmitting);
  const completed    = useStore(store!, (s: WaypointRuntimeStore) => s.completed);

  const fullState   = useStore(store!, (s: WaypointRuntimeStore) => s);
  const tree        = useMemo(() => getResolvedTree(fullState), [fullState]);
  const progress    = useMemo(() => calculateProgressFromState(fullState), [fullState]);
  const missingVars = useMemo(() => getMissingBlockingVars(fullState), [fullState]);

  if (!isMounted || !store || !schema) return null;

  const side = position === "bottom-left" ? "left" : "right";

  function toggleSection(id: string) {
    setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <>
      {/* Toggle button */}
      <button
        style={{
          ...toggleBtn,
          [side]: "1.25rem",
          right: side === "right" ? "1.25rem" : undefined,
          left: side === "left" ? "1.25rem" : undefined,
        }}
        onClick={() => setIsOpen((o) => !o)}
        title="Waypoint DevTools"
      >
        ◈ waypoint
        {isSubmitting && (
          <span style={{ opacity: 0.7 }}>…</span>
        )}
        {missingVars.length > 0 && (
          <span style={{ background: "#ef4444", borderRadius: "50%", width: "0.9rem", height: "0.9rem", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>
            !
          </span>
        )}
      </button>

      {/* Panel */}
      <div style={panelContainer(isOpen, side)}>
        {/* Header */}
        <div style={panelHeader}>
          <div>
            <div style={{ color: TEXT_BRIGHT, fontWeight: "bold", fontSize: "0.8rem" }}>
              ◈ Waypoint DevTools
            </div>
            <div style={{ color: TEXT_DIM, fontSize: "0.65rem" }}>
              {completed ? "✓ completed" : isSubmitting ? "⟳ submitting…" : "running"}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Sections */}
        <Section id="nav" label="Navigation" collapsed={collapsed.nav ?? false} onToggle={toggleSection}>
          <StepTree
            schema={schema}
            tree={tree}
            currentStepId={currentStepId}
            progress={progress}
            completed={completed}
          />
        </Section>

        <Section id="data" label="Données" collapsed={collapsed.data ?? false} onToggle={toggleSection}>
          <DataInspector data={data} currentStepId={currentStepId} />
        </Section>

        <Section id="vars" label="Variables externes" collapsed={collapsed.vars ?? true} onToggle={toggleSection}>
          <ExternalVarsView
            schema={schema}
            externalVars={externalVars}
            missingVars={missingVars}
          />
        </Section>

        <Section id="history" label="Historique" collapsed={collapsed.history ?? true} onToggle={toggleSection}>
          <HistoryView history={history} currentStepId={currentStepId} />
        </Section>

        <Section id="raw" label="État brut" collapsed={collapsed.raw ?? true} onToggle={toggleSection}>
          <div style={{ fontSize: "0.68rem" }}>
            <JsonView
              data={{
                schema: schema.id,
                currentStepId,
                progress,
                completed,
                isSubmitting,
                data,
                externalVars,
                history,
              }}
              depth={0}
            />
          </div>
        </Section>
      </div>
    </>
  );
}
