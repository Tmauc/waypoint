import { beforeEach, describe, expect, it } from "vitest";
import { useBuilderStore } from "../store/builder-store";

// Reset store before each test
beforeEach(() => {
  useBuilderStore.getState().resetSchema();
});

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

describe("loadSchema", () => {
  it("loads a schema and resets selection", () => {
    const store = useBuilderStore.getState();
    store.addStep();
    store.loadSchema({
      version: "1",
      id: "loaded",
      name: "Loaded",
      steps: [{ id: "s1", title: "S1", url: "/s1", fields: [] }],
    });
    const state = useBuilderStore.getState();
    expect(state.schema.id).toBe("loaded");
    expect(state.schema.steps).toHaveLength(1);
    expect(state.selectedStepId).toBeNull();
    expect(state.isDirty).toBe(false);
  });
});

describe("resetSchema", () => {
  it("resets to a fresh schema", () => {
    const store = useBuilderStore.getState();
    store.addStep();
    store.resetSchema();
    const state = useBuilderStore.getState();
    expect(state.schema.steps).toHaveLength(0);
    expect(state.isDirty).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

describe("addStep", () => {
  it("adds a step and selects it", () => {
    const store = useBuilderStore.getState();
    const id = store.addStep({ title: "Personal" });
    const state = useBuilderStore.getState();
    expect(state.schema.steps).toHaveLength(1);
    expect(state.schema.steps[0].title).toBe("Personal");
    expect(state.selectedStepId).toBe(id);
    expect(state.isDirty).toBe(true);
  });

  it("uses defaults when no partial provided", () => {
    useBuilderStore.getState().addStep();
    const state = useBuilderStore.getState();
    expect(state.schema.steps[0].title).toBe("New Step");
    expect(state.schema.steps[0].fields).toEqual([]);
  });

  it("returns the generated step id", () => {
    const id = useBuilderStore.getState().addStep();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("updateStep", () => {
  it("updates step title", () => {
    const id = useBuilderStore.getState().addStep({ title: "Old" });
    useBuilderStore.getState().updateStep(id, { title: "New" });
    const step = useBuilderStore.getState().schema.steps.find((s) => s.id === id);
    expect(step?.title).toBe("New");
  });

  it("does not affect other steps", () => {
    const id1 = useBuilderStore.getState().addStep({ title: "A" });
    const id2 = useBuilderStore.getState().addStep({ title: "B" });
    useBuilderStore.getState().updateStep(id1, { title: "A Updated" });
    const step2 = useBuilderStore.getState().schema.steps.find((s) => s.id === id2);
    expect(step2?.title).toBe("B");
  });
});

describe("removeStep", () => {
  it("removes the step", () => {
    const id = useBuilderStore.getState().addStep();
    useBuilderStore.getState().removeStep(id);
    expect(useBuilderStore.getState().schema.steps).toHaveLength(0);
  });

  it("clears selection when selected step is removed", () => {
    const id = useBuilderStore.getState().addStep();
    expect(useBuilderStore.getState().selectedStepId).toBe(id);
    useBuilderStore.getState().removeStep(id);
    expect(useBuilderStore.getState().selectedStepId).toBeNull();
  });

  it("keeps selection if a different step is removed", () => {
    const id1 = useBuilderStore.getState().addStep();
    const id2 = useBuilderStore.getState().addStep();
    useBuilderStore.getState().selectStep(id1);
    useBuilderStore.getState().removeStep(id2);
    expect(useBuilderStore.getState().selectedStepId).toBe(id1);
  });
});

describe("reorderSteps", () => {
  it("moves a step from one index to another", () => {
    const store = useBuilderStore.getState();
    const id1 = store.addStep({ title: "A" });
    const id2 = store.addStep({ title: "B" });
    const id3 = store.addStep({ title: "C" });
    useBuilderStore.getState().reorderSteps(0, 2);
    const ids = useBuilderStore.getState().schema.steps.map((s) => s.id);
    expect(ids).toEqual([id2, id3, id1]);
  });
});

describe("selectStep", () => {
  it("selects a step and clears field selection", () => {
    const stepId = useBuilderStore.getState().addStep();
    const fieldId = useBuilderStore.getState().addField(stepId);
    useBuilderStore.getState().selectField(fieldId);
    useBuilderStore.getState().selectStep(stepId);
    expect(useBuilderStore.getState().selectedStepId).toBe(stepId);
    expect(useBuilderStore.getState().selectedFieldId).toBeNull();
  });

  it("accepts null to deselect", () => {
    useBuilderStore.getState().addStep();
    useBuilderStore.getState().selectStep(null);
    expect(useBuilderStore.getState().selectedStepId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

describe("addField", () => {
  it("adds a field to the correct step", () => {
    const stepId = useBuilderStore.getState().addStep();
    const fieldId = useBuilderStore.getState().addField(stepId, { label: "Name", type: "text" });
    const step = useBuilderStore.getState().schema.steps.find((s) => s.id === stepId);
    expect(step?.fields).toHaveLength(1);
    expect(step?.fields[0].label).toBe("Name");
    expect(useBuilderStore.getState().selectedFieldId).toBe(fieldId);
  });

  it("uses defaults when no partial provided", () => {
    const stepId = useBuilderStore.getState().addStep();
    useBuilderStore.getState().addField(stepId);
    const step = useBuilderStore.getState().schema.steps[0];
    expect(step.fields[0].type).toBe("text");
    expect(step.fields[0].label).toBe("New Field");
  });
});

describe("updateField", () => {
  it("updates field label", () => {
    const stepId = useBuilderStore.getState().addStep();
    const fieldId = useBuilderStore.getState().addField(stepId, { label: "Old" });
    useBuilderStore.getState().updateField(stepId, fieldId, { label: "New" });
    const field = useBuilderStore.getState().schema.steps[0].fields[0];
    expect(field.label).toBe("New");
  });

  it("updates field validation rules", () => {
    const stepId = useBuilderStore.getState().addStep();
    const fieldId = useBuilderStore.getState().addField(stepId);
    useBuilderStore.getState().updateField(stepId, fieldId, {
      validation: [{ type: "required", message: "Required" }],
    });
    const field = useBuilderStore.getState().schema.steps[0].fields[0];
    expect(field.validation).toHaveLength(1);
  });
});

describe("removeField", () => {
  it("removes the field", () => {
    const stepId = useBuilderStore.getState().addStep();
    const fieldId = useBuilderStore.getState().addField(stepId);
    useBuilderStore.getState().removeField(stepId, fieldId);
    expect(useBuilderStore.getState().schema.steps[0].fields).toHaveLength(0);
  });

  it("clears selectedFieldId if the removed field was selected", () => {
    const stepId = useBuilderStore.getState().addStep();
    const fieldId = useBuilderStore.getState().addField(stepId);
    useBuilderStore.getState().removeField(stepId, fieldId);
    expect(useBuilderStore.getState().selectedFieldId).toBeNull();
  });
});

describe("reorderFields", () => {
  it("reorders fields within a step", () => {
    const stepId = useBuilderStore.getState().addStep();
    const id1 = useBuilderStore.getState().addField(stepId, { label: "A" });
    const id2 = useBuilderStore.getState().addField(stepId, { label: "B" });
    const id3 = useBuilderStore.getState().addField(stepId, { label: "C" });
    useBuilderStore.getState().reorderFields(stepId, 0, 2);
    const ids = useBuilderStore.getState().schema.steps[0].fields.map((f) => f.id);
    expect(ids).toEqual([id2, id3, id1]);
  });
});

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

describe("setStepCondition", () => {
  it("sets a condition on a step", () => {
    const stepId = useBuilderStore.getState().addStep();
    useBuilderStore.getState().setStepCondition(stepId, {
      combinator: "and",
      rules: [{ field: "personal.age", operator: "greaterThan", value: 18 }],
    });
    const step = useBuilderStore.getState().schema.steps[0];
    expect(step.visibleWhen?.combinator).toBe("and");
    expect(step.visibleWhen?.rules[0].operator).toBe("greaterThan");
  });

  it("clears a condition by setting undefined", () => {
    const stepId = useBuilderStore.getState().addStep();
    useBuilderStore.getState().setStepCondition(stepId, {
      combinator: "and",
      rules: [{ field: "x.y", operator: "exists" }],
    });
    useBuilderStore.getState().setStepCondition(stepId, undefined);
    expect(useBuilderStore.getState().schema.steps[0].visibleWhen).toBeUndefined();
  });
});

describe("setFieldCondition", () => {
  it("sets a condition on a field", () => {
    const stepId = useBuilderStore.getState().addStep();
    const fieldId = useBuilderStore.getState().addField(stepId);
    useBuilderStore.getState().setFieldCondition(stepId, fieldId, {
      combinator: "or",
      rules: [{ field: "$ext.isPremium", operator: "equals", value: true }],
    });
    const field = useBuilderStore.getState().schema.steps[0].fields[0];
    expect(field.visibleWhen?.combinator).toBe("or");
  });
});

// ---------------------------------------------------------------------------
// External variables
// ---------------------------------------------------------------------------

describe("addExternalVariable", () => {
  it("adds a variable", () => {
    useBuilderStore.getState().addExternalVariable({
      id: "isPremium",
      label: "Premium",
      type: "boolean",
      blocking: true,
    });
    expect(useBuilderStore.getState().schema.externalVariables).toHaveLength(1);
    expect(useBuilderStore.getState().schema.externalVariables![0].id).toBe("isPremium");
  });
});

describe("updateExternalVariable", () => {
  it("updates an existing variable", () => {
    useBuilderStore.getState().addExternalVariable({
      id: "isPremium",
      label: "Premium",
      type: "boolean",
      blocking: false,
    });
    useBuilderStore.getState().updateExternalVariable("isPremium", { blocking: true });
    expect(useBuilderStore.getState().schema.externalVariables![0].blocking).toBe(true);
  });
});

describe("removeExternalVariable", () => {
  it("removes the variable", () => {
    useBuilderStore.getState().addExternalVariable({
      id: "isPremium",
      label: "Premium",
      type: "boolean",
      blocking: true,
    });
    useBuilderStore.getState().removeExternalVariable("isPremium");
    expect(useBuilderStore.getState().schema.externalVariables).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Custom types
// ---------------------------------------------------------------------------

describe("addCustomType", () => {
  it("adds a custom type", () => {
    useBuilderStore.getState().addCustomType({
      id: "address",
      label: "Address",
      metadata: { complex: true },
    });
    expect(useBuilderStore.getState().schema.customTypes).toHaveLength(1);
    expect(useBuilderStore.getState().schema.customTypes![0].id).toBe("address");
  });
});

describe("updateCustomType", () => {
  it("updates a custom type", () => {
    useBuilderStore.getState().addCustomType({ id: "addr", label: "Old" });
    useBuilderStore.getState().updateCustomType("addr", { label: "New" });
    expect(useBuilderStore.getState().schema.customTypes![0].label).toBe("New");
  });
});

describe("removeCustomType", () => {
  it("removes a custom type", () => {
    useBuilderStore.getState().addCustomType({ id: "addr", label: "Address" });
    useBuilderStore.getState().removeCustomType("addr");
    expect(useBuilderStore.getState().schema.customTypes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Persistence mode
// ---------------------------------------------------------------------------

describe("setPersistenceMode", () => {
  it("updates persistence mode", () => {
    useBuilderStore.getState().setPersistenceMode("backend-step");
    expect(useBuilderStore.getState().schema.persistenceMode).toBe("backend-step");
  });
});
