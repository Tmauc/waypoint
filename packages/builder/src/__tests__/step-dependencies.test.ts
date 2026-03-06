import { describe, expect, it } from "vitest";
import type { WaypointSchema } from "@waypoint/core";
import {
  computeStepDependencies,
  getStepDependencyLabels,
  isFieldMoveValid,
  isMoveValid,
} from "../utils/step-dependencies";

const makeSchema = (overrides?: Partial<WaypointSchema>): WaypointSchema => ({
  version: "1",
  id: "test",
  name: "Test",
  steps: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// computeStepDependencies
// ---------------------------------------------------------------------------

describe("computeStepDependencies", () => {
  it("returns empty deps when no dependencies defined", () => {
    const schema = makeSchema({
      steps: [
        { id: "s1", title: "S1", url: "/s1", fields: [] },
        { id: "s2", title: "S2", url: "/s2", fields: [] },
      ],
    });
    const deps = computeStepDependencies(schema);
    expect(deps.get("s1")?.size).toBe(0);
    expect(deps.get("s2")?.size).toBe(0);
  });

  it("detects dependency via field dependsOn", () => {
    const schema = makeSchema({
      steps: [
        {
          id: "personal", title: "Personal", url: "/personal",
          fields: [{ id: "age", type: "number", label: "Age" }],
        },
        {
          id: "education", title: "Education", url: "/education",
          fields: [{
            id: "level", type: "select", label: "Level",
            dependsOn: ["personal.age"],
          }],
        },
      ],
    });
    const deps = computeStepDependencies(schema);
    expect(deps.get("education")?.has("personal")).toBe(true);
    expect(deps.get("personal")?.size).toBe(0);
  });

  it("ignores $ext paths in dependsOn", () => {
    const schema = makeSchema({
      steps: [{
        id: "s1", title: "S1", url: "/s1",
        fields: [{ id: "f1", type: "text", label: "F1", dependsOn: ["$ext.isPremium"] }],
      }],
    });
    const deps = computeStepDependencies(schema);
    expect(deps.get("s1")?.size).toBe(0);
  });

  it("ignores self-references in dependsOn", () => {
    const schema = makeSchema({
      steps: [{
        id: "s1", title: "S1", url: "/s1",
        fields: [{ id: "f2", type: "text", label: "F2", dependsOn: ["s1.f1"] }],
      }],
    });
    const deps = computeStepDependencies(schema);
    expect(deps.get("s1")?.size).toBe(0);
  });

  it("detects dependency via step visibleWhen condition", () => {
    const schema = makeSchema({
      steps: [
        { id: "s1", title: "S1", url: "/s1", fields: [] },
        {
          id: "s2", title: "S2", url: "/s2", fields: [],
          visibleWhen: {
            combinator: "and",
            rules: [{ field: "s1.age", operator: "greaterThan", value: 18 }],
          },
        },
      ],
    });
    const deps = computeStepDependencies(schema);
    expect(deps.get("s2")?.has("s1")).toBe(true);
  });

  it("detects dependency via field visibleWhen condition", () => {
    const schema = makeSchema({
      steps: [
        { id: "s1", title: "S1", url: "/s1", fields: [{ id: "age", type: "number", label: "Age" }] },
        {
          id: "s2", title: "S2", url: "/s2",
          fields: [{
            id: "f1", type: "text", label: "F1",
            visibleWhen: {
              combinator: "and",
              rules: [{ field: "s1.age", operator: "greaterThan", value: 18 }],
            },
          }],
        },
      ],
    });
    const deps = computeStepDependencies(schema);
    expect(deps.get("s2")?.has("s1")).toBe(true);
  });

  it("detects multiple dependencies", () => {
    const schema = makeSchema({
      steps: [
        { id: "s1", title: "S1", url: "/s1", fields: [{ id: "a", type: "text", label: "A" }] },
        { id: "s2", title: "S2", url: "/s2", fields: [{ id: "b", type: "text", label: "B" }] },
        {
          id: "s3", title: "S3", url: "/s3",
          fields: [{
            id: "c", type: "text", label: "C",
            dependsOn: ["s1.a", "s2.b"],
          }],
        },
      ],
    });
    const deps = computeStepDependencies(schema);
    expect(deps.get("s3")?.has("s1")).toBe(true);
    expect(deps.get("s3")?.has("s2")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isMoveValid
// ---------------------------------------------------------------------------

describe("isMoveValid", () => {
  const steps = [
    { id: "s1", title: "Personal", url: "/s1", fields: [] },
    { id: "s2", title: "Education", url: "/s2", fields: [] },
    { id: "s3", title: "Billing", url: "/s3", fields: [] },
  ];

  it("allows moving when no dependencies", () => {
    const deps = new Map([
      ["s1", new Set<string>()],
      ["s2", new Set<string>()],
      ["s3", new Set<string>()],
    ]);
    expect(isMoveValid(steps, deps, 0, 2).valid).toBe(true);
    expect(isMoveValid(steps, deps, 2, 0).valid).toBe(true);
  });

  it("blocks moving a step before its dependency", () => {
    // s2 depends on s1
    const deps = new Map([
      ["s1", new Set<string>()],
      ["s2", new Set(["s1"])],
      ["s3", new Set<string>()],
    ]);
    // Moving s2 (index 1) to index 0 would place it before s1 — invalid
    const result = isMoveValid(steps, deps, 1, 0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Education");
    expect(result.reason).toContain("Personal");
  });

  it("blocks moving a dependency after the step that needs it", () => {
    // s2 depends on s1 → can't move s1 after s2
    const deps = new Map([
      ["s1", new Set<string>()],
      ["s2", new Set(["s1"])],
      ["s3", new Set<string>()],
    ]);
    // Moving s1 (index 0) to index 1 (after s2 at 0 in new order) — invalid
    const result = isMoveValid(steps, deps, 0, 2);
    expect(result.valid).toBe(false);
  });

  it("allows moving unrelated step freely", () => {
    const deps = new Map([
      ["s1", new Set<string>()],
      ["s2", new Set(["s1"])],
      ["s3", new Set<string>()],
    ]);
    // s3 has no deps — can move freely
    expect(isMoveValid(steps, deps, 2, 1).valid).toBe(true);
  });

  it("same index is always valid", () => {
    const deps = new Map([["s1", new Set<string>(["s2"])]]);
    expect(isMoveValid(steps, deps, 1, 1).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isFieldMoveValid
// ---------------------------------------------------------------------------

describe("isFieldMoveValid", () => {
  const fields = [
    { id: "age", type: "number", label: "Age" },
    { id: "level", type: "select", label: "Level", dependsOn: ["personal.age"] },
    { id: "notes", type: "text", label: "Notes" },
  ] as const;

  it("allows moving when no intra-step deps affected", () => {
    expect(isFieldMoveValid(fields as any, "personal", 2, 0).valid).toBe(true);
  });

  it("blocks moving a field above its intra-step dependency", () => {
    // level (index 1) depends on age (index 0) — can't move level above age
    const result = isFieldMoveValid(fields as any, "personal", 1, 0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Level");
    expect(result.reason).toContain("Age");
  });

  it("blocks moving a dependency below the field that needs it", () => {
    // age (index 0) can't go after level (index 1) which depends on it
    const result = isFieldMoveValid(fields as any, "personal", 0, 1);
    expect(result.valid).toBe(false);
  });

  it("ignores cross-step deps", () => {
    const f = [
      { id: "f1", type: "text", label: "F1", dependsOn: ["other.x"] },
      { id: "f2", type: "text", label: "F2" },
    ];
    // cross-step dep should not block intra-step reorder
    expect(isFieldMoveValid(f as any, "current", 0, 1).valid).toBe(true);
  });

  it("allows moving unrelated field freely", () => {
    expect(isFieldMoveValid(fields as any, "personal", 2, 1).valid).toBe(true);
  });

  it("same index is always valid", () => {
    expect(isFieldMoveValid(fields as any, "personal", 1, 1).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getStepDependencyLabels
// ---------------------------------------------------------------------------

describe("getStepDependencyLabels", () => {
  it("returns human-readable titles", () => {
    const schema = makeSchema({
      steps: [
        { id: "personal", title: "Personal Info", url: "/p", fields: [] },
        { id: "education", title: "Education", url: "/e", fields: [] },
      ],
    });
    const deps = new Map([["education", new Set(["personal"])]]);
    const labels = getStepDependencyLabels("education", deps, schema);
    expect(labels).toContain("Personal Info");
  });

  it("returns empty array when no deps", () => {
    const schema = makeSchema({ steps: [{ id: "s1", title: "S1", url: "/", fields: [] }] });
    const deps = new Map([["s1", new Set<string>()]]);
    expect(getStepDependencyLabels("s1", deps, schema)).toHaveLength(0);
  });
});
