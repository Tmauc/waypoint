"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EXAMPLE_CATEGORIES } from "../builder/examples";
import type { ExampleEntry } from "../builder/examples";

// ============================================================================
// Responsive hook
// ============================================================================

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  const check = useCallback(() => setIsMobile(window.innerWidth < breakpoint), [breakpoint]);
  useEffect(() => {
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [check]);
  return isMobile;
}

// ============================================================================
// Types
// ============================================================================

interface JourneyState {
  currentStepId: string | null;
  history: string[];
  data: Record<string, Record<string, unknown>>;
  schemaId: string | null;
  completed: boolean;
}

interface JourneyCardData {
  id: string;
  name: string;
  description: string;
  color: string;
  steps: { id: string; title: string; url: string }[];
  startUrl: string;
  storageKey: string;
}

// ============================================================================
// Dedicated live journeys (with their own routes)
// ============================================================================

const LIVE_JOURNEYS: JourneyCardData[] = [
  {
    id: "project-creation",
    name: "Project Creation",
    description: "Configure a new project: basic info, team, budget, launch.",
    color: "#a78bfa",
    steps: [
      { id: "informations", title: "Informations", url: "/journeys/project/informations" },
      { id: "equipe", title: "Team", url: "/journeys/project/equipe" },
      { id: "budget", title: "Budget", url: "/journeys/project/budget" },
      { id: "lancement", title: "Launch", url: "/journeys/project/lancement" },
    ],
    startUrl: "/journeys/project/informations",
    storageKey: "waypoint-runtime-project-creation",
  },
  {
    id: "deposit",
    name: "Bank Deposit",
    description: "Make a bank deposit: account, amount, confirmation.",
    color: "#a78bfa",
    steps: [
      { id: "compte", title: "Account", url: "/journeys/deposit/compte" },
      { id: "versement", title: "Deposit", url: "/journeys/deposit/versement" },
      { id: "confirmation", title: "Confirmation", url: "/journeys/deposit/confirmation" },
    ],
    startUrl: "/journeys/deposit/compte",
    storageKey: "waypoint-runtime-deposit",
  },
];

// ============================================================================
// Convert example schemas to journey cards (generic runner)
// ============================================================================

function exampleToCard(ex: ExampleEntry): JourneyCardData {
  return {
    id: ex.schema.id,
    name: ex.label,
    description: ex.description,
    color: ex.color,
    steps: ex.schema.steps.map((s) => ({
      id: s.id,
      title: s.title,
      url: `/journeys/run/${ex.id}/${s.id}`,
    })),
    startUrl: `/journeys/run/${ex.id}/${ex.schema.steps[0]?.id}`,
    storageKey: `waypoint-runtime-${ex.schema.id}`,
  };
}

// ============================================================================
// Persistence helpers
// ============================================================================

function readPersistedState(storageKey: string): JourneyState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

function clearPersistedState(storageKey: string) {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

// ============================================================================
// Components
// ============================================================================

function JourneyProgressBadge({ completedSteps, totalSteps }: { completedSteps: number; totalSteps: number }) {
  const pct = Math.round((completedSteps / totalSteps) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #a78bfa, #818cf8)",
            borderRadius: 999,
            transition: "width 500ms",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
        {completedSteps}/{totalSteps} steps
      </span>
    </div>
  );
}

function JourneyCardItem({
  journey,
  persistedState,
  onReset,
  isCompleted,
  compact,
}: {
  journey: JourneyCardData;
  persistedState: JourneyState | null;
  onReset: () => void;
  isCompleted: boolean;
  compact?: boolean;
}) {
  const hasProgress = persistedState?.currentStepId != null && persistedState.schemaId === journey.id;
  const currentStepIdx = hasProgress
    ? journey.steps.findIndex((s) => s.id === persistedState!.currentStepId)
    : -1;
  const completedCount = hasProgress && currentStepIdx >= 0 ? currentStepIdx : 0;
  const resumeUrl = hasProgress && currentStepIdx >= 0 ? journey.steps[currentStepIdx].url : journey.startUrl;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: compact ? 12 : 16,
        padding: compact ? 14 : 20,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 10 : 14,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: journey.color, boxShadow: `0 0 6px ${journey.color}60`, flexShrink: 0 }} />
          <h3 style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{journey.name}</h3>
        </div>
        {isCompleted && (
          <span style={styles.badgeCompleted}>Completed</span>
        )}
        {!isCompleted && hasProgress && (
          <span style={styles.badgeInProgress}>In progress</span>
        )}
      </div>

      {!compact && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>{journey.description}</p>
      )}

      {/* Steps list */}
      <div style={{ display: "flex", alignItems: "center", gap: compact ? 3 : 6, flexWrap: "wrap" }}>
        {journey.steps.map((step, i) => {
          const isDone = isCompleted || (hasProgress && i < currentStepIdx);
          const isActive = hasProgress && i === currentStepIdx && !isCompleted;
          return (
            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: compact ? 3 : 5, flex: compact ? "0 0 auto" : 1, minWidth: 0 }}>
              <div
                style={{
                  width: compact ? 20 : 22,
                  height: compact ? 20 : 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: compact ? 9 : 10,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isDone ? "rgba(167,139,250,0.2)" : isActive ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.05)",
                  color: isDone ? "#a78bfa" : isActive ? "#c4b5fd" : "rgba(255,255,255,0.25)",
                  border: isActive ? "1px solid rgba(167,139,250,0.4)" : "1px solid transparent",
                }}
                title={step.title}
              >
                {isDone ? "+" : i + 1}
              </div>
              {!compact && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: isDone ? "#a78bfa" : isActive ? "#fff" : "rgba(255,255,255,0.25)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.title}
                </span>
              )}
              {!compact && i < journey.steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    minWidth: 8,
                    background: isDone ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.07)",
                  }}
                />
              )}
            </div>
          );
        })}
        {compact && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: 2 }}>
            {journey.steps.length} steps
          </span>
        )}
      </div>

      {/* Progress bar */}
      {hasProgress && !isCompleted && (
        <JourneyProgressBadge completedSteps={completedCount} totalSteps={journey.steps.length} />
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {isCompleted ? (
          <>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", flex: 1 }}>Journey completed.</span>
            <button onClick={onReset} style={styles.secondaryBtn}>Restart</button>
          </>
        ) : hasProgress ? (
          <>
            <Link href={resumeUrl} style={styles.primaryBtn}>Resume &rarr;</Link>
            <button onClick={onReset} style={styles.ghostBtn}>Reset</button>
          </>
        ) : (
          <Link href={journey.startUrl} style={styles.primaryBtn}>Start &rarr;</Link>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================

function JourneysContent() {
  const searchParams = useSearchParams();
  const justCompleted = searchParams.get("completed");
  const isMobile = useIsMobile();

  // Collect all journey cards: live + example-based
  const allCards: { categoryLabel: string; categoryColor: string; cards: JourneyCardData[] }[] = [];

  // Live demos section
  allCards.push({ categoryLabel: "Live Demos", categoryColor: "#a78bfa", cards: LIVE_JOURNEYS });

  // Example schema categories
  for (const cat of EXAMPLE_CATEGORIES) {
    allCards.push({
      categoryLabel: cat.label,
      categoryColor: cat.color,
      cards: cat.examples.map(exampleToCard),
    });
  }

  // All journey IDs for state tracking
  const allJourneyIds = allCards.flatMap((g) => g.cards);

  const [states, setStates] = useState<Record<string, JourneyState | null>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, JourneyState | null> = {};
    const comp: Record<string, boolean> = {};
    for (const j of allJourneyIds) {
      const state = readPersistedState(j.storageKey);
      initial[j.id] = state;
      comp[j.id] = justCompleted === j.id || (state?.completed ?? false);
    }
    setStates(initial);
    setCompleted(comp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justCompleted]);

  function handleReset(journey: JourneyCardData) {
    clearPersistedState(journey.storageKey);
    setStates((prev) => ({ ...prev, [journey.id]: null }));
    setCompleted((prev) => ({ ...prev, [journey.id]: false }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: isMobile ? "24px 12px" : "40px 16px", minHeight: "100%" }}>
      <div style={{ width: "100%", maxWidth: 780 }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#fff", margin: 0 }}>Journeys</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            Start or resume any journey. Progress is saved independently per journey.
          </p>
        </div>

        {/* Category sections */}
        {allCards.map((group) => (
          <div key={group.categoryLabel} style={{ marginBottom: isMobile ? 24 : 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: group.categoryColor, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                {group.categoryLabel}
              </h2>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, border: `1px solid ${group.categoryColor}40`, color: group.categoryColor, opacity: 0.7 }}>
                {group.cards.length}
              </span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : group.cards.length === 1 ? "1fr" : "1fr 1fr",
              gap: isMobile ? 8 : 10,
            }}>
              {group.cards.map((journey) => (
                <JourneyCardItem
                  key={journey.id}
                  journey={journey}
                  persistedState={states[journey.id] ?? null}
                  onReset={() => handleReset(journey)}
                  isCompleted={completed[journey.id] ?? false}
                  compact={isMobile}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Info box */}
        <div style={styles.infoBox}>
          <strong style={{ color: "rgba(255,255,255,0.55)" }}>How to test multi-journey?</strong>
          <ol style={{ marginTop: 8, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Start any journey and advance a few steps.</li>
            <li>Come back here and start a different journey.</li>
            <li>Come back and click &ldquo;Resume&rdquo; on the first one: your progress is preserved.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function JourneysPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Loading...</div>}>
      <JourneysContent />
    </Suspense>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  badgeCompleted: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 600,
    color: "#34d399",
    background: "rgba(52,211,153,0.1)",
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(52,211,153,0.2)",
  },
  badgeInProgress: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 600,
    color: "#a78bfa",
    background: "rgba(167,139,250,0.1)",
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(167,139,250,0.2)",
  },
  primaryBtn: {
    padding: "6px 16px",
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    background: "rgba(167,139,250,0.2)",
    border: "1px solid rgba(167,139,250,0.3)",
    borderRadius: 8,
    textDecoration: "none",
  },
  secondaryBtn: {
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(255,255,255,0.5)",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(255,255,255,0.35)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  infoBox: {
    marginTop: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: 16,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
};
