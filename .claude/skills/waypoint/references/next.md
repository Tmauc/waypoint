# @waypointjs/next — Reference

```bash
pnpm add @waypointjs/next
```

Next.js App Router integration. Provides `WaypointRunner` (context provider) and `useWaypointStep` (RHF + Zod + automatic URL-based navigation).

Depends on `@waypointjs/core` and `@waypointjs/react`. Requires Next.js 13+ App Router.

---

## WaypointRunner

Client component. Create one per journey in a layout file. Each instance creates its own isolated Zustand store.

```tsx
"use client";

import { WaypointRunner } from "@waypointjs/next";
```

### Props

```typescript
interface WaypointRunnerProps {
  schema: WaypointSchema;

  /** Dynamic values injected into the condition engine as $ext.* */
  externalVars?: Record<string, unknown>;

  /** Pre-filled data for a fresh start */
  defaultValues?: Record<string, Record<string, unknown>>;

  /** Async function to load previously-saved data */
  fetchData?: () => Promise<Record<string, Record<string, unknown>>>;

  /** Called when the user completes the last step */
  onComplete?: (data: Record<string, Record<string, unknown>>) => void | Promise<void>;

  /** Called after each step is validated and submitted */
  onStepComplete?: (stepId: string, data: Record<string, unknown>) => void | Promise<void>;

  /** Called whenever any field value changes */
  onDataChange?: (data: Record<string, Record<string, unknown>>) => void;

  /**
   * App-provided custom field types.
   * Exposed via `useWaypointRuntimeContext().customFieldTypes` for the app to use when rendering custom fields.
   * Reuses `CustomTypeDefinition` from `@waypointjs/core`.
   */
  customFieldTypes?: CustomTypeDefinition[];

  /** Called when the user skips a skippable step */
  onStepSkipped?: (stepId: string) => void;

  /** App-provided external enum lists — resolved into ResolvedField.resolvedOptions by the tree resolver */
  externalEnums?: ExternalEnum[];

  children: React.ReactNode;
}
```

### Initialization behavior

On mount, `WaypointRunner` picks one of two paths:

**Resume path** (`persistenceMode: "zustand"` + persisted state detected):
- Calls `store.getState().resume(schema, externalVars)` — keeps `data`, `currentStepId`, `history`
- Navigates to the stored `currentStepId`'s URL

**Fresh-start path** (no persisted state, or other persistence modes):
- Optionally calls `fetchData()` to load backend-saved data
- Calls `store.getState().init(schema, { data, externalVars })`
- Finds the last valid step (`findLastValidStep`) and navigates there if the user has prior data

### External vars sync

When `externalVars` prop changes after mount, the store is updated automatically via `setExternalVar`. The tree re-resolves on the next render.

### Blocking external variables

If any `ExternalVariable` with `blocking: true` has no value in `externalVars`, `WaypointRunner` renders a red error box instead of `children`.

### Multi-journey support

Each `<WaypointRunner>` creates its own isolated store. Multiple runners coexist without shared state:

```tsx
<WaypointRunner schema={projectSchema}>…</WaypointRunner>
<WaypointRunner schema={depositSchema}>…</WaypointRunner>
```

### Usage example

```tsx
// app/onboarding/layout.tsx
"use client";

import { WaypointRunner } from "@waypointjs/next";
import { schema } from "@/lib/schema";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WaypointRunner
      schema={schema}
      externalVars={{ userId: session.user.id }}
      onComplete={async (data) => {
        await fetch("/api/submit", { method: "POST", body: JSON.stringify(data) });
      }}
      onStepComplete={async (stepId, stepData) => {
        await api.saveStep(stepId, stepData); // backend-step mode
      }}
    >
      {children}
    </WaypointRunner>
  );
}
```

---

## useWaypointStep()

Per-page hook. Detects the current step from the URL, wires React Hook Form to the step's Zod schema, and handles navigation.

Must be called inside a `<WaypointRunner>`.

```typescript
import { useWaypointStep } from "@waypointjs/next";

const { fields, form, handleSubmit, goBack, progress, isFirstStep, isLastStep } =
  useWaypointStep();
```

### Return value — WaypointStepReturn

```typescript
interface WaypointStepReturn {
  // Step context
  currentStep: ResolvedStep | undefined;
  progress: number;           // 0–100
  isFirstStep: boolean;
  isLastStep: boolean;

  // React Hook Form
  form: UseFormReturn<FieldValues>;
  fields: ResolvedField[];    // visible fields for the current step

  // Actions
  handleSubmit: () => Promise<void>;
  goBack: () => void;
  skipStep: () => void;         // skip current step (only if canSkip is true)

  // Skip
  canSkip: boolean;             // true if current step has skippable: true

  // State
  isSubmitting: boolean;
  errors: FieldErrors;
}
```

### handleSubmit behavior

1. Calls `form.trigger()` — validates all visible fields via Zod (uses `buildZodSchema(fields, externalEnums, data)` for cross-field validation)
2. If invalid: returns early (errors set on `form.formState.errors`)
3. Sets `isSubmitting = true`
4. Snapshots current visible step IDs
5. Calls `store.setStepData(stepId, values)` — persists form data
6. Re-resolves tree with updated data
7. If visible steps changed: calls `truncateHistoryAt(stepId)` to prune stale forward history
8. Calls `onDataChange?.(allData)`
9. Calls `onStepComplete?.(stepId, values)` (async, awaited)
10. If next step exists: `router.push(nextStep.url)`
11. If last step: sets `completed = true`, calls `onComplete?.(allData)`
12. Sets `isSubmitting = false`

### goBack behavior

Calls `router.push(previousStep.url)`. No validation or data write.

### Step detection

The hook matches `currentStep` by comparing `usePathname()` against each `step.definition.url`. Both exact match and `pathname.endsWith(stepUrl)` are supported.

### Usage example

```tsx
// app/onboarding/personal/page.tsx
"use client";

import { useWaypointStep } from "@waypointjs/next";

export default function PersonalPage() {
  const { fields, form, handleSubmit, goBack, progress, isFirstStep, isLastStep, isSubmitting } =
    useWaypointStep();

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div style={{ width: `${progress}%`, height: 4, background: "blue" }} />

      {fields.map((field) => (
        <div key={field.definition.id}>
          <label>{field.definition.label}</label>
          <input
            type={field.definition.type as string}
            {...form.register(field.definition.id)}
          />
          {form.formState.errors[field.definition.id] && (
            <p style={{ color: "red" }}>
              {String(form.formState.errors[field.definition.id]?.message)}
            </p>
          )}
        </div>
      ))}

      {!isFirstStep && (
        <button type="button" onClick={goBack}>← Back</button>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isLastStep ? "Finish ✓" : "Continue →"}
      </button>
    </form>
  );
}
```

---

## useWaypointRuntimeContext()

Low-level hook. Returns the raw context value from the nearest `WaypointRunner`.

```typescript
import { useWaypointRuntimeContext } from "@waypointjs/next";

const { schema, store, onComplete, onStepComplete, onDataChange } =
  useWaypointRuntimeContext();
```

```typescript
interface WaypointRuntimeContextValue {
  schema: WaypointSchema;
  store: StoreApi<WaypointRuntimeStore>;
  onComplete?: (data: Record<string, Record<string, unknown>>) => void | Promise<void>;
  onStepComplete?: (stepId: string, data: Record<string, unknown>) => void | Promise<void>;
  onDataChange?: (data: Record<string, Record<string, unknown>>) => void;
  onStepSkipped?: (stepId: string) => void;   // from WaypointRunner.onStepSkipped
  customFieldTypes?: CustomTypeDefinition[];  // from WaypointRunner.customFieldTypes
  externalEnums?: ExternalEnum[];             // from WaypointRunner.externalEnums
}
```

Throws if called outside a `<WaypointRunner>`.

Use `useWaypointRuntimeContext` to access the raw store when you need store actions not exposed by `useWaypointStep` (e.g. `store.getState().reset()`).

---

## Exports

```typescript
export { WaypointRunner } from "./WaypointRunner";
export type { WaypointRunnerProps } from "./WaypointRunner";

export { useWaypointStep } from "./useWaypointStep";
export type { WaypointStepReturn } from "./useWaypointStep";

export { useWaypointRuntimeContext, WaypointRuntimeContext } from "./context";
export type { WaypointRuntimeContextValue } from "./context";
```

---

## Required Next.js setup

Each step needs a corresponding page file at the URL defined in `step.url`:

```
app/
  onboarding/
    layout.tsx          ← WaypointRunner lives here
    personal/
      page.tsx          ← step url: "/onboarding/personal"
    company/
      page.tsx          ← step url: "/onboarding/company"
    confirm/
      page.tsx          ← step url: "/onboarding/confirm"
```

All pages must be Client Components (`"use client"`) since they call `useWaypointStep`.

The layout does **not** need to be a Server Component — mark it with `"use client"` too.
