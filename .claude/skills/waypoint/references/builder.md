# @waypointjs/builder — Reference

```bash
pnpm add @waypointjs/builder
```

Embeddable no-code schema editor. Drop it in any admin page to build `WaypointSchema` objects visually. Includes a live preview mode ("▶ Tester") powered by `@waypointjs/react`.

Depends on `@waypointjs/core` and `@waypointjs/react`. Works in any React environment (not Next.js specific).

---

## WaypointBuilder

The main component. Fills its parent container.

```tsx
"use client";

import { WaypointBuilder } from "@waypointjs/builder";
```

### Props

```typescript
interface WaypointBuilderProps {
  /** Initial schema to load into the builder (optional) */
  defaultValue?: WaypointSchema;

  /** Called whenever the schema changes (live updates) */
  onChange?: (schema: WaypointSchema) => void;

  /** Called when the user clicks the "Save" button */
  onSave?: (schema: WaypointSchema) => void | Promise<void>;

  /** Theme override — partial or full WaypointTheme */
  theme?: WaypointTheme;

  /** CSS class applied to the root element */
  className?: string;

  /** Inline style applied to the root element */
  style?: React.CSSProperties;

  /** Disable all editing — view-only mode (hides all add/remove/edit/reorder controls) */
  readOnly?: boolean;

  /**
   * App-provided custom field types — appear in the field type dropdown under an "Custom" optgroup.
   * When a custom type is selected, its `defaultValidation` (if any) is auto-applied to the field.
   * Reuses `CustomTypeDefinition` from `@waypointjs/core`.
   */
  appCustomTypes?: CustomTypeDefinition[];

  /**
   * App-provided external enum lists.
   * select/multiselect/radio fields can reference them by id via `field.externalEnumId`.
   * Options are resolved into `ResolvedField.resolvedOptions` at runtime.
   */
  externalEnums?: ExternalEnum[];
}
```

**Important**: `WaypointBuilder` fills 100% of its parent's height. Always set an explicit height on the parent:

```tsx
<div style={{ height: "100vh" }}>
  <WaypointBuilder ... />
</div>
```

### Basic usage

```tsx
"use client";
import { WaypointBuilder } from "@waypointjs/builder";

export default function AdminPage() {
  return (
    <div style={{ height: "100vh" }}>
      <WaypointBuilder
        defaultValue={existingSchema}
        onSave={async (schema) => {
          await fetch("/api/schemas", {
            method: "POST",
            body: JSON.stringify(schema),
          });
        }}
        onChange={(schema) => {
          console.log("Schema updated:", schema);
        }}
      />
    </div>
  );
}
```

### Layout

The builder has two modes:

**Edit mode** (default) — 3-column layout:
- Column 1: Step list + External variables panel
- Column 2: Field list for the selected step
- Column 3: Step editor (title, URL, conditions) + Field editor (type, label, validation, conditions)

### Drag & drop

Steps and fields support drag-to-reorder via @dnd-kit (`DndSortable.tsx` with `SortableList`, `SortableItem`, `DragHandle`).
- Drag handle on each card for reordering
- Touch sensor (150ms delay), pointer sensor (8px activation threshold), keyboard sensor for a11y
- Dependency constraints enforced on drop (invalid reorders are rejected)
- Fallback up/down buttons remain for non-drag interactions

**Preview mode** (after clicking "▶ Tester") — 2-column split view:
- Column left: Resolved step list with status indicators (✓ done / → current / ○ upcoming / – hidden)
- Column right: Live form renderer for the current step

### Field editor — Dynamic defaults

Fields can have conditional default values via `DynDefaultModal`. Each rule has a `when` condition group and a `value`. Rules are evaluated in order -- first matching rule wins, falling back to `field.defaultValue` if none match. Stored as `field.dynamicDefault: DynamicDefaultRule[]`.

### Field editor — Visibility conditions

Each field has a **Visibility** row in the right panel. Click "Add" or "Edit" to open the condition builder modal. The condition builder supports all `ConditionOperator` values including `inEnum`/`notInEnum`. When external enums are injected:
- A `⊞` picker button appears next to value inputs for quick enum value injection
- For `is in enum` / `not in enum` operators, the value input becomes an enum name dropdown

### Field editor — Validation

Each field has a **Validation** row in the right panel. Click "Add" or "Edit" to open the validation builder modal. The validation builder works exactly like the condition builder:
- Each row: `[ rule type ] [ value + ⊞ picker ] [ error message ] [✕]`
- Supports all `ValidationRuleType` values including `inEnum`/`notInEnum`
- For `is in enum` / `not in enum` rules, the value input becomes an enum name dropdown
- Cross-field validation: a toggle button on comparator rules switches between static value and field reference (`refField`)

### Preview mode

Click **"▶ Tester"** in the toolbar to enter preview mode. The builder:
1. Creates an in-memory runtime store (no localStorage persistence)
2. Calls `store.getState().init(schema)` with the current schema
3. Renders a functional form renderer (supports: text, email, tel, password, number, date, textarea, select, checkbox)
4. Validates all rules inline — `inEnum`/`notInEnum` resolve against the injected `externalEnums`
5. Evaluates conditions in real time — step visibility changes as you fill fields
6. Shows a "✓ Parcours terminé !" screen on the last step
7. **External variable mocks** — if the schema declares `externalVariables`, a panel appears in the left column with inputs to fill mock values (typed: text, number, checkbox for boolean). Values sync immediately to the runtime store and conditions re-evaluate in real time.

Click **"← Éditer"** in the toolbar to return to the 3-column editor.

---

## External Enums

External enums are app-provided option lists. **The values are never written to the schema** — only `externalEnumId` is stored as a reference. Inject them via the `externalEnums` prop:

```tsx
const enums: ExternalEnum[] = [
  { id: "countries", label: "Countries", values: [
    { value: "fr", label: "France" },
    { value: "de", label: "Germany" },
  ]},
];

<WaypointBuilder externalEnums={enums} appCustomTypes={types} ... />
```

**In the builder, enums appear in 3 places:**

1. **Field options source** (select/multiselect/radio) — "Options source" dropdown in the field editor. Selecting an enum sets `field.externalEnumId` and clears `field.options`. The field list shows a `⊞ label` badge.

2. **Condition builder (visibility)** — `is in enum` / `not in enum` operators: the value input becomes an enum selector. Other operators: a `⊞` button injects any enum value into the text input.

3. **Validation builder** — `is in enum` / `not in enum` rule types behave identically to the condition builder.

**At runtime** — pass the same array to `WaypointRunner.externalEnums` and `buildZodSchema(fields, externalEnums)` for conditions and Zod validation to work.

---

## Custom Types

Custom types extend the built-in field types. They appear under a **Custom** optgroup in the field type dropdown. When selected, `defaultValidation` is auto-applied.

```tsx
const types: CustomTypeDefinition[] = [
  {
    id: "rich-text",
    label: "Rich Text",
    icon: "📝",
    defaultValidation: [{ type: "required", message: "Content is required" }],
  },
];

<WaypointBuilder appCustomTypes={types} ... />
```

At runtime, the schema stores `field.type = "rich-text"`. Check `field.definition.type` in your step renderer to delegate to a custom component. Pass custom types to `WaypointRunner.customFieldTypes` to access them via `useWaypointRuntimeContext().customFieldTypes`.

---

## Theming

### WaypointTheme

All builder UI tokens are customizable. Pass a partial object — unspecified tokens use the built-in default (light) theme.

```typescript
import { WaypointBuilder } from "@waypointjs/builder";
import type { WaypointTheme } from "@waypointjs/builder";

const myTheme: WaypointTheme = {
  primary: "#0ea5e9",        // accent color for buttons and selected states
  primaryDark: "#0284c7",
  primaryBg: "#e0f2fe",
  toolbarBg: "#0f172a",      // dark toolbar
};

<WaypointBuilder theme={myTheme} ... />
```

### Token reference

```typescript
interface WaypointTheme {
  // Primary accent
  primary?: string;          // Default: #6366f1 — buttons, selected state
  primaryDark?: string;      // Default: #4338ca — hover states
  primaryBg?: string;        // Default: #e0e7ff — badges
  primaryMuted?: string;     // Default: #ede9fe — selected card bg
  primaryBorder?: string;    // Default: #a78bfa — selected card outline

  // Toolbar
  toolbarBg?: string;        // Default: #111827
  toolbarBorder?: string;    // Default: #1f2937
  toolbarLogo?: string;      // Default: #a78bfa
  toolbarText?: string;      // Default: #f9fafb
  toolbarTextMuted?: string; // Default: #d1d5db
  toolbarTextSubtle?: string;// Default: #4b5563

  // Surfaces
  canvas?: string;           // Default: #ffffff — main background
  surface?: string;          // Default: #f9fafb — card/input bg
  surfaceMuted?: string;     // Default: #f3f4f6 — hover/alternate rows
  surfaceAlt?: string;       // Default: #f1f5f9 — preview bg

  // Borders
  border?: string;           // Default: #e5e7eb
  borderMuted?: string;      // Default: #d1d5db — inputs

  // Text
  text?: string;             // Default: #111827
  textSecondary?: string;    // Default: #374151
  textMuted?: string;        // Default: #6b7280
  textSubtle?: string;       // Default: #9ca3af
  textMono?: string;         // Default: #475569 — code/mono

  // Semantic
  danger?: string;           // Default: #ef4444
  dangerText?: string;       // Default: #dc2626
  dangerBg?: string;         // Default: #fef2f2
  dangerBgStrong?: string;   // Default: #fee2e2
  dangerBorder?: string;     // Default: #fecaca

  warning?: string;          // Default: #d97706
  warningStrong?: string;    // Default: #f59e0b
  warningBg?: string;        // Default: #fef3c7

  success?: string;          // Default: #059669
  successBg?: string;        // Default: #d1fae5

  info?: string;             // Default: #3b82f6
  infoText?: string;         // Default: #3b82f6
  infoBg?: string;           // Default: #eff6ff
  infoBgStrong?: string;     // Default: #eff6ff
  infoBorder?: string;       // Default: #bfdbfe

  // Typography & shape
  font?: string;             // Default: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
  radius?: string;           // Default: 6px
  radiusLg?: string;         // Default: 8px
}
```

### Built-in themes

```typescript
import { DEFAULT_THEME, DARK_THEME } from "@waypointjs/builder";

// Use dark theme:
<WaypointBuilder theme={DARK_THEME} ... />

// Extend dark theme:
<WaypointBuilder theme={{ ...DARK_THEME, primary: "#f59e0b" }} ... />
```

---

## useBuilderStore()

Internal Zustand store exposed for advanced use cases. Use this if you need to programmatically drive the builder from outside (e.g. load a schema, add a step).

```typescript
import { useBuilderStore } from "@waypointjs/builder";
```

### State

```typescript
interface BuilderState {
  schema: WaypointSchema;      // The schema being edited
  selectedStepId: string | null;
  selectedFieldId: string | null;
  isDirty: boolean;            // Has unsaved changes
}
```

### Actions

```typescript
// Schema
loadSchema(schema: WaypointSchema): void;
resetSchema(): void;           // Resets to a blank schema

// Steps
addStep(step?: Partial<Omit<StepDefinition, "id">>): string;  // Returns new step ID
updateStep(stepId: string, updates: Partial<Omit<StepDefinition, "id">>): void;
removeStep(stepId: string): void;
duplicateStep(stepId: string): void;  // Clone with new IDs, inserts after original, remaps intra-step dependsOn
reorderSteps(fromIndex: number, toIndex: number): void;
selectStep(stepId: string | null): void;

// Fields
addField(stepId: string, field?: Partial<Omit<FieldDefinition, "id">>): string;  // Returns new field ID
updateField(stepId: string, fieldId: string, updates: Partial<Omit<FieldDefinition, "id">>): void;
removeField(stepId: string, fieldId: string): void;
duplicateField(stepId: string, fieldId: string): void;  // Clone with new ID + " (copy)" label, inserts after original
reorderFields(stepId: string, fromIndex: number, toIndex: number): void;
selectField(fieldId: string | null): void;

// Conditions
setStepCondition(stepId: string, condition: ConditionGroup | undefined): void;
setFieldCondition(stepId: string, fieldId: string, condition: ConditionGroup | undefined): void;

// External variables
addExternalVariable(variable: Omit<ExternalVariable, "usedIn">): void;
updateExternalVariable(varId: string, updates: Partial<ExternalVariable>): void;
removeExternalVariable(varId: string): void;

// Custom types
addCustomType(type: CustomTypeDefinition): void;
updateCustomType(typeId: string, updates: Partial<CustomTypeDefinition>): void;
removeCustomType(typeId: string): void;

// Persistence mode
setPersistenceMode(mode: PersistenceMode): void;
```

### Example — programmatic schema loading

```typescript
import { useBuilderStore } from "@waypointjs/builder";

function LoadButton({ schema }: { schema: WaypointSchema }) {
  const { loadSchema } = useBuilderStore();

  return (
    <button onClick={() => loadSchema(schema)}>
      Load schema
    </button>
  );
}
```

---

## buildThemeVars()

Utility used internally. Converts a `WaypointTheme` into a React `CSSProperties` object of `--wp-*` CSS variables.

```typescript
import { buildThemeVars } from "@waypointjs/builder";

const cssVars = buildThemeVars({ primary: "#0ea5e9" });
// Returns: { "--wp-primary": "#0ea5e9", "--wp-canvas": "#ffffff", ... }

// Apply to a container to scope the theme:
<div style={buildThemeVars(myTheme)}>
  {/* WaypointBuilder or any component using --wp-* variables */}
</div>
```

---

## Exports

```typescript
export { WaypointBuilder } from "./components/WaypointBuilder";
export type { WaypointBuilderProps } from "./components/WaypointBuilder";

export { useBuilderStore } from "./store/builder-store";
export type { BuilderStore, BuilderState, BuilderActions } from "./store/builder-store";

export { buildThemeVars, DEFAULT_THEME, DARK_THEME } from "./theme";
export type { WaypointTheme } from "./theme";
```
