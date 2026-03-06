"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface JourneyState {
  currentStepId: string | null;
  history: string[];
  data: Record<string, Record<string, unknown>>;
  schemaId: string | null;
  completed: boolean;
}

interface JourneyCard {
  id: string;
  name: string;
  description: string;
  steps: { id: string; title: string; url: string }[];
  startUrl: string;
  storageKey: string;
}

const JOURNEYS: JourneyCard[] = [
  {
    id: "project-creation",
    name: "Création de projet",
    description: "Configurez un nouveau projet en renseignant les informations de base, l'équipe et le budget.",
    steps: [
      { id: "informations", title: "Informations", url: "/journeys/project/informations" },
      { id: "equipe", title: "Équipe", url: "/journeys/project/equipe" },
      { id: "budget", title: "Budget", url: "/journeys/project/budget" },
      { id: "lancement", title: "Lancement", url: "/journeys/project/lancement" },
    ],
    startUrl: "/journeys/project/informations",
    storageKey: "waypoint-runtime-project-creation",
  },
  {
    id: "deposit",
    name: "Versement",
    description: "Effectuez un versement bancaire en saisissant les coordonnées, le montant et la date d'exécution.",
    steps: [
      { id: "compte", title: "Compte", url: "/journeys/deposit/compte" },
      { id: "versement", title: "Versement", url: "/journeys/deposit/versement" },
      { id: "confirmation", title: "Confirmation", url: "/journeys/deposit/confirmation" },
    ],
    startUrl: "/journeys/deposit/compte",
    storageKey: "waypoint-runtime-deposit",
  },
];

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
        {completedSteps}/{totalSteps} étapes
      </span>
    </div>
  );
}

function JourneyCardItem({
  journey,
  persistedState,
  onReset,
  isCompleted,
}: {
  journey: JourneyCard;
  persistedState: JourneyState | null;
  onReset: () => void;
  isCompleted: boolean;
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
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{journey.name}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{journey.description}</p>
        </div>
        {isCompleted && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 600,
              color: "#34d399",
              background: "rgba(52,211,153,0.1)",
              padding: "3px 10px",
              borderRadius: 999,
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            Terminé ✓
          </span>
        )}
        {!isCompleted && hasProgress && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 600,
              color: "#a78bfa",
              background: "rgba(167,139,250,0.1)",
              padding: "3px 10px",
              borderRadius: 999,
              border: "1px solid rgba(167,139,250,0.2)",
            }}
          >
            En cours
          </span>
        )}
      </div>

      {/* Steps list */}
      <ol style={{ display: "flex", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
        {journey.steps.map((step, i) => {
          const isDone = isCompleted || (hasProgress && i < currentStepIdx);
          const isActive = hasProgress && i === currentStepIdx && !isCompleted;
          return (
            <li key={step.id} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isDone
                    ? "rgba(167,139,250,0.2)"
                    : isActive
                    ? "rgba(167,139,250,0.12)"
                    : "rgba(255,255,255,0.05)",
                  color: isDone ? "#a78bfa" : isActive ? "#c4b5fd" : "rgba(255,255,255,0.25)",
                  border: isActive ? "1px solid rgba(167,139,250,0.4)" : "1px solid transparent",
                }}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isDone ? "#a78bfa" : isActive ? "#fff" : "rgba(255,255,255,0.25)",
                }}
              >
                {step.title}
              </span>
              {i < journey.steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: isDone ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.07)",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Progress bar */}
      {hasProgress && !isCompleted && (
        <JourneyProgressBadge completedSteps={completedCount} totalSteps={journey.steps.length} />
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {isCompleted ? (
          <>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", flex: 1 }}>Parcours terminé avec succès.</span>
            <button
              onClick={onReset}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Recommencer
            </button>
          </>
        ) : hasProgress ? (
          <>
            <Link
              href={resumeUrl}
              style={{
                padding: "7px 18px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "rgba(167,139,250,0.2)",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Reprendre →
            </Link>
            <button
              onClick={onReset}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.35)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Réinitialiser
            </button>
          </>
        ) : (
          <Link
            href={journey.startUrl}
            style={{
              padding: "7px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "rgba(167,139,250,0.2)",
              border: "1px solid rgba(167,139,250,0.3)",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Commencer →
          </Link>
        )}
      </div>
    </div>
  );
}

function JourneysContent() {
  const searchParams = useSearchParams();
  const justCompleted = searchParams.get("completed");

  const [states, setStates] = useState<Record<string, JourneyState | null>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, JourneyState | null> = {};
    const comp: Record<string, boolean> = {};
    for (const j of JOURNEYS) {
      const state = readPersistedState(j.storageKey);
      initial[j.id] = state;
      comp[j.id] = justCompleted === j.id || (state?.completed ?? false);
    }
    setStates(initial);
    setCompleted(comp);
  }, [justCompleted]);

  function handleReset(journey: JourneyCard) {
    clearPersistedState(journey.storageKey);
    setStates((prev) => ({ ...prev, [journey.id]: null }));
    setCompleted((prev) => ({ ...prev, [journey.id]: false }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px", minHeight: "100%" }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Mes parcours</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            Démarrez ou reprenez un parcours. Chaque parcours est sauvegardé indépendamment.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {JOURNEYS.map((journey) => (
            <JourneyCardItem
              key={journey.id}
              journey={journey}
              persistedState={states[journey.id] ?? null}
              onReset={() => handleReset(journey)}
              isCompleted={completed[journey.id] ?? false}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            borderRadius: 12,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: 16,
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <strong style={{ color: "rgba(255,255,255,0.55)" }}>Comment tester le multi-parcours ?</strong>
          <ol style={{ marginTop: 8, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Commencez « Création de projet » et avancez jusqu'à l'étape 2 ou 3.</li>
            <li>Revenez ici et démarrez « Versement » — terminez-le entièrement.</li>
            <li>Revenez ici et cliquez « Reprendre » sur « Création de projet » : vous retrouverez votre avancement.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function JourneysPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Chargement…</div>}>
      <JourneysContent />
    </Suspense>
  );
}
