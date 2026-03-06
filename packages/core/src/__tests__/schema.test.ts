import { describe, expect, it } from "vitest";
import type {
  ConditionGroup,
  ExternalVariable,
  FieldDefinition,
  StepDefinition,
  WaypointSchema,
} from "../schema";

// ---------------------------------------------------------------------------
// Helpers to build valid schema fixtures
// ---------------------------------------------------------------------------

const makeField = (overrides?: Partial<FieldDefinition>): FieldDefinition => ({
  id: "age",
  type: "number",
  label: "Your age",
  ...overrides,
});

const makeStep = (overrides?: Partial<StepDefinition>): StepDefinition => ({
  id: "personal",
  title: "Personal info",
  url: "/onboarding/personal",
  fields: [makeField()],
  ...overrides,
});

const makeSchema = (overrides?: Partial<WaypointSchema>): WaypointSchema => ({
  version: "1",
  id: "onboarding",
  name: "Onboarding",
  steps: [makeStep()],
  ...overrides,
});

// ---------------------------------------------------------------------------
// WaypointSchema structure
// ---------------------------------------------------------------------------

describe("WaypointSchema", () => {
  it("accepts a minimal valid schema", () => {
    const schema = makeSchema();
    expect(schema.version).toBe("1");
    expect(schema.id).toBe("onboarding");
    expect(schema.steps).toHaveLength(1);
  });

  it("accepts optional externalVariables", () => {
    const extVar: ExternalVariable = {
      id: "isPremium",
      label: "Is premium user",
      type: "boolean",
      blocking: true,
      usedIn: [{ stepId: "billing" }],
    };
    const schema = makeSchema({ externalVariables: [extVar] });
    expect(schema.externalVariables).toHaveLength(1);
    expect(schema.externalVariables![0].id).toBe("isPremium");
  });

  it("accepts optional customTypes", () => {
    const schema = makeSchema({
      customTypes: [{ id: "address", label: "Address", metadata: { complex: true } }],
    });
    expect(schema.customTypes![0].id).toBe("address");
  });

  it("accepts metadata", () => {
    const schema = makeSchema({ metadata: { owner: "team-growth" } });
    expect(schema.metadata?.owner).toBe("team-growth");
  });
});

// ---------------------------------------------------------------------------
// StepDefinition
// ---------------------------------------------------------------------------

describe("StepDefinition", () => {
  it("accepts a step with URL template", () => {
    const step = makeStep({ url: "/onboarding/{{projectId}}/personal" });
    expect(step.url).toContain("{{projectId}}");
  });

  it("accepts a step with visibleWhen condition", () => {
    const condition: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "personal.age", operator: "greaterThan", value: 18 }],
    };
    const step = makeStep({ visibleWhen: condition });
    expect(step.visibleWhen?.combinator).toBe("and");
    expect(step.visibleWhen?.rules[0].operator).toBe("greaterThan");
  });

  it("accepts enableResumeFromHere", () => {
    const step = makeStep({ enableResumeFromHere: true });
    expect(step.enableResumeFromHere).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FieldDefinition
// ---------------------------------------------------------------------------

describe("FieldDefinition", () => {
  it("accepts a basic text field", () => {
    const field = makeField({ type: "text", id: "firstName", label: "First name" });
    expect(field.type).toBe("text");
  });

  it("accepts a select field with options", () => {
    const field = makeField({
      type: "select",
      id: "country",
      label: "Country",
      options: [
        { label: "France", value: "fr" },
        { label: "UK", value: "uk" },
      ],
    });
    expect(field.options).toHaveLength(2);
  });

  it("accepts validation rules", () => {
    const field = makeField({
      validation: [
        { type: "required", message: "Required" },
        { type: "min", value: 18, message: "Must be at least 18" },
        { type: "max", value: 99, message: "Must be at most 99" },
      ],
    });
    expect(field.validation).toHaveLength(3);
    expect(field.validation![1].value).toBe(18);
  });

  it("accepts a visibleWhen condition group", () => {
    const condition: ConditionGroup = {
      combinator: "or",
      rules: [
        { field: "personal.age", operator: "greaterThan", value: 18 },
        { field: "$ext.isPremium", operator: "equals", value: true },
      ],
    };
    const field = makeField({ visibleWhen: condition });
    expect(field.visibleWhen?.rules).toHaveLength(2);
    expect(field.visibleWhen?.rules[1].field).toBe("$ext.isPremium");
  });

  it("accepts dependsOn with dot-paths", () => {
    const field = makeField({
      id: "educationLevel",
      dependsOn: ["personal.age", "$ext.isStudent"],
    });
    expect(field.dependsOn).toContain("personal.age");
    expect(field.dependsOn).toContain("$ext.isStudent");
  });

  it("accepts a custom field type", () => {
    const field = makeField({ type: "address" }); // custom type
    expect(field.type).toBe("address");
  });
});

// ---------------------------------------------------------------------------
// ConditionGroup
// ---------------------------------------------------------------------------

describe("ConditionGroup", () => {
  it("supports nested groups", () => {
    const condition: ConditionGroup = {
      combinator: "and",
      rules: [{ field: "personal.age", operator: "greaterThan", value: 18 }],
      groups: [
        {
          combinator: "or",
          rules: [
            { field: "personal.country", operator: "equals", value: "fr" },
            { field: "personal.country", operator: "equals", value: "be" },
          ],
        },
      ],
    };
    expect(condition.groups).toHaveLength(1);
    expect(condition.groups![0].rules).toHaveLength(2);
  });

  it("supports all operators", () => {
    const operators = [
      "equals", "notEquals", "greaterThan", "greaterThanOrEqual",
      "lessThan", "lessThanOrEqual", "contains", "notContains",
      "in", "notIn", "exists", "notExists", "matches",
    ] as const;

    operators.forEach((op) => {
      const condition: ConditionGroup = {
        combinator: "and",
        rules: [{ field: "step.field", operator: op, value: "x" }],
      };
      expect(condition.rules[0].operator).toBe(op);
    });
  });
});

// ---------------------------------------------------------------------------
// ExternalVariable
// ---------------------------------------------------------------------------

describe("ExternalVariable", () => {
  it("marks blocking variables", () => {
    const extVar: ExternalVariable = {
      id: "userId",
      label: "User ID",
      type: "string",
      blocking: true,
    };
    expect(extVar.blocking).toBe(true);
  });

  it("accepts non-blocking variables", () => {
    const extVar: ExternalVariable = {
      id: "theme",
      label: "UI Theme",
      type: "string",
      blocking: false,
    };
    expect(extVar.blocking).toBe(false);
  });

  it("accepts usedIn references", () => {
    const extVar: ExternalVariable = {
      id: "isPremium",
      label: "Premium",
      type: "boolean",
      blocking: true,
      usedIn: [
        { stepId: "billing" },
        { stepId: "features", fieldId: "premiumFeature" },
      ],
    };
    expect(extVar.usedIn).toHaveLength(2);
    expect(extVar.usedIn![1].fieldId).toBe("premiumFeature");
  });
});
