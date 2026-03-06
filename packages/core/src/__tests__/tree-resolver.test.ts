import { describe, expect, it } from "vitest";
import type { ExternalVars, JourneyData } from "../conditions";
import type { ExternalEnum, WaypointSchema } from "../schema";
import {
  calculateProgress,
  findLastValidStep,
  findStepIndex,
  getNextStep,
  getPreviousStep,
  resolveTree,
} from "../tree-resolver";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseSchema: WaypointSchema = {
  version: "1",
  id: "test",
  name: "Test Journey",
  steps: [
    {
      id: "personal",
      title: "Personal",
      url: "/personal",
      fields: [
        { id: "age", type: "number", label: "Age" },
        { id: "name", type: "text", label: "Name" },
      ],
    },
    {
      id: "education",
      title: "Education",
      url: "/education",
      fields: [
        {
          id: "level",
          type: "select",
          label: "Level",
          dependsOn: ["personal.age"],
        },
      ],
      visibleWhen: {
        combinator: "and",
        rules: [{ field: "personal.age", operator: "greaterThan", value: 16 }],
      },
    },
    {
      id: "billing",
      title: "Billing",
      url: "/billing",
      fields: [{ id: "plan", type: "select", label: "Plan" }],
    },
  ],
};

const emptyData: JourneyData = {};
const emptyVars: ExternalVars = {};
const adultData: JourneyData = { personal: { age: 25, name: "Alice" } };
const minorData: JourneyData = { personal: { age: 15, name: "Bob" } };

// ---------------------------------------------------------------------------
// resolveTree — visibility
// ---------------------------------------------------------------------------

describe("resolveTree — step visibility", () => {
  it("shows all steps when conditions are met", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(result.steps).toHaveLength(3);
    expect(result.hiddenSteps).toHaveLength(0);
  });

  it("hides steps when condition is false", () => {
    const result = resolveTree(baseSchema, minorData, emptyVars);
    expect(result.steps).toHaveLength(2);
    expect(result.hiddenSteps).toHaveLength(1);
    expect(result.hiddenSteps[0].definition.id).toBe("education");
  });

  it("shows all steps when no conditions defined", () => {
    const result = resolveTree(baseSchema, emptyData, emptyVars);
    // education is hidden because age is undefined → not > 16
    expect(result.steps.map((s) => s.definition.id)).toEqual(["personal", "billing"]);
  });

  it("all steps visible when no visibleWhen anywhere", () => {
    const schema: WaypointSchema = {
      version: "1",
      id: "simple",
      name: "Simple",
      steps: [
        { id: "s1", title: "S1", url: "/s1", fields: [] },
        { id: "s2", title: "S2", url: "/s2", fields: [] },
      ],
    };
    const result = resolveTree(schema, emptyData, emptyVars);
    expect(result.steps).toHaveLength(2);
    expect(result.hiddenSteps).toHaveLength(0);
  });

  it("preserves order of visible steps", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(result.steps.map((s) => s.definition.id)).toEqual([
      "personal",
      "education",
      "billing",
    ]);
  });
});

// ---------------------------------------------------------------------------
// resolveTree — field visibility
// ---------------------------------------------------------------------------

describe("resolveTree — field visibility", () => {
  it("marks fields as visible when no condition defined", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    const personal = result.steps.find((s) => s.definition.id === "personal")!;
    expect(personal.fields.every((f) => f.visible)).toBe(true);
  });

  it("marks field as not visible when condition fails", () => {
    const schema: WaypointSchema = {
      version: "1",
      id: "test",
      name: "Test",
      steps: [
        {
          id: "step1",
          title: "Step 1",
          url: "/step1",
          fields: [
            { id: "age", type: "number", label: "Age" },
            {
              id: "drivingLicense",
              type: "checkbox",
              label: "Driving license",
              visibleWhen: {
                combinator: "and",
                rules: [{ field: "step1.age", operator: "greaterThanOrEqual", value: 18 }],
              },
            },
          ],
        },
      ],
    };

    const resultMinor = resolveTree(schema, { step1: { age: 16 } }, emptyVars);
    const resultAdult = resolveTree(schema, { step1: { age: 20 } }, emptyVars);

    const minorFields = resultMinor.steps[0].fields;
    const adultFields = resultAdult.steps[0].fields;

    expect(minorFields.find((f) => f.definition.id === "drivingLicense")?.visible).toBe(false);
    expect(adultFields.find((f) => f.definition.id === "drivingLicense")?.visible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveTree — dependencies
// ---------------------------------------------------------------------------

describe("resolveTree — field dependencies", () => {
  it("marks dependenciesMet true when dep value exists", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    const education = result.steps.find((s) => s.definition.id === "education")!;
    const levelField = education.fields.find((f) => f.definition.id === "level")!;
    expect(levelField.dependenciesMet).toBe(true);
  });

  it("marks dependenciesMet false when dep value is missing", () => {
    const result = resolveTree(baseSchema, { personal: { name: "Alice" } }, emptyVars);
    // education is hidden (age missing), but let's test with a schema where education is always visible
    const schema: WaypointSchema = {
      ...baseSchema,
      steps: baseSchema.steps.map((s) =>
        s.id === "education" ? { ...s, visibleWhen: undefined } : s
      ),
    };
    const result2 = resolveTree(schema, { personal: { name: "Alice" } }, emptyVars);
    const education = result2.steps.find((s) => s.definition.id === "education")!;
    const levelField = education.fields.find((f) => f.definition.id === "level")!;
    expect(levelField.dependenciesMet).toBe(false);
  });

  it("resolves external variable dependency", () => {
    const schema: WaypointSchema = {
      version: "1",
      id: "test",
      name: "Test",
      steps: [
        {
          id: "premium",
          title: "Premium",
          url: "/premium",
          fields: [
            {
              id: "feature",
              type: "checkbox",
              label: "Feature",
              dependsOn: ["$ext.isPremium"],
            },
          ],
        },
      ],
    };

    const withVar = resolveTree(schema, emptyData, { isPremium: true });
    const withoutVar = resolveTree(schema, emptyData, {});

    expect(withVar.steps[0].fields[0].dependenciesMet).toBe(true);
    expect(withoutVar.steps[0].fields[0].dependenciesMet).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveTree — external variable validation
// ---------------------------------------------------------------------------

describe("resolveTree — missing external variables", () => {
  const schemaWithExtVar: WaypointSchema = {
    version: "1",
    id: "test",
    name: "Test",
    steps: [
      { id: "step1", title: "Step 1", url: "/s1", fields: [] },
      {
        id: "step2",
        title: "Step 2",
        url: "/s2",
        fields: [],
        visibleWhen: {
          combinator: "and",
          rules: [{ field: "$ext.isPremium", operator: "equals", value: true }],
        },
      },
    ],
    externalVariables: [
      {
        id: "isPremium",
        label: "Premium",
        type: "boolean",
        blocking: true,
        usedIn: [{ stepId: "step2" }],
      },
    ],
  };

  it("reports missing blocking external variable used in visible step", () => {
    const result = resolveTree(schemaWithExtVar, emptyData, { isPremium: true });
    // step2 is visible (isPremium = true), but isPremium IS provided → no missing
    expect(result.missingExternalVars).toHaveLength(0);
  });

  it("reports no missing var when step using it is hidden", () => {
    // isPremium = false → step2 hidden → no missing var reported
    const result = resolveTree(schemaWithExtVar, emptyData, { isPremium: false });
    expect(result.missingExternalVars).toHaveLength(0);
  });

  it("reports missing var when step is visible but var not provided", () => {
    // isPremium not in externalVars → step2 hidden by condition
    // but let's test with a step that has no condition and an always-required var
    const schema: WaypointSchema = {
      version: "1",
      id: "test",
      name: "Test",
      steps: [{ id: "step1", title: "Step 1", url: "/s1", fields: [] }],
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

    const result = resolveTree(schema, emptyData, {});
    expect(result.missingExternalVars).toContain("userId");
  });

  it("does not report non-blocking vars as missing", () => {
    const schema: WaypointSchema = {
      version: "1",
      id: "test",
      name: "Test",
      steps: [{ id: "step1", title: "Step 1", url: "/s1", fields: [] }],
      externalVariables: [
        {
          id: "theme",
          label: "Theme",
          type: "string",
          blocking: false,
          usedIn: [{ stepId: "step1" }],
        },
      ],
    };

    const result = resolveTree(schema, emptyData, {});
    expect(result.missingExternalVars).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

describe("findStepIndex", () => {
  it("finds existing step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(findStepIndex(result.steps, "education")).toBe(1);
  });

  it("returns -1 for unknown step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(findStepIndex(result.steps, "unknown")).toBe(-1);
  });
});

describe("getNextStep", () => {
  it("returns next step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    const next = getNextStep(result.steps, "personal");
    expect(next?.definition.id).toBe("education");
  });

  it("returns undefined for last step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(getNextStep(result.steps, "billing")).toBeUndefined();
  });

  it("skips hidden steps correctly — next of personal is billing when education hidden", () => {
    const result = resolveTree(baseSchema, minorData, emptyVars);
    const next = getNextStep(result.steps, "personal");
    expect(next?.definition.id).toBe("billing");
  });
});

describe("getPreviousStep", () => {
  it("returns previous step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(getPreviousStep(result.steps, "billing")?.definition.id).toBe("education");
  });

  it("returns undefined for first step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(getPreviousStep(result.steps, "personal")).toBeUndefined();
  });
});

describe("calculateProgress", () => {
  it("returns 0 for first step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(calculateProgress(result.steps, "personal")).toBe(25); // 1/4 * 100
  });

  it("returns 100-ish for last step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(calculateProgress(result.steps, "billing")).toBe(75); // 3/4 * 100
  });

  it("returns 0 for unknown step", () => {
    const result = resolveTree(baseSchema, adultData, emptyVars);
    expect(calculateProgress(result.steps, "unknown")).toBe(0);
  });

  it("recalculates when tree changes (hidden step)", () => {
    // With education hidden: 2 steps → personal=33%, billing=67%
    const result = resolveTree(baseSchema, minorData, emptyVars);
    expect(calculateProgress(result.steps, "personal")).toBe(33);
    expect(calculateProgress(result.steps, "billing")).toBe(67);
  });
});

// ---------------------------------------------------------------------------
// findLastValidStep
// ---------------------------------------------------------------------------

describe("findLastValidStep", () => {
  it("returns first step when no data", () => {
    const result = resolveTree(baseSchema, emptyData, emptyVars);
    const last = findLastValidStep(result.steps, emptyData, emptyVars);
    expect(last?.definition.id).toBe("personal");
  });

  it("returns last step with data when first step is filled", () => {
    const data: JourneyData = {
      personal: { age: 25, name: "Alice" },
    };
    const result = resolveTree(baseSchema, data, emptyVars);
    const last = findLastValidStep(result.steps, data, emptyVars);
    expect(last?.definition.id).toBe("personal");
  });

  it("returns second step when first and second are filled", () => {
    const data: JourneyData = {
      personal: { age: 25, name: "Alice" },
      education: { level: "bachelor" },
    };
    const result = resolveTree(baseSchema, data, emptyVars);
    const last = findLastValidStep(result.steps, data, emptyVars);
    expect(last?.definition.id).toBe("education");
  });
});

// ---------------------------------------------------------------------------
// resolveTree — external enums
// ---------------------------------------------------------------------------

const enumSchema: WaypointSchema = {
  version: "1",
  id: "enum-test",
  name: "Enum Test",
  steps: [
    {
      id: "step1",
      title: "Step 1",
      url: "/step1",
      fields: [
        {
          id: "country",
          type: "select",
          label: "Country",
          externalEnumId: "countries",
        },
        {
          id: "role",
          type: "select",
          label: "Role",
          options: [{ label: "Admin", value: "admin" }],
        },
        {
          id: "missing_enum",
          type: "select",
          label: "Missing Enum",
          externalEnumId: "nonexistent",
        },
      ],
    },
  ],
};

const testEnums: ExternalEnum[] = [
  {
    id: "countries",
    label: "Countries",
    values: [
      { label: "France", value: "fr" },
      { label: "USA", value: "us" },
    ],
  },
];

describe("resolveTree — external enums", () => {
  it("injects resolvedOptions for a field referencing an existing enum", () => {
    const tree = resolveTree(enumSchema, {}, emptyVars, testEnums);
    const countryField = tree.steps[0].fields.find(
      (f) => f.definition.id === "country"
    );
    expect(countryField?.resolvedOptions).toEqual([
      { label: "France", value: "fr" },
      { label: "USA", value: "us" },
    ]);
  });

  it("leaves resolvedOptions undefined for a field with hardcoded options", () => {
    const tree = resolveTree(enumSchema, {}, emptyVars, testEnums);
    const roleField = tree.steps[0].fields.find(
      (f) => f.definition.id === "role"
    );
    expect(roleField?.resolvedOptions).toBeUndefined();
  });

  it("leaves resolvedOptions undefined when enum id is not found", () => {
    const tree = resolveTree(enumSchema, {}, emptyVars, testEnums);
    const missingField = tree.steps[0].fields.find(
      (f) => f.definition.id === "missing_enum"
    );
    expect(missingField?.resolvedOptions).toBeUndefined();
  });

  it("leaves resolvedOptions undefined when no externalEnums provided", () => {
    const tree = resolveTree(enumSchema, {}, emptyVars);
    const countryField = tree.steps[0].fields.find(
      (f) => f.definition.id === "country"
    );
    expect(countryField?.resolvedOptions).toBeUndefined();
  });

  it("does not affect other resolved field properties", () => {
    const tree = resolveTree(enumSchema, {}, emptyVars, testEnums);
    const countryField = tree.steps[0].fields.find(
      (f) => f.definition.id === "country"
    );
    expect(countryField?.visible).toBe(true);
    expect(countryField?.dependenciesMet).toBe(true);
    expect(countryField?.definition.externalEnumId).toBe("countries");
  });
});

// ---------------------------------------------------------------------------
// resolveTree — dynamicDefault
// ---------------------------------------------------------------------------

describe("resolveTree — dynamicDefault", () => {
  const dynSchema: WaypointSchema = {
    version: "1",
    id: "dyn-default-test",
    name: "Dynamic Default Test",
    steps: [
      {
        id: "info",
        title: "Info",
        url: "/info",
        fields: [
          { id: "age", type: "number", label: "Age" },
          {
            id: "profession",
            type: "text",
            label: "Profession",
            defaultValue: "employed",
            dynamicDefault: [
              {
                when: {
                  combinator: "and",
                  rules: [{ field: "info.age", operator: "greaterThan", value: 65 }],
                },
                value: "retired",
              },
              {
                when: {
                  combinator: "and",
                  rules: [{ field: "info.age", operator: "lessThan", value: 18 }],
                },
                value: "student",
              },
            ],
          },
        ],
      },
    ],
  };

  it("resolvedDefaultValue is undefined when no rule matches", () => {
    const tree = resolveTree(dynSchema, { info: { age: 30 } }, emptyVars);
    const profession = tree.steps[0].fields.find((f) => f.definition.id === "profession");
    expect(profession?.resolvedDefaultValue).toBeUndefined();
  });

  it("resolvedDefaultValue matches first matching rule", () => {
    const tree = resolveTree(dynSchema, { info: { age: 70 } }, emptyVars);
    const profession = tree.steps[0].fields.find((f) => f.definition.id === "profession");
    expect(profession?.resolvedDefaultValue).toBe("retired");
  });

  it("resolvedDefaultValue picks second rule when first doesn't match", () => {
    const tree = resolveTree(dynSchema, { info: { age: 15 } }, emptyVars);
    const profession = tree.steps[0].fields.find((f) => f.definition.id === "profession");
    expect(profession?.resolvedDefaultValue).toBe("student");
  });

  it("resolvedDefaultValue is undefined when dynamicDefault is not set", () => {
    const tree = resolveTree(dynSchema, {}, emptyVars);
    const age = tree.steps[0].fields.find((f) => f.definition.id === "age");
    expect(age?.resolvedDefaultValue).toBeUndefined();
  });

  it("resolvedDefaultValue works with external vars", () => {
    const extSchema: WaypointSchema = {
      ...dynSchema,
      steps: [{
        ...dynSchema.steps[0],
        fields: [{
          id: "role",
          type: "text",
          label: "Role",
          dynamicDefault: [{
            when: {
              combinator: "and",
              rules: [{ field: "$ext.isPremium", operator: "equals", value: true }],
            },
            value: "vip",
          }],
        }],
      }],
    };
    const tree = resolveTree(extSchema, {}, { isPremium: true });
    expect(tree.steps[0].fields[0].resolvedDefaultValue).toBe("vip");

    const tree2 = resolveTree(extSchema, {}, { isPremium: false });
    expect(tree2.steps[0].fields[0].resolvedDefaultValue).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// resolveTree — skippedSteps
// ---------------------------------------------------------------------------

describe("resolveTree — skippedSteps", () => {
  const skippableSchema: WaypointSchema = {
    version: "1",
    id: "skip-test",
    name: "Skip Test",
    steps: [
      {
        id: "step1",
        title: "Step 1",
        url: "/step1",
        skippable: true,
        fields: [{ id: "name", type: "text", label: "Name" }],
      },
      {
        id: "step2",
        title: "Step 2 (conditional on step1 skipped)",
        url: "/step2",
        visibleWhen: {
          combinator: "and",
          rules: [{ field: "$step.step1.skipped", operator: "equals", value: true }],
        },
        fields: [{ id: "alt", type: "text", label: "Alt" }],
      },
      {
        id: "step3",
        title: "Step 3",
        url: "/step3",
        fields: [],
      },
    ],
  };

  it("step2 is hidden when step1 is not skipped", () => {
    const tree = resolveTree(skippableSchema, {}, emptyVars, undefined, []);
    const visibleIds = tree.steps.map((s) => s.definition.id);
    expect(visibleIds).toContain("step1");
    expect(visibleIds).not.toContain("step2");
    expect(visibleIds).toContain("step3");
  });

  it("step2 becomes visible when step1 is skipped", () => {
    const tree = resolveTree(skippableSchema, {}, emptyVars, undefined, ["step1"]);
    const visibleIds = tree.steps.map((s) => s.definition.id);
    expect(visibleIds).toContain("step1");
    expect(visibleIds).toContain("step2");
    expect(visibleIds).toContain("step3");
  });
});
