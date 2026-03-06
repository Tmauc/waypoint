import { describe, expect, it } from "vitest";
import { assertSchema, validateSchema } from "../validate-schema";
import type { WaypointSchema } from "../schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const minimal: WaypointSchema = {
  version: "1",
  id: "test",
  name: "Test",
  steps: [],
};

const withStep: WaypointSchema = {
  version: "1",
  id: "flow",
  name: "Flow",
  steps: [
    {
      id: "step1",
      title: "Step 1",
      url: "/step1",
      fields: [
        { id: "name", type: "text", label: "Name" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Top-level structure
// ---------------------------------------------------------------------------

describe("validateSchema — top-level", () => {
  it("accepts a minimal valid schema", () => {
    expect(validateSchema(minimal).valid).toBe(true);
  });

  it("rejects null", () => {
    const r = validateSchema(null);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/JSON object/);
  });

  it("rejects array", () => {
    expect(validateSchema([]).valid).toBe(false);
  });

  it("rejects missing version", () => {
    const { version: _, ...rest } = minimal;
    const r = validateSchema(rest);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("rejects unsupported version", () => {
    const r = validateSchema({ ...minimal, version: "99" });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Unsupported version"))).toBe(true);
  });

  it("rejects missing id", () => {
    const { id: _, ...rest } = minimal;
    const r = validateSchema(rest);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"id"'))).toBe(true);
  });

  it("rejects empty id", () => {
    const r = validateSchema({ ...minimal, id: "   " });
    expect(r.valid).toBe(false);
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = minimal;
    const r = validateSchema(rest);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"name"'))).toBe(true);
  });

  it("rejects missing steps", () => {
    const { steps: _, ...rest } = minimal;
    const r = validateSchema(rest);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"steps"'))).toBe(true);
  });

  it("rejects steps as non-array", () => {
    const r = validateSchema({ ...minimal, steps: "bad" });
    expect(r.valid).toBe(false);
  });

  it("rejects invalid persistenceMode", () => {
    const r = validateSchema({ ...minimal, persistenceMode: "unknown-mode" });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("persistenceMode"))).toBe(true);
  });

  it("accepts valid persistenceMode values", () => {
    for (const mode of ["zustand", "backend-step", "backend-manual"]) {
      expect(validateSchema({ ...minimal, persistenceMode: mode }).valid).toBe(true);
    }
  });

  it("accumulates multiple errors", () => {
    const r = validateSchema({ version: "1" });
    expect(r.errors.length).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

describe("validateSchema — steps", () => {
  it("accepts a valid step", () => {
    expect(validateSchema(withStep).valid).toBe(true);
  });

  it("rejects step with missing id", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{ title: "S", url: "/s", fields: [] }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("steps[0]") && e.includes('"id"'))).toBe(true);
  });

  it("rejects duplicate step ids", () => {
    const r = validateSchema({
      ...minimal,
      steps: [
        { id: "s1", title: "A", url: "/a", fields: [] },
        { id: "s1", title: "B", url: "/b", fields: [] },
      ],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('duplicate step id "s1"'))).toBe(true);
  });

  it("rejects step with missing title", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{ id: "s1", url: "/s1", fields: [] }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"title"'))).toBe(true);
  });

  it("rejects step with missing url", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{ id: "s1", title: "S1", fields: [] }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"url"'))).toBe(true);
  });

  it("rejects step with missing fields array", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{ id: "s1", title: "S1", url: "/s1" }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"fields"'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

describe("validateSchema — fields", () => {
  const makeStep = (fields: unknown[]) => ({
    ...minimal,
    steps: [{ id: "s1", title: "S1", url: "/s1", fields }],
  });

  it("accepts a valid field", () => {
    expect(validateSchema(makeStep([{ id: "f1", type: "text", label: "F1" }])).valid).toBe(true);
  });

  it("rejects field with missing id", () => {
    const r = validateSchema(makeStep([{ type: "text", label: "F1" }]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("fields[0]") && e.includes('"id"'))).toBe(true);
  });

  it("rejects field with missing type", () => {
    const r = validateSchema(makeStep([{ id: "f1", label: "F1" }]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"type"'))).toBe(true);
  });

  it("rejects field with missing label", () => {
    const r = validateSchema(makeStep([{ id: "f1", type: "text" }]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"label"'))).toBe(true);
  });

  it("rejects duplicate field ids within a step", () => {
    const r = validateSchema(makeStep([
      { id: "f1", type: "text", label: "A" },
      { id: "f1", type: "text", label: "B" },
    ]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('duplicate field id "f1"'))).toBe(true);
  });

  it("rejects non-array dependsOn", () => {
    const r = validateSchema(makeStep([{ id: "f1", type: "text", label: "F", dependsOn: "bad" }]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"dependsOn"'))).toBe(true);
  });

  it("rejects non-string entry in dependsOn", () => {
    const r = validateSchema(makeStep([{ id: "f1", type: "text", label: "F", dependsOn: [123] }]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"dependsOn"'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

describe("validateSchema — conditions", () => {
  it("accepts valid visibleWhen on a step", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{
        id: "s1", title: "S1", url: "/s1", fields: [],
        visibleWhen: { combinator: "and", rules: [{ field: "s0.age", operator: "greaterThan", value: 18 }] },
      }],
    });
    expect(r.valid).toBe(true);
  });

  it("rejects invalid combinator", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{
        id: "s1", title: "S1", url: "/s1", fields: [],
        visibleWhen: { combinator: "xor", rules: [] },
      }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"combinator"'))).toBe(true);
  });

  it("rejects invalid operator", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{
        id: "s1", title: "S1", url: "/s1", fields: [],
        visibleWhen: {
          combinator: "and",
          rules: [{ field: "s0.x", operator: "INVALID_OP" }],
        },
      }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("operator") || e.includes("INVALID_OP"))).toBe(true);
  });

  it("validates nested condition groups", () => {
    const r = validateSchema({
      ...minimal,
      steps: [{
        id: "s1", title: "S1", url: "/s1", fields: [],
        visibleWhen: {
          combinator: "or",
          rules: [],
          groups: [{ combinator: "bad_combinator", rules: [] }],
        },
      }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("groups[0]"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------

describe("validateSchema — validation rules", () => {
  const makeField = (validation: unknown[]) => ({
    ...minimal,
    steps: [{
      id: "s1", title: "S1", url: "/s1",
      fields: [{ id: "f1", type: "text", label: "F", validation }],
    }],
  });

  it("accepts valid validation rules", () => {
    expect(validateSchema(makeField([
      { type: "required", message: "Required" },
      { type: "minLength", value: "8", message: "Too short" },
    ])).valid).toBe(true);
  });

  it("rejects invalid validation type", () => {
    const r = validateSchema(makeField([{ type: "UNKNOWN", message: "x" }]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("validation[0]"))).toBe(true);
  });

  it("rejects validation rule without message", () => {
    const r = validateSchema(makeField([{ type: "required" }]));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"message"'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// External variables
// ---------------------------------------------------------------------------

describe("validateSchema — externalVariables", () => {
  it("accepts valid external variables", () => {
    const r = validateSchema({
      ...minimal,
      externalVariables: [
        { id: "userId", label: "User ID", type: "string", blocking: true },
      ],
    });
    expect(r.valid).toBe(true);
  });

  it("rejects non-array externalVariables", () => {
    expect(validateSchema({ ...minimal, externalVariables: "bad" }).valid).toBe(false);
  });

  it("rejects duplicate external variable ids", () => {
    const r = validateSchema({
      ...minimal,
      externalVariables: [
        { id: "x", label: "X", type: "string", blocking: false },
        { id: "x", label: "X2", type: "number", blocking: false },
      ],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('duplicate external variable id "x"'))).toBe(true);
  });

  it("rejects invalid external variable type", () => {
    const r = validateSchema({
      ...minimal,
      externalVariables: [{ id: "x", label: "X", type: "array", blocking: false }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("type"))).toBe(true);
  });

  it("rejects non-boolean blocking", () => {
    const r = validateSchema({
      ...minimal,
      externalVariables: [{ id: "x", label: "X", type: "string", blocking: "yes" }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('"blocking"'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// assertSchema
// ---------------------------------------------------------------------------

describe("assertSchema", () => {
  it("does not throw for a valid schema", () => {
    expect(() => assertSchema(minimal)).not.toThrow();
  });

  it("throws with a detailed message for an invalid schema", () => {
    expect(() => assertSchema({ version: "99", id: "", name: "", steps: [] })).toThrow(
      /Invalid WaypointSchema/,
    );
  });

  it("includes all errors in the thrown message", () => {
    try {
      assertSchema({ version: "99" });
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toMatch(/Unsupported version/);
      expect(msg).toMatch(/"id"/);
      expect(msg).toMatch(/"name"/);
    }
  });
});

// ---------------------------------------------------------------------------
// Serialisation round-trip
// ---------------------------------------------------------------------------

describe("serialisation round-trip", () => {
  it("export → JSON.stringify → JSON.parse → validateSchema returns valid", () => {
    const schema: WaypointSchema = {
      version: "1",
      id: "checkout",
      name: "Checkout",
      persistenceMode: "zustand",
      steps: [
        {
          id: "shipping",
          title: "Shipping",
          url: "/checkout/shipping",
          fields: [
            { id: "fullName", type: "text", label: "Full name", validation: [{ type: "required", message: "Required" }] },
            {
              id: "country",
              type: "select",
              label: "Country",
              options: [{ label: "France", value: "fr" }],
              validation: [{ type: "required", message: "Required" }],
            },
          ],
        },
        {
          id: "payment",
          title: "Payment",
          url: "/checkout/payment",
          visibleWhen: {
            combinator: "and",
            rules: [{ field: "shipping.country", operator: "equals", value: "fr" }],
          },
          fields: [
            {
              id: "method",
              type: "radio",
              label: "Method",
              options: [{ label: "Card", value: "card" }],
              validation: [{ type: "required", message: "Required" }],
            },
            {
              id: "cardNumber",
              type: "text",
              label: "Card number",
              dependsOn: ["payment.method"],
              visibleWhen: {
                combinator: "and",
                rules: [{ field: "payment.method", operator: "equals", value: "card" }],
              },
              validation: [{ type: "required", message: "Required" }],
            },
          ],
        },
      ],
      externalVariables: [
        { id: "customerId", label: "Customer ID", type: "string", blocking: true },
      ],
      customTypes: [],
    };

    const serialised = JSON.stringify(schema);
    const parsed = JSON.parse(serialised);
    const result = validateSchema(parsed);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
