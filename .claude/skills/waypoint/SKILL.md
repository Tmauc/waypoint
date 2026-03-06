---
name: waypoint
description: Best practices and patterns for Waypoint — a schema-driven multi-step journey framework for React & Next.js. Use this skill when working on projects that import @waypointjs/core, @waypointjs/react, @waypointjs/next, or @waypointjs/builder packages, or when building multi-step forms, onboarding flows, conditional steps, or schema-based journeys with Waypoint.
---

# Waypoint

Waypoint is a schema-driven multi-step journey framework for React & Next.js. Define steps, fields, validation rules and conditions in a portable `WaypointSchema` JSON object. Render with `WaypointRunner` + `useWaypointStep`. Build visually with `<WaypointBuilder>`.

## Architecture Overview

Four packages, layered dependency:

```
@waypointjs/core      → Schema types, condition engine, tree resolver, Zustand runtime store, Zod generator
@waypointjs/react     → Headless hooks: useWaypoint, useWaypointStep (router-agnostic)
@waypointjs/next      → Next.js App Router: WaypointRunner provider + useWaypointStep (RHF + Zod + navigation)
@waypointjs/builder   → Embeddable no-code schema editor with live preview mode
```

## Core Workflow

### 1. Define a WaypointSchema

The schema is a plain JSON object — fully portable, version-controlled, framework-agnostic:

```typescript
import type { WaypointSchema } from "@waypointjs/core";

export const schema: WaypointSchema = {
  version: "1",
  id: "onboarding",
  name: "User Onboarding",
  persistenceMode: "zustand",          // auto-save to localStorage
  steps: [
    {
      id: "personal",
      title: "Personal info",
      url: "/onboarding/personal",
      fields: [
        {
          id: "name",
          type: "text",
          label: "Full name",
          validation: [{ type: "required", message: "Required" }],
        },
        {
          id: "role",
          type: "select",
          label: "Account type",
          options: [
            { label: "Personal", value: "personal" },
            { label: "Business", value: "business" },
          ],
          validation: [{ type: "required", message: "Required" }],
        },
      ],
    },
    {
      id: "company",
      title: "Company details",
      url: "/onboarding/company",
      // This step only appears when role === "business"
      visibleWhen: {
        combinator: "and",
        rules: [{ field: "personal.role", operator: "equals", value: "business" }],
      },
      fields: [
        {
          id: "companyName",
          type: "text",
          label: "Company name",
          validation: [{ type: "required", message: "Required" }],
        },
      ],
    },
    {
      id: "confirm",
      title: "Confirm",
      url: "/onboarding/confirm",
      fields: [],
    },
  ],
};
```

### 2. Wrap pages with WaypointRunner (Next.js)

`WaypointRunner` lives in a layout file. It creates an isolated Zustand store and exposes lifecycle callbacks:

```tsx
// app/onboarding/layout.tsx
"use client";

import { WaypointRunner } from "@waypointjs/next";
import { schema } from "@/lib/schema";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WaypointRunner
      schema={schema}
      onComplete={async (data) => {
        await fetch("/api/submit", { method: "POST", body: JSON.stringify(data) });
      }}
      onStepComplete={async (stepId, stepData) => {
        // Optional: persist per step to your backend
      }}
    >
      {children}
    </WaypointRunner>
  );
}
```

### 3. Use useWaypointStep in each page

One hook. Detects current step from URL, returns RHF-wired fields, handles validation + navigation:

```tsx
// app/onboarding/personal/page.tsx
"use client";

import { useWaypointStep } from "@waypointjs/next";

export default function PersonalPage() {
  const { fields, form, handleSubmit, goBack, progress, isFirstStep, isLastStep } =
    useWaypointStep();

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div style={{ width: `${progress}%`, height: 4, background: "blue" }} />

      {fields.map((field) => (
        <div key={field.definition.id}>
          <label>{field.definition.label}</label>
          <input
            type={field.definition.type}
            {...form.register(field.definition.id)}
          />
          {form.formState.errors[field.definition.id] && (
            <p>{String(form.formState.errors[field.definition.id]?.message)}</p>
          )}
        </div>
      ))}

      {!isFirstStep && <button type="button" onClick={goBack}>← Back</button>}
      <button type="submit">{isLastStep ? "Finish ✓" : "Continue →"}</button>
    </form>
  );
}
```

The `company` step appears and disappears automatically as `role` changes — zero routing logic needed.

---

## Key Patterns

### Conditional steps and fields

Steps and fields support the same `visibleWhen` condition system:

```typescript
// Step-level: show only when age >= 65
{
  id: "senior",
  visibleWhen: {
    combinator: "and",
    rules: [{ field: "basics.age", operator: "greaterThanOrEqual", value: 65 }],
  },
}

// Field-level: show field only when another field has a value
{
  id: "companyVat",
  visibleWhen: {
    combinator: "and",
    rules: [{ field: "company.companyName", operator: "exists" }],
  },
}

// OR condition + nested groups
{
  combinator: "or",
  rules: [
    { field: "personal.role", operator: "equals", value: "freelancer" },
    { field: "personal.role", operator: "equals", value: "agency" },
  ],
}

// External variable reference (passed via WaypointRunner externalVars prop)
{
  combinator: "and",
  rules: [{ field: "$ext.isPremium", operator: "equals", value: true }],
}
```

Supported operators: `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `contains`, `notContains`, `in`, `notIn`, `exists`, `notExists`, `matches`

### Validation rules

Rules in `field.validation[]` are automatically compiled to a Zod schema by `buildZodSchema()`:

```typescript
validation: [
  { type: "required",   message: "Required" },
  { type: "email",      message: "Invalid email" },
  { type: "minLength",  value: 8,    message: "Min 8 characters" },
  { type: "maxLength",  value: 100,  message: "Max 100 characters" },
  { type: "min",        value: 0,    message: "Must be positive" },  // for number fields
  { type: "max",        value: 120,  message: "Max 120" },
  { type: "url",        message: "Invalid URL" },
  { type: "regex",      value: "^[A-Z]", message: "Must start with uppercase" },
  { type: "custom",     customValidatorId: "myValidator", message: "Invalid" },
]
```

Register custom validators before rendering:
```typescript
import { registerCustomValidator } from "@waypointjs/core";
registerCustomValidator("myValidator", (value) => typeof value === "string" && value.length > 0);
```

### Persistence and resume

Three persistence modes declared in the schema:

```typescript
// Mode 1 — Zustand: automatic localStorage (no code needed)
persistenceMode: "zustand"

// Mode 2 — Backend per step: wire up onStepComplete
<WaypointRunner
  schema={schema}
  onStepComplete={async (stepId, data) => { await api.saveStep(stepId, data); }}
/>

// Mode 3 — Backend manual: load saved data on mount
<WaypointRunner
  schema={schema}
  fetchData={async () => {
    const saved = await api.loadJourney(schema.id);
    return saved.data; // Record<stepId, Record<fieldId, value>>
  }}
/>
```

With `persistenceMode: "zustand"`, `WaypointRunner` auto-detects saved state and resumes from the last valid step. No code needed.

### External variables

Pass dynamic values (session data, URL params, API results) into the condition engine:

```typescript
<WaypointRunner
  schema={schema}
  externalVars={{
    userId: session.user.id,
    isPremium: session.user.plan === "premium",
    country: locale.country,
  }}
/>
```

Reference them in conditions as `$ext.varId`. The tree re-resolves automatically when `externalVars` changes.

### Using the builder

Drop `<WaypointBuilder>` in any admin page to build schemas visually:

```tsx
"use client";
import { WaypointBuilder } from "@waypointjs/builder";

export default function AdminPage() {
  return (
    <div style={{ height: "100vh" }}>
      <WaypointBuilder
        defaultValue={existingSchema}  // optional
        onSave={async (schema) => {
          await fetch("/api/schemas", { method: "POST", body: JSON.stringify(schema) });
        }}
        onChange={(schema) => {
          // live updates
        }}
      />
    </div>
  );
}
```

Click **▶ Tester** in the toolbar to test conditions, validation and navigation without leaving the editor.

### Headless usage (non-Next.js routers)

With `@waypointjs/react`, manage the store and navigation yourself:

```typescript
import { createRuntimeStore } from "@waypointjs/core";
import { useWaypoint, useWaypointStep } from "@waypointjs/react";

// Create store once (e.g. in a context provider)
const store = createRuntimeStore();
store.getState().init(schema);

// In shell component
const { currentStep, tree, progress, nextStep } = useWaypoint(store);

// In step component
const { fields, stepData, setFieldValue } = useWaypointStep(store, "personal");
```

---

## Critical Rules

- **Schema is the source of truth** — steps, fields, conditions all live in the schema. Never hard-code field lists or step counts in components.
- **`visibleWhen` is evaluated by `resolveTree()` on every data change** — the list of visible steps is dynamic. Always use `tree.steps.length` for progress calculation, not `schema.steps.length`.
- **Field paths in conditions use dot notation** — `"stepId.fieldId"` for form data, `"$ext.varId"` for external variables.
- **`useWaypointStep()` from `@waypointjs/next` must be inside a `<WaypointRunner>`** — it reads from `WaypointRuntimeContext`.
- **`WaypointRunner` must be a Client Component** (`"use client"`) — place it in a layout file, not a page.
- **Each `<WaypointRunner>` instance creates its own isolated store** — multiple runners on the same page have no shared state.
- **`handleSubmit` auto-truncates stale forward history** — if visible steps changed after the user answered a field, stale future steps are pruned automatically.
- **`persistenceMode: "zustand"` key is `waypoint-runtime-{schemaId}`** — two schemas with the same `id` share the same localStorage slot. Keep IDs unique.
- **`WaypointBuilder` needs an explicit parent height** — it fills 100% of its container. Set `height: "100vh"` or a fixed pixel height.
- **Schema `version: "1"` is required** — `validateSchema()` rejects schemas without it.

---

## Detailed API References

- **Core (schema types, store, conditions, tree resolver)**: See [references/core.md](references/core.md)
- **React headless hooks (useWaypoint, useWaypointStep)**: See [references/react.md](references/react.md)
- **Next.js integration (WaypointRunner, useWaypointStep)**: See [references/next.md](references/next.md)
- **Builder (WaypointBuilder, theme, useBuilderStore)**: See [references/builder.md](references/builder.md)
