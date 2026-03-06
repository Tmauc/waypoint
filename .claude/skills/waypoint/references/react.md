# @waypointjs/react — Reference

```bash
pnpm add @waypointjs/react
```

Headless hooks. Router-agnostic — you manage navigation yourself. Build on this for custom routers (React Router, TanStack Router, etc.).

Depends on `@waypointjs/core`. No Next.js dependency.

---

## useWaypoint()

Top-level hook. Subscribes to the runtime store and returns derived state + actions.

```typescript
import { useWaypoint } from "@waypointjs/react";
import type { StoreApi } from "zustand";
import type { WaypointRuntimeStore } from "@waypointjs/core";

const state = useWaypoint(store, externalEnums);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `store` | `StoreApi<WaypointRuntimeStore>` | Store instance from `createRuntimeStore()` |
| `externalEnums?` | `ExternalEnum[]` | Optional enums for `inEnum`/`notInEnum` conditions and field `resolvedOptions` |

### Return value — WaypointState

```typescript
interface WaypointState {
  // Store state
  schema: WaypointSchema | null;
  data: Record<string, Record<string, unknown>>;
  externalVars: Record<string, unknown>;
  currentStepId: string | null;
  isSubmitting: boolean;

  // Derived (memoized)
  tree: ResolvedTree;
  currentStep: ResolvedStep | undefined;
  nextStep: ResolvedStep | undefined;
  previousStep: ResolvedStep | undefined;
  progress: number;               // 0–100
  isFirstStep: boolean;
  isLastStep: boolean;
  missingExternalVars: string[];

  // Actions (proxied to store)
  setFieldValue(stepId: string, fieldId: string, value: unknown): void;
  setStepData(stepId: string, data: Record<string, unknown>): void;
  setExternalVar(varId: string, value: unknown): void;
  setCurrentStep(stepId: string): void;
  reset(): void;
}
```

### Notes

- `tree` is recomputed via `resolveTree()` on every `data` / `externalVars` change (memoized with `useMemo`).
- `currentStep`, `nextStep`, `previousStep` are derived from `tree.steps` and `currentStepId`.
- `isFirstStep` = `previousStep === undefined`, `isLastStep` = `nextStep === undefined`.
- `missingExternalVars` = blocking external variables without values (from `tree.missingExternalVars`).
- Pass `externalEnums` to enable `inEnum`/`notInEnum` visibility conditions and populate `resolvedOptions` on fields with `externalEnumId`.

### Example — shell component

```typescript
import { createRuntimeStore } from "@waypointjs/core";
import { useWaypoint } from "@waypointjs/react";

// Create store once (e.g. in a context provider or module-level)
const store = createRuntimeStore();
store.getState().init(schema);

function JourneyShell() {
  const { currentStep, tree, progress, isLastStep, setCurrentStep } = useWaypoint(store);

  return (
    <div>
      {/* Progress bar */}
      <div style={{ width: `${progress}%`, height: 4, background: "blue" }} />

      {/* Step navigation */}
      <nav>
        {tree.steps.map((step) => (
          <button
            key={step.definition.id}
            onClick={() => setCurrentStep(step.definition.id)}
            style={{ fontWeight: step.definition.id === currentStep?.definition.id ? "bold" : "normal" }}
          >
            {step.definition.title}
          </button>
        ))}
      </nav>

      {/* Current step content */}
      <h1>{currentStep?.definition.title}</h1>
    </div>
  );
}
```

---

## useWaypointStep()

Per-step hook. Returns visible fields and their data for a specific step.

```typescript
import { useWaypointStep } from "@waypointjs/react";

const stepState = useWaypointStep(store, stepId);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `store` | `StoreApi<WaypointRuntimeStore>` | Store instance |
| `stepId` | `string` | ID of the step to resolve |

### Return value — WaypointHeadlessStep

```typescript
interface WaypointHeadlessStep {
  step: ResolvedStep | undefined;     // undefined if step is hidden/not found
  fields: ResolvedField[];            // visible fields only
  stepData: Record<string, unknown>;  // current persisted data for this step
  setFieldValue(fieldId: string, value: unknown): void;
  setStepData(data: Record<string, unknown>): void;
}
```

### Notes

- `fields` contains only visible fields (after `visibleWhen` evaluation).
- `stepData` is `store.data[stepId] ?? {}` — the raw stored values.
- Call `setFieldValue` for single field updates; `setStepData` to bulk-replace step data.
- You are responsible for validation and navigation — use `buildZodSchema(fields, externalEnums?)` from `@waypointjs/core` if needed.

### Example — step component

```typescript
import { useWaypointStep } from "@waypointjs/react";
import { buildZodSchema } from "@waypointjs/core";

function PersonalStep({ store }: { store: StoreApi<WaypointRuntimeStore> }) {
  const { fields, stepData, setFieldValue } = useWaypointStep(store, "personal");

  return (
    <form>
      {fields.map((field) => (
        <div key={field.definition.id}>
          <label>{field.definition.label}</label>
          <input
            type={field.definition.type as string}
            value={(stepData[field.definition.id] as string) ?? ""}
            onChange={(e) => setFieldValue(field.definition.id, e.target.value)}
          />
        </div>
      ))}
    </form>
  );
}
```

---

## Full headless pattern

```typescript
import { createRuntimeStore } from "@waypointjs/core";
import { useWaypoint, useWaypointStep } from "@waypointjs/react";

// 1. Create store once (e.g. in a React context)
const store = createRuntimeStore();

// 2. Initialize with a schema
store.getState().init(schema, {
  externalVars: { userId: "123" },
});

// 3. Shell component — navigation + progress
function Shell() {
  const { currentStep, tree, progress, isLastStep } = useWaypoint(store);
  // Manage navigation yourself (router.push, window.location, etc.)
  // ...
}

// 4. Step component — fields + data
function StepRenderer({ stepId }: { stepId: string }) {
  const { fields, stepData, setFieldValue, setStepData } = useWaypointStep(store, stepId);
  // Render fields, handle validation, call setStepData on submit
  // ...
}
```

---

## Exports

```typescript
export { useWaypoint } from "./useWaypoint";
export type { WaypointState } from "./useWaypoint";

export { useWaypointStep } from "./useWaypointStep";
export type { WaypointHeadlessStep } from "./useWaypointStep";
```
