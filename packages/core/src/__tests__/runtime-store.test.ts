import { describe, it, expect, beforeEach } from "vitest";

import { createRuntimeStore, hasPersistedState } from "../runtime-store";
import {
  getResolvedTree,
  getCurrentStep,
  getNextStepFromState,
  getPreviousStepFromState,
  calculateProgressFromState,
  getMissingBlockingVars,
} from "../runtime-store";
import type { WaypointSchema } from "../schema";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const simpleSchema: WaypointSchema = {
  version: "1",
  id: "test",
  name: "Test Journey",
  steps: [
    {
      id: "step1",
      title: "Step 1",
      url: "/test/step1",
      fields: [
        {
          id: "name",
          type: "text",
          label: "Name",
          validation: [{ type: "required", message: "Required" }],
        },
      ],
    },
    {
      id: "step2",
      title: "Step 2",
      url: "/test/step2",
      fields: [
        {
          id: "email",
          type: "email",
          label: "Email",
          validation: [{ type: "required", message: "Required" }],
        },
      ],
    },
    {
      id: "step3",
      title: "Step 3",
      url: "/test/step3",
      fields: [],
    },
  ],
};

const conditionalSchema: WaypointSchema = {
  version: "1",
  id: "conditional-test",
  name: "Conditional Journey",
  steps: [
    {
      id: "start",
      title: "Start",
      url: "/test/start",
      fields: [
        {
          id: "type",
          type: "select",
          label: "Type",
          options: [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
          ],
          validation: [{ type: "required", message: "Required" }],
        },
      ],
    },
    {
      id: "type-a",
      title: "Type A",
      url: "/test/type-a",
      visibleWhen: {
        combinator: "and",
        rules: [{ field: "start.type", operator: "equals", value: "a" }],
      },
      fields: [{ id: "detail", type: "text", label: "Detail" }],
    },
    {
      id: "type-b",
      title: "Type B",
      url: "/test/type-b",
      visibleWhen: {
        combinator: "and",
        rules: [{ field: "start.type", operator: "equals", value: "b" }],
      },
      fields: [{ id: "other", type: "text", label: "Other" }],
    },
    {
      id: "end",
      title: "End",
      url: "/test/end",
      fields: [],
    },
  ],
};

const blockingVarSchema: WaypointSchema = {
  version: "1",
  id: "blocking-test",
  name: "Blocking Var Journey",
  steps: [
    {
      id: "step1",
      title: "Step 1",
      url: "/test/step1",
      fields: [],
    },
  ],
  externalVariables: [
    {
      id: "userId",
      label: "User ID",
      type: "string",
      blocking: true,
      usedIn: [{ stepId: "step1" }],
    },
  ],
};

// ---------------------------------------------------------------------------
// createRuntimeStore
// ---------------------------------------------------------------------------

describe("createRuntimeStore", () => {
  it("creates a store with initial empty state", () => {
    const store = createRuntimeStore();
    const state = store.getState();
    expect(state.schema).toBeNull();
    expect(state.data).toEqual({});
    expect(state.externalVars).toEqual({});
    expect(state.currentStepId).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.isSubmitting).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

describe("init", () => {
  it("sets schema and navigates to first step by default", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);

    const state = store.getState();
    expect(state.schema).toBe(simpleSchema);
    expect(state.currentStepId).toBe("step1");
    expect(state.history).toEqual(["step1"]);
  });

  it("accepts initial data and externalVars", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema, {
      data: { step1: { name: "Alice" } },
      externalVars: { token: "abc" },
    });

    const state = store.getState();
    expect(state.data).toEqual({ step1: { name: "Alice" } });
    expect(state.externalVars).toEqual({ token: "abc" });
  });

  it("accepts a custom startStepId", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema, { startStepId: "step2" });

    expect(store.getState().currentStepId).toBe("step2");
  });
});

// ---------------------------------------------------------------------------
// setFieldValue / setStepData
// ---------------------------------------------------------------------------

describe("setFieldValue", () => {
  it("sets a single field value", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().setFieldValue("step1", "name", "Bob");

    expect(store.getState().data.step1?.name).toBe("Bob");
  });

  it("merges with existing step data", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema, {
      data: { step1: { name: "Alice", extra: true } },
    });
    store.getState().setFieldValue("step1", "name", "Bob");

    expect(store.getState().data.step1).toEqual({ name: "Bob", extra: true });
  });
});

describe("setStepData", () => {
  it("replaces all step data", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().setStepData("step1", { name: "Alice", extra: "x" });

    expect(store.getState().data.step1).toEqual({ name: "Alice", extra: "x" });
  });
});

// ---------------------------------------------------------------------------
// setExternalVar
// ---------------------------------------------------------------------------

describe("setExternalVar", () => {
  it("sets a single external variable", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().setExternalVar("token", "abc123");

    expect(store.getState().externalVars.token).toBe("abc123");
  });
});

// ---------------------------------------------------------------------------
// setCurrentStep
// ---------------------------------------------------------------------------

describe("setCurrentStep", () => {
  it("updates currentStepId and appends to history", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().setCurrentStep("step2");

    expect(store.getState().currentStepId).toBe("step2");
    expect(store.getState().history).toEqual(["step1", "step2"]);
  });

  it("does not duplicate history entries", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().setCurrentStep("step2");
    store.getState().setCurrentStep("step2");

    expect(store.getState().history).toEqual(["step1", "step2"]);
  });
});

// ---------------------------------------------------------------------------
// setIsSubmitting / reset
// ---------------------------------------------------------------------------

describe("setIsSubmitting", () => {
  it("toggles submitting state", () => {
    const store = createRuntimeStore();
    store.getState().setIsSubmitting(true);
    expect(store.getState().isSubmitting).toBe(true);
    store.getState().setIsSubmitting(false);
    expect(store.getState().isSubmitting).toBe(false);
  });
});

describe("reset", () => {
  it("resets all state to initial values", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema, { data: { step1: { name: "Alice" } } });
    store.getState().reset();

    const state = store.getState();
    expect(state.schema).toBeNull();
    expect(state.data).toEqual({});
    expect(state.currentStepId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Computed helpers
// ---------------------------------------------------------------------------

describe("getResolvedTree", () => {
  it("returns empty tree when schema is null", () => {
    const store = createRuntimeStore();
    const tree = getResolvedTree(store.getState());
    expect(tree.steps).toEqual([]);
    expect(tree.hiddenSteps).toEqual([]);
    expect(tree.missingExternalVars).toEqual([]);
  });

  it("resolves all steps when no conditions", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    const tree = getResolvedTree(store.getState());
    expect(tree.steps).toHaveLength(3);
    expect(tree.hiddenSteps).toHaveLength(0);
  });

  it("hides conditional steps when condition is not met", () => {
    const store = createRuntimeStore();
    store.getState().init(conditionalSchema);
    const tree = getResolvedTree(store.getState());
    // No type selected → both type-a and type-b are hidden
    const visibleIds = tree.steps.map((s) => s.definition.id);
    expect(visibleIds).toContain("start");
    expect(visibleIds).toContain("end");
    expect(visibleIds).not.toContain("type-a");
    expect(visibleIds).not.toContain("type-b");
  });

  it("shows only matching conditional step when type is selected", () => {
    const store = createRuntimeStore();
    store.getState().init(conditionalSchema, {
      data: { start: { type: "a" } },
    });
    const tree = getResolvedTree(store.getState());
    const visibleIds = tree.steps.map((s) => s.definition.id);
    expect(visibleIds).toContain("type-a");
    expect(visibleIds).not.toContain("type-b");
  });
});

describe("getCurrentStep", () => {
  it("returns undefined when no schema", () => {
    const store = createRuntimeStore();
    expect(getCurrentStep(store.getState())).toBeUndefined();
  });

  it("returns the current step", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    const step = getCurrentStep(store.getState());
    expect(step?.definition.id).toBe("step1");
  });
});

describe("getNextStepFromState / getPreviousStepFromState", () => {
  it("returns next step from current", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    const next = getNextStepFromState(store.getState());
    expect(next?.definition.id).toBe("step2");
  });

  it("returns undefined for last step", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema, { startStepId: "step3" });
    expect(getNextStepFromState(store.getState())).toBeUndefined();
  });

  it("returns previous step from current", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema, { startStepId: "step2" });
    const prev = getPreviousStepFromState(store.getState());
    expect(prev?.definition.id).toBe("step1");
  });

  it("returns undefined for first step", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    expect(getPreviousStepFromState(store.getState())).toBeUndefined();
  });
});

describe("calculateProgressFromState", () => {
  it("returns 0 when no currentStepId", () => {
    const store = createRuntimeStore();
    expect(calculateProgressFromState(store.getState())).toBe(0);
  });

  it("calculates progress correctly for first step", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    const progress = calculateProgressFromState(store.getState());
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
  });
});

describe("getMissingBlockingVars", () => {
  it("returns empty array when no schema", () => {
    const store = createRuntimeStore();
    expect(getMissingBlockingVars(store.getState())).toEqual([]);
  });

  it("detects missing blocking external variable", () => {
    const store = createRuntimeStore();
    store.getState().init(blockingVarSchema);
    const missing = getMissingBlockingVars(store.getState());
    expect(missing).toContain("userId");
  });

  it("returns empty when blocking var is provided", () => {
    const store = createRuntimeStore();
    store.getState().init(blockingVarSchema, {
      externalVars: { userId: "user-123" },
    });
    const missing = getMissingBlockingVars(store.getState());
    expect(missing).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// truncateHistoryAt
// ---------------------------------------------------------------------------

describe("truncateHistoryAt", () => {
  it("removes entries after the given step", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().setCurrentStep("step2");
    store.getState().setCurrentStep("step3");
    expect(store.getState().history).toEqual(["step1", "step2", "step3"]);

    store.getState().truncateHistoryAt("step1");
    expect(store.getState().history).toEqual(["step1"]);
  });

  it("is a no-op when the step is already the last in history", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().setCurrentStep("step2");
    store.getState().truncateHistoryAt("step2");
    expect(store.getState().history).toEqual(["step1", "step2"]);
  });

  it("is a no-op when the step is not in history", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().truncateHistoryAt("unknown-step");
    expect(store.getState().history).toEqual(["step1"]);
  });

  it("handles the dep-change scenario: user goes back, changes dep value, moves forward", () => {
    // Simulates: start(type=a) → type-a → end   (history: [start, type-a, end])
    // User goes back to start, changes type to b
    // History should be truncated to [start] before navigating to type-b
    const store = createRuntimeStore();
    store.getState().init(conditionalSchema, { data: { start: { type: "a" } } });
    store.getState().setCurrentStep("type-a");
    store.getState().setCurrentStep("end");
    expect(store.getState().history).toEqual(["start", "type-a", "end"]);

    // User navigates back to start and changes type — we truncate at start
    store.getState().truncateHistoryAt("start");
    expect(store.getState().history).toEqual(["start"]);

    // Now moving forward with type=b leads to type-b (not type-a or end)
    store.getState().setStepData("start", { type: "b" });
    store.getState().setCurrentStep("type-b");
    expect(store.getState().history).toEqual(["start", "type-b"]);
  });
});

// ---------------------------------------------------------------------------
// resume
// ---------------------------------------------------------------------------

describe("resume", () => {
  it("keeps data, currentStepId and history intact", () => {
    const store = createRuntimeStore();
    // Simulate a previous session: user was on step2 with data filled
    store.getState().init(simpleSchema, {
      data: { step1: { name: "Alice" } },
    });
    store.getState().setCurrentStep("step2");

    const snapshot = {
      data: store.getState().data,
      currentStepId: store.getState().currentStepId,
      history: [...store.getState().history],
    };

    // User leaves and comes back — resume with updated schema + externalVars
    store.getState().resume(simpleSchema, { token: "xyz" });

    expect(store.getState().data).toEqual(snapshot.data);
    expect(store.getState().currentStepId).toBe(snapshot.currentStepId);
    expect(store.getState().history).toEqual(snapshot.history);
  });

  it("updates schema and merges externalVars", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema, { externalVars: { oldVar: 1 } });
    store.getState().resume(simpleSchema, { newVar: 2 });

    expect(store.getState().schema).toBe(simpleSchema);
    expect(store.getState().externalVars).toMatchObject({ oldVar: 1, newVar: 2 });
  });

  it("does not reset isSubmitting", () => {
    const store = createRuntimeStore();
    store.getState().init(simpleSchema);
    store.getState().resume(simpleSchema);
    expect(store.getState().isSubmitting).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasPersistedState
// ---------------------------------------------------------------------------

describe("hasPersistedState", () => {
  it("returns false for a fresh store with no persisted data", () => {
    const store = createRuntimeStore();
    expect(hasPersistedState(store, "test")).toBe(false);
  });

  it("returns false when currentStepId is null (even if schemaId matches)", () => {
    const store = createRuntimeStore();
    // Simulate persist middleware hydration with matching schemaId but no step yet
    store.setState({ currentStepId: null, ...({"schemaId": "test"} as object) });
    expect(hasPersistedState(store, "test")).toBe(false);
  });

  it("returns false when persisted schemaId does not match", () => {
    const store = createRuntimeStore();
    // Simulate persist middleware hydration for a different schema
    store.setState({ currentStepId: "step1", ...({"schemaId": "other-schema"} as object) });
    expect(hasPersistedState(store, "test")).toBe(false);
  });

  it("returns true when persisted schemaId matches and currentStepId is set", () => {
    const store = createRuntimeStore();
    // Simulate what the persist middleware does when hydrating from localStorage:
    // it merges the PersistedSlice (including schemaId) directly onto the state.
    store.setState({
      data: { step1: { name: "Alice" } },
      currentStepId: "step2",
      history: ["step1", "step2"],
      ...({"schemaId": "test"} as object),
    });
    expect(hasPersistedState(store, "test")).toBe(true);
  });
});
