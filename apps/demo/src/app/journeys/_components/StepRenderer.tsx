"use client";

import Link from "next/link";
import { useWaypointStep } from "@waypointjs/next";
import type { ResolvedField } from "@waypointjs/core";

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

const inputBase: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "8px 12px",
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const inputError: React.CSSProperties = {
  ...inputBase,
  border: "1px solid rgba(239,68,68,0.5)",
  background: "rgba(239,68,68,0.06)",
};

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
  const style = error ? inputError : inputBase;

  if (type === "select") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>{label}</label>
        <select {...register(id)} style={{ ...style, colorScheme: "dark" }}>
          <option value="">— Sélectionner —</option>
          {options?.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p style={{ fontSize: 11, color: "#f87171", margin: 0 }}>{error}</p>}
      </div>
    );
  }

  if (type === "checkbox") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          id={id}
          type="checkbox"
          {...register(id)}
          style={{ width: 16, height: 16, accentColor: "#a78bfa", cursor: "pointer" }}
        />
        <label htmlFor={id} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
          {label}
        </label>
        {error && <p style={{ fontSize: 11, color: "#f87171", margin: 0, marginLeft: 8 }}>{error}</p>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>{label}</label>
        <textarea
          {...register(id)}
          placeholder={placeholder}
          rows={3}
          style={{ ...style, resize: "none" }}
        />
        {error && <p style={{ fontSize: 11, color: "#f87171", margin: 0 }}>{error}</p>}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>
        {label}
      </label>
      <input
        id={id}
        type={htmlType}
        placeholder={placeholder}
        {...register(id)}
        style={style}
      />
      {error && <p style={{ fontSize: 11, color: "#f87171", margin: 0 }}>{error}</p>}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px", minHeight: "100%" }}>
      {/* Breadcrumb */}
      <div style={{ width: "100%", maxWidth: 512, marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
        <Link href="/journeys" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
          Parcours
        </Link>
        <span>›</span>
        <Link href={journeyHref} style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
          {journeyName}
        </Link>
        <span>›</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{currentStep.definition.title}</span>
      </div>

      {/* Progress */}
      <div style={{ width: "100%", maxWidth: 512, marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
          <span>{progress}% complété</span>
          <span>{isLastStep ? "Dernière étape" : "En cours…"}</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #a78bfa, #818cf8)",
              borderRadius: 999,
              transition: "width 500ms",
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 512,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 24px" }}>
          {currentStep.definition.title}
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {!isFirstStep ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.4)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ← Retour
              </button>
            ) : (
              <Link
                href="/journeys"
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.4)",
                  textDecoration: "none",
                }}
              >
                ← Quitter
              </Link>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 22px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "rgba(167,139,250,0.2)",
                border: "1px solid rgba(167,139,250,0.35)",
                borderRadius: 8,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
              }}
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
