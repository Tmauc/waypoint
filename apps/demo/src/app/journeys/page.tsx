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
    // Zustand persist wraps state in { state: {...}, version: n }
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
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 shrink-0">{completedSteps}/{totalSteps} étapes</span>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">{journey.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{journey.description}</p>
        </div>
        {isCompleted && (
          <span className="shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Terminé ✓
          </span>
        )}
        {!isCompleted && hasProgress && (
          <span className="shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            En cours
          </span>
        )}
      </div>

      {/* Steps list */}
      <ol className="flex gap-2">
        {journey.steps.map((step, i) => {
          const isDone = isCompleted || (hasProgress && i < currentStepIdx);
          const isActive = hasProgress && i === currentStepIdx && !isCompleted;
          return (
            <li key={step.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${isDone ? "bg-indigo-500 text-white" : isActive ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400" : "bg-gray-100 text-gray-400"}`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium ${isDone ? "text-indigo-600" : isActive ? "text-gray-900" : "text-gray-400"} hidden sm:block`}>
                {step.title}
              </span>
              {i < journey.steps.length - 1 && (
                <div className={`flex-1 h-px ${isDone ? "bg-indigo-300" : "bg-gray-200"}`} />
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
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        {isCompleted ? (
          <>
            <span className="text-sm text-gray-500 flex-1">Parcours terminé avec succès.</span>
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
            >
              Recommencer
            </button>
          </>
        ) : hasProgress ? (
          <>
            <Link
              href={resumeUrl}
              className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Reprendre →
            </Link>
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              Réinitialiser
            </button>
          </>
        ) : (
          <Link
            href={journey.startUrl}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors"
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
    <div className="flex flex-col items-center px-4 py-10 min-h-full">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mes parcours</h1>
          <p className="text-sm text-gray-500 mt-1">
            Démarrez ou reprenez un parcours. Chaque parcours est sauvegardé indépendamment.
          </p>
        </div>

        <div className="space-y-4">
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

        <div className="mt-8 rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500">
          <strong className="text-gray-700">Comment tester le multi-parcours ?</strong>
          <ol className="mt-2 space-y-1 list-decimal list-inside">
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
    <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400 text-sm">Chargement…</div>}>
      <JourneysContent />
    </Suspense>
  );
}
