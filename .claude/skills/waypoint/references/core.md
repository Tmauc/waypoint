# @waypointjs/core — Reference

```bash
pnpm add @waypointjs/core
```

Zero React dependency. All other packages build on top of this one.

---

## WaypointSchema

Root type. The single source of truth for a journey.

```typescript
interface WaypointSchema {
  version: "1";                          // always "1" — required
  id: string;                            // unique identifier, used as localStorage key
  name: string;                          // display name
  steps: StepDefinition[];
  externalVariables?: ExternalVariable[];
  customTypes?: CustomTypeDefinition[];
  persistenceMode?: PersistenceMode;     // "zustand" | "backend-step" | "backend-manual"
  metadata?: Record<string, unknown>;
}
```

### StepDefinition

```typescript
interface StepDefinition {
  id: string;
  title: string;
  url: string;                    // Next.js route path, e.g. "/onboarding/personal"
  fields: FieldDefinition[];
  visibleWhen?: ConditionGroup;   // omit = always visible
  enableResumeFromHere?: boolean; // mark as a valid deep-link entry point
}
```

### FieldDefinition

```typescript
interface FieldDefinition {
  id: string;
  type: FieldType;               // see Built-in types below
  label: string;
  placeholder?: string;
  defaultValue?: unknown;
  options?: SelectOption[];      // for select / multiselect / radio (hardcoded)
  externalEnumId?: string;       // reference to an ExternalEnum — options resolved at runtime
  validation?: ValidationRule[];
  visibleWhen?: ConditionGroup;  // field-level visibility
  dependsOn?: string[];          // dot-paths that must have values before this field is shown
}

interface SelectOption {
  label: string;
  value: string | number;
}
```

### Built-in field types

| Type | Renders as |
|---|---|
| `text` `email` `password` `tel` `url` `number` `date` | `<input type="…">` |
| `textarea` | `<textarea>` |
| `select` | `<select>` single |
| `multiselect` | `<select multiple>` |
| `radio` | `<input type="radio">` group |
| `checkbox` | `<input type="checkbox">` |
| `file` | `<input type="file">` |

Custom types: `type FieldType = BuiltinFieldType | (string & {})` — register custom types in `schema.customTypes`.

### ValidationRule

```typescript
interface ValidationRule {
  type: ValidationRuleType;
  value?: string | number;        // for rules that take a value
  message: string;                // shown to the user on error
  customValidatorId?: string;     // id registered via registerCustomValidator()
}

type ValidationRuleType =
  | "required"                    // non-empty
  | "min" | "max"                 // numeric bounds (inclusive)
  | "minLength" | "maxLength"     // string length bounds
  | "email" | "url"               // format checks
  | "regex"                       // value is a regex string
  // Value comparators (value = the threshold or expected value)
  | "equals" | "notEquals"
  | "greaterThan" | "greaterThanOrEqual"
  | "lessThan"    | "lessThanOrEqual"
  | "contains"    | "notContains"
  | "matches"                     // regex string
  // Enum membership (value = ExternalEnum.id)
  | "inEnum" | "notInEnum"
  | "custom";                     // requires customValidatorId + registerCustomValidator()
```

### ConditionGroup

```typescript
interface ConditionGroup {
  combinator: "and" | "or";
  rules: ConditionRule[];
  groups?: ConditionGroup[];      // nested sub-groups for AND/OR mixing
}

interface ConditionRule {
  field: string;                  // "stepId.fieldId" or "$ext.varId"
  operator: ConditionOperator;
  value?: unknown;
}

type ConditionOperator =
  | "equals" | "notEquals"
  | "greaterThan" | "greaterThanOrEqual" | "lessThan" | "lessThanOrEqual"
  | "contains" | "notContains"
  | "in" | "notIn"
  | "exists" | "notExists"
  | "matches"                     // regex string in value
  | "inEnum" | "notInEnum";       // value = ExternalEnum.id — resolved against externalEnums at runtime
```

### ExternalEnum

```typescript
interface ExternalEnum {
  id: string;
  label: string;
  values: SelectOption[];  // { label: string; value: string | number }[]
}
```

App-provided option lists. **Not stored in the schema** — only `externalEnumId` references are stored. Actual values injected at runtime via `WaypointBuilder.externalEnums` / `WaypointRunner.externalEnums`. Pass to `resolveTree` as 4th param to populate `ResolvedField.resolvedOptions` and to evaluate `inEnum`/`notInEnum` conditions.

### CustomTypeDefinition

```typescript
interface CustomTypeDefinition {
  id: string;                          // stored as field.type in the schema
  label: string;                       // shown in the builder type dropdown
  icon?: string;                       // builder display
  defaultValidation?: ValidationRule[]; // auto-applied when type is selected in builder
  metadata?: Record<string, unknown>;  // passed through to your runtime renderer
}
```

App-specific field types extending the built-in set. Pass to `WaypointBuilder.appCustomTypes` and `WaypointRunner.customFieldTypes`. The schema stores `field.type = "my-custom-id"`. At runtime check `field.definition.type` to delegate rendering.

### ExternalVariable

```typescript
interface ExternalVariable {
  id: string;
  label: string;
  type: "string" | "number" | "boolean" | "object";
  blocking: boolean;              // if true and missing, runner blocks rendering with error
  usedIn?: Array<{ stepId: string; fieldId?: string }>;
}
```

---

## Runtime Store

### createRuntimeStore()

Creates a vanilla Zustand store for a single journey instance. No React dependency.

```typescript
import { createRuntimeStore } from "@waypointjs/core";

// Without persistence
const store = createRuntimeStore();

// With localStorage persistence
const store = createRuntimeStore({
  persistenceMode: "zustand",
  schemaId: "onboarding",          // localStorage key: waypoint-runtime-onboarding
});
```

### Store state shape

```typescript
interface WaypointRuntimeState {
  schema: WaypointSchema | null;
  data: Record<string, Record<string, unknown>>;  // { stepId: { fieldId: value } }
  externalVars: Record<string, unknown>;
  currentStepId: string | null;
  history: string[];               // visited step IDs in order
  isSubmitting: boolean;
  completed: boolean;
}
```

### Store actions

```typescript
// Fresh start — reset everything, navigate to first step (or startStepId)
store.getState().init(schema, {
  data?: Record<string, Record<string, unknown>>,
  externalVars?: Record<string, unknown>,
  startStepId?: string,
});

// Resume — update schema/externalVars, keep data + history + currentStepId
store.getState().resume(schema, externalVars?);

store.getState().setFieldValue(stepId, fieldId, value);
store.getState().setStepData(stepId, data);
store.getState().setExternalVar(varId, value);
store.getState().setCurrentStep(stepId);
store.getState().truncateHistoryAt(stepId);  // remove all history entries after stepId
store.getState().setIsSubmitting(boolean);
store.getState().setCompleted(boolean);
store.getState().reset();                    // clear all state
```

### hasPersistedState()

```typescript
import { hasPersistedState } from "@waypointjs/core";

// Returns true if localStorage has non-expired state for this schemaId
hasPersistedState(store, schemaId); // boolean
```

Used by `WaypointRunner` to decide `resume()` vs `init()`.

---

## Tree Resolver

### ExternalEnum

```typescript
interface ExternalEnum {
  id: string;
  label: string;
  values: SelectOption[];
}
```

App-provided option lists. Fields reference them via `externalEnumId`. Actual values injected at runtime (not stored in schema). Pass to `resolveTree` as 4th parameter or to `WaypointBuilder`/`WaypointRunner` as `externalEnums` prop.

### resolveTree()

Pure function. Evaluates all `visibleWhen` conditions and returns the visible tree.

```typescript
import { resolveTree } from "@waypointjs/core";

const tree = resolveTree(schema, data, externalVars);
// or with external enum resolution:
const tree = resolveTree(schema, data, externalVars, externalEnums);
// Returns ResolvedTree
```

```typescript
interface ResolvedTree {
  steps: ResolvedStep[];             // visible steps, in order
  hiddenSteps: ResolvedStep[];       // steps with visibleWhen = false
  missingExternalVars: string[];     // blocking external variables without values
}

interface ResolvedStep {
  definition: StepDefinition;
  visible: boolean;
  fields: ResolvedField[];           // ALL fields, including hidden ones
}

interface ResolvedField {
  definition: FieldDefinition;
  visible: boolean;                  // after field-level visibleWhen
  dependenciesMet: boolean;          // all dependsOn paths have values
  resolvedOptions?: SelectOption[];  // populated when field.externalEnumId matches a provided enum
}
```

**Key rule**: Use `tree.steps` (resolved) for navigation and progress — never `schema.steps` (raw).

### Navigation helpers

```typescript
import { getNextStep, getPreviousStep, calculateProgress, findLastValidStep } from "@waypointjs/core";

getNextStep(tree.steps, currentStepId)          // ResolvedStep | undefined
getPreviousStep(tree.steps, currentStepId)       // ResolvedStep | undefined
calculateProgress(tree.steps, currentStepId)    // number 0–100
findLastValidStep(tree.steps, data, externalVars) // deepest accessible step
```

### Computed state helpers (use with raw state)

```typescript
import {
  getResolvedTree,
  getCurrentStep,
  getNextStepFromState,
  getPreviousStepFromState,
  calculateProgressFromState,
  getMissingBlockingVars,
} from "@waypointjs/core";

const state = store.getState();
getResolvedTree(state)           // ResolvedTree
getCurrentStep(state)            // ResolvedStep | undefined
calculateProgressFromState(state) // number
getMissingBlockingVars(state)    // string[]
```

---

## Zod Generator

### buildZodSchema()

Converts `ResolvedField[]` into a Zod object schema. Used internally by `useWaypointStep()`.

```typescript
import { buildZodSchema } from "@waypointjs/core";

// Without external enums
const zodSchema = buildZodSchema(fields);
// With external enums (required for inEnum / notInEnum rules to resolve)
const zodSchema = buildZodSchema(fields, externalEnums);

const result = zodSchema.safeParse(formValues);
```

Validation rule → Zod mapping:

| Rule | Applies to | Zod |
|---|---|---|
| `required` | string/array | `.min(1, message)` |
| `minLength` | string | `.min(value, message)` |
| `maxLength` | string | `.max(value, message)` |
| `email` | string | `.email(message)` |
| `url` | string | `.url(message)` |
| `regex` / `matches` | string | `.regex(new RegExp(value), message)` |
| `min` / `greaterThanOrEqual` | number | `.gte(value, message)` |
| `max` / `lessThanOrEqual` | number | `.lte(value, message)` |
| `greaterThan` | number | `.gt(value, message)` |
| `lessThan` | number | `.lt(value, message)` |
| `equals` `notEquals` `contains` `notContains` `inEnum` `notInEnum` | any | `.refine(fn, message)` |
| `custom` | any | `.refine(fn, message)` via registered validator |

### registerCustomValidator()

```typescript
import { registerCustomValidator } from "@waypointjs/core";

registerCustomValidator("sirenFormat", (value) => {
  return typeof value === "string" && /^\d{9}$/.test(value);
});

// Use in schema:
// { type: "custom", customValidatorId: "sirenFormat", message: "Invalid SIREN" }
```

---

## Condition Functions (low-level)

```typescript
import { evaluateConditionGroup, isVisible, resolveFieldValue } from "@waypointjs/core";

// Pass externalEnums to support inEnum / notInEnum operators
evaluateConditionGroup(group, data, externalVars, externalEnums?)  // boolean

// Shorthand — undefined group always returns true (always visible)
isVisible(group, data, externalVars, externalEnums?)               // boolean

// Resolve a dot-path to its value
resolveFieldValue("personal.email", data, externalVars)  // unknown
resolveFieldValue("$ext.isPremium", data, externalVars)  // unknown
```

---

## Schema Validation

```typescript
import { validateSchema, assertSchema } from "@waypointjs/core";

// Returns result object
const result = validateSchema(parsed);
// { valid: boolean, errors?: string[] }

// Throws on invalid
assertSchema(parsed);
```

Use before passing user-imported JSON to `WaypointBuilder.defaultValue` or `WaypointRunner.schema`.
