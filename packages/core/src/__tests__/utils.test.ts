import { describe, expect, it } from "vitest";

import { calculateStepProgress, getFirstStepName, getStepFromTree } from "../utils";
import type { JourneyTreeType } from "../types";

const tree: JourneyTreeType = [
  {
    category: "info",
    steps: [
      { step: "personal", url: "/form/personal" },
      { step: "address", url: "/form/address" },
    ],
  },
  {
    category: "financial",
    steps: [
      { step: "income", url: "/form/income" },
      { step: "summary", url: "/form/summary" },
    ],
  },
];

describe("calculateStepProgress", () => {
  it("returns 0 for unknown step", () => {
    expect(calculateStepProgress("unknown", tree)).toBe(0);
  });

  it("calculates progress for first step", () => {
    // 4 steps total → maxStepNumber = 5 → step 0 → (1/5)*100 = 20
    expect(calculateStepProgress("personal", tree)).toBe(20);
  });

  it("calculates progress for last step", () => {
    // step index 3 → (4/5)*100 = 80
    expect(calculateStepProgress("summary", tree)).toBe(80);
  });

  it("handles empty tree", () => {
    expect(calculateStepProgress("personal", [])).toBe(0);
  });
});

describe("getFirstStepName", () => {
  it("returns the first step name", () => {
    expect(getFirstStepName(tree)).toBe("personal");
  });

  it("returns null for empty tree", () => {
    expect(getFirstStepName([])).toBeNull();
  });

  it("returns null for tree with empty first category", () => {
    expect(getFirstStepName([{ category: "empty", steps: [] }])).toBeNull();
  });
});

describe("getStepFromTree", () => {
  it("finds an existing step", () => {
    expect(getStepFromTree(tree, "income")).toEqual({
      step: "income",
      url: "/form/income",
    });
  });

  it("returns null for missing step", () => {
    expect(getStepFromTree(tree, "nonexistent")).toBeNull();
  });
});
