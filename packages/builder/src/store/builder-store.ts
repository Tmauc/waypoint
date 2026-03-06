import { create } from "zustand";
import type {
  ConditionGroup,
  CustomTypeDefinition,
  ExternalVariable,
  FieldDefinition,
  PersistenceMode,
  StepDefinition,
  WaypointSchema,
} from "@waypointjs/core";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface BuilderState {
  /** The schema being edited */
  schema: WaypointSchema;
  /** Currently selected step id */
  selectedStepId: string | null;
  /** Currently selected field id (within selectedStep) */
  selectedFieldId: string | null;
  /** Whether the schema has unsaved changes */
  isDirty: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface BuilderActions {
  // Schema
  loadSchema: (schema: WaypointSchema) => void;
  resetSchema: () => void;

  // Steps
  addStep: (step?: Partial<Omit<StepDefinition, "id">>) => string;
  updateStep: (stepId: string, updates: Partial<Omit<StepDefinition, "id">>) => void;
  removeStep: (stepId: string) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;
  selectStep: (stepId: string | null) => void;

  // Fields
  addField: (stepId: string, field?: Partial<Omit<FieldDefinition, "id">>) => string;
  updateField: (stepId: string, fieldId: string, updates: Partial<Omit<FieldDefinition, "id">>) => void;
  removeField: (stepId: string, fieldId: string) => void;
  reorderFields: (stepId: string, fromIndex: number, toIndex: number) => void;
  selectField: (fieldId: string | null) => void;

  // Step conditions
  setStepCondition: (stepId: string, condition: ConditionGroup | undefined) => void;

  // Field conditions
  setFieldCondition: (stepId: string, fieldId: string, condition: ConditionGroup | undefined) => void;

  // External variables
  addExternalVariable: (variable: Omit<ExternalVariable, "usedIn">) => void;
  updateExternalVariable: (varId: string, updates: Partial<ExternalVariable>) => void;
  removeExternalVariable: (varId: string) => void;

  // Custom types
  addCustomType: (type: CustomTypeDefinition) => void;
  updateCustomType: (typeId: string, updates: Partial<CustomTypeDefinition>) => void;
  removeCustomType: (typeId: string) => void;

  // Persistence
  setPersistenceMode: (mode: PersistenceMode) => void;
}

export type BuilderStore = BuilderState & BuilderActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function makeDefaultSchema(): WaypointSchema {
  return {
    version: "1",
    id: generateId("journey"),
    name: "My Journey",
    steps: [],
    externalVariables: [],
    customTypes: [],
    persistenceMode: "zustand",
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBuilderStore = create<BuilderStore>((set, _get) => ({
  schema: makeDefaultSchema(),
  selectedStepId: null,
  selectedFieldId: null,
  isDirty: false,

  // --- Schema ---

  loadSchema: (schema) =>
    set({ schema, selectedStepId: null, selectedFieldId: null, isDirty: false }),

  resetSchema: () =>
    set({ schema: makeDefaultSchema(), selectedStepId: null, selectedFieldId: null, isDirty: false }),

  // --- Steps ---

  addStep: (partial = {}) => {
    const id = generateId("step");
    const step: StepDefinition = {
      id,
      title: partial.title ?? "New Step",
      url: partial.url ?? `/${id}`,
      fields: partial.fields ?? [],
      ...partial,
    };
    set((s) => ({
      schema: { ...s.schema, steps: [...s.schema.steps, step] },
      selectedStepId: id,
      selectedFieldId: null,
      isDirty: true,
    }));
    return id;
  },

  updateStep: (stepId, updates) =>
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        ),
      },
      isDirty: true,
    })),

  removeStep: (stepId) =>
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.filter((step) => step.id !== stepId),
      },
      selectedStepId: s.selectedStepId === stepId ? null : s.selectedStepId,
      selectedFieldId: s.selectedStepId === stepId ? null : s.selectedFieldId,
      isDirty: true,
    })),

  reorderSteps: (fromIndex, toIndex) =>
    set((s) => {
      const steps = [...s.schema.steps];
      const [moved] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, moved);
      return { schema: { ...s.schema, steps }, isDirty: true };
    }),

  selectStep: (stepId) =>
    set({ selectedStepId: stepId, selectedFieldId: null }),

  // --- Fields ---

  addField: (stepId, partial = {}) => {
    const id = generateId("field");
    const field: FieldDefinition = {
      id,
      type: partial.type ?? "text",
      label: partial.label ?? "New Field",
      ...partial,
    };
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.map((step) =>
          step.id === stepId
            ? { ...step, fields: [...step.fields, field] }
            : step
        ),
      },
      selectedFieldId: id,
      isDirty: true,
    }));
    return id;
  },

  updateField: (stepId, fieldId, updates) =>
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                fields: step.fields.map((f) =>
                  f.id === fieldId ? { ...f, ...updates } : f
                ),
              }
            : step
        ),
      },
      isDirty: true,
    })),

  removeField: (stepId, fieldId) =>
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.map((step) =>
          step.id === stepId
            ? { ...step, fields: step.fields.filter((f) => f.id !== fieldId) }
            : step
        ),
      },
      selectedFieldId: s.selectedFieldId === fieldId ? null : s.selectedFieldId,
      isDirty: true,
    })),

  reorderFields: (stepId, fromIndex, toIndex) =>
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.map((step) => {
          if (step.id !== stepId) return step;
          const fields = [...step.fields];
          const [moved] = fields.splice(fromIndex, 1);
          fields.splice(toIndex, 0, moved);
          return { ...step, fields };
        }),
      },
      isDirty: true,
    })),

  selectField: (fieldId) => set({ selectedFieldId: fieldId }),

  // --- Step conditions ---

  setStepCondition: (stepId, condition) =>
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.map((step) =>
          step.id === stepId ? { ...step, visibleWhen: condition } : step
        ),
      },
      isDirty: true,
    })),

  // --- Field conditions ---

  setFieldCondition: (stepId, fieldId, condition) =>
    set((s) => ({
      schema: {
        ...s.schema,
        steps: s.schema.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                fields: step.fields.map((f) =>
                  f.id === fieldId ? { ...f, visibleWhen: condition } : f
                ),
              }
            : step
        ),
      },
      isDirty: true,
    })),

  // --- External variables ---

  addExternalVariable: (variable) =>
    set((s) => ({
      schema: {
        ...s.schema,
        externalVariables: [
          ...(s.schema.externalVariables ?? []),
          { ...variable, usedIn: [] },
        ],
      },
      isDirty: true,
    })),

  updateExternalVariable: (varId, updates) =>
    set((s) => ({
      schema: {
        ...s.schema,
        externalVariables: (s.schema.externalVariables ?? []).map((v) =>
          v.id === varId ? { ...v, ...updates } : v
        ),
      },
      isDirty: true,
    })),

  removeExternalVariable: (varId) =>
    set((s) => ({
      schema: {
        ...s.schema,
        externalVariables: (s.schema.externalVariables ?? []).filter(
          (v) => v.id !== varId
        ),
      },
      isDirty: true,
    })),

  // --- Custom types ---

  addCustomType: (type) =>
    set((s) => ({
      schema: {
        ...s.schema,
        customTypes: [...(s.schema.customTypes ?? []), type],
      },
      isDirty: true,
    })),

  updateCustomType: (typeId, updates) =>
    set((s) => ({
      schema: {
        ...s.schema,
        customTypes: (s.schema.customTypes ?? []).map((t) =>
          t.id === typeId ? { ...t, ...updates } : t
        ),
      },
      isDirty: true,
    })),

  removeCustomType: (typeId) =>
    set((s) => ({
      schema: {
        ...s.schema,
        customTypes: (s.schema.customTypes ?? []).filter((t) => t.id !== typeId),
      },
      isDirty: true,
    })),

  // --- Persistence ---

  setPersistenceMode: (mode) =>
    set((s) => ({
      schema: { ...s.schema, persistenceMode: mode },
      isDirty: true,
    })),
}));
