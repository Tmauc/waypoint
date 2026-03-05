"use client";

import Link from "next/link";
import { useWaypointStep } from "@waypoint/next";
import type { ResolvedField } from "@waypoint/core";

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

function Field({
  field,
  register,
  error,
}: {
  field: ResolvedField;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
}) {
  const { id, type, label, placeholder, options } = field.definition;

  const base =
    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 " +
    (error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white");

  if (type === "select") {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select {...register(id)} className={base}>
          <option value="">— Sélectionner —</option>
          {options?.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  if (type === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          {...register(id)}
          className="h-4 w-4 rounded border-gray-300 accent-indigo-500"
        />
        <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer">
          {label}
        </label>
        {error && <p className="text-xs text-red-500 ml-2">{error}</p>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea
          {...register(id)}
          placeholder={placeholder}
          rows={3}
          className={base + " resize-none"}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  const htmlType =
    type === "email" ? "email"
    : type === "password" ? "password"
    : type === "number" ? "number"
    : type === "tel" ? "tel"
    : type === "date" ? "date"
    : "text";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={htmlType}
        placeholder={placeholder}
        {...register(id)}
        className={base}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepRenderer
// ---------------------------------------------------------------------------

export function StepRenderer({ journeyName, journeyHref }: { journeyName: string; journeyHref: string }) {
  const {
    currentStep,
    fields,
    form,
    handleSubmit,
    goBack,
    progress,
    isFirstStep,
    isLastStep,
    isSubmitting,
  } = useWaypointStep();

  const { register, formState: { errors } } = form;

  if (!currentStep) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-10 min-h-full">
      {/* Breadcrumb */}
      <div className="w-full max-w-lg mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/journeys" className="hover:text-indigo-600 transition-colors">
          Parcours
        </Link>
        <span>›</span>
        <Link href={journeyHref} className="hover:text-indigo-600 transition-colors">
          {journeyName}
        </Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{currentStep.definition.title}</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{progress}% complété</span>
          <span>{isLastStep ? "Dernière étape" : "En cours…"}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {currentStep.definition.title}
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-5"
        >
          {fields.map((field) => (
            <Field
              key={field.definition.id}
              field={field}
              register={register}
              error={
                errors[field.definition.id]?.message
                  ? String(errors[field.definition.id]?.message)
                  : undefined
              }
            />
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {!isFirstStep ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Retour
              </button>
            ) : (
              <Link
                href="/journeys"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Quitter
              </Link>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Enregistrement…"
                : isLastStep
                ? "Terminer ✓"
                : "Continuer →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
