import { describe, expect, it } from "vitest";

import { URLTemplateEngine } from "../url";

describe("URLTemplateEngine.format", () => {
  it("replaces a single placeholder", () => {
    expect(
      URLTemplateEngine.format("/simulation/{{CONTRACT_KIND}}/details", {
        CONTRACT_KIND: "PER",
      })
    ).toBe("/simulation/PER/details");
  });

  it("replaces multiple placeholders", () => {
    expect(
      URLTemplateEngine.format(
        "/simulation/{{CONTRACT_KIND}}/{{CONTRACT_KIND_ID}}/result/{{SIMULATION_UID}}",
        { CONTRACT_KIND: "ASV", CONTRACT_KIND_ID: 2, SIMULATION_UID: "abc123" }
      )
    ).toBe("/simulation/ASV/2/result/abc123");
  });

  it("leaves missing placeholders as-is", () => {
    expect(
      URLTemplateEngine.format(
        "/simulation/{{CONTRACT_KIND}}/{{MISSING_PARAM}}/details",
        { CONTRACT_KIND: "PER" }
      )
    ).toBe("/simulation/PER/{{MISSING_PARAM}}/details");
  });

  it("handles number parameters", () => {
    expect(
      URLTemplateEngine.format(
        "/contract/{{CONTRACT_KIND_ID}}/user/{{USER_ID}}",
        { CONTRACT_KIND_ID: 42, USER_ID: 123 }
      )
    ).toBe("/contract/42/user/123");
  });

  it("replaces empty string but leaves undefined as placeholder", () => {
    expect(
      URLTemplateEngine.format("/test/{{EMPTY}}/{{NULL}}/{{UNDEFINED}}", {
        EMPTY: "",
        NULL: undefined,
        UNDEFINED: undefined,
      })
    ).toBe("/test//{{NULL}}/{{UNDEFINED}}");
  });
});

describe("URLTemplateEngine.extractPlaceholders", () => {
  it("extracts all placeholder names", () => {
    expect(
      URLTemplateEngine.extractPlaceholders(
        "/simulation/{{CONTRACT_KIND}}/{{CONTRACT_KIND_ID}}/result/{{SIMULATION_UID}}"
      )
    ).toEqual(["CONTRACT_KIND", "CONTRACT_KIND_ID", "SIMULATION_UID"]);
  });

  it("returns empty array for static URLs", () => {
    expect(
      URLTemplateEngine.extractPlaceholders("/static/path/without/placeholders")
    ).toEqual([]);
  });

  it("includes duplicates", () => {
    expect(
      URLTemplateEngine.extractPlaceholders(
        "/{{TYPE}}/details/{{TYPE}}/summary"
      )
    ).toEqual(["TYPE", "TYPE"]);
  });
});

describe("URLTemplateEngine.validate", () => {
  it("returns valid when all params provided", () => {
    const { isValid, missingParams } = URLTemplateEngine.validate(
      "/simulation/{{CONTRACT_KIND}}/{{SIMULATION_UID}}",
      { CONTRACT_KIND: "PER", SIMULATION_UID: "abc123" }
    );
    expect(isValid).toBe(true);
    expect(missingParams).toEqual([]);
  });

  it("detects missing parameters", () => {
    const { isValid, missingParams } = URLTemplateEngine.validate(
      "/simulation/{{CONTRACT_KIND}}/{{CONTRACT_KIND_ID}}/{{SIMULATION_UID}}",
      { CONTRACT_KIND: "PER" }
    );
    expect(isValid).toBe(false);
    expect(missingParams).toEqual(["CONTRACT_KIND_ID", "SIMULATION_UID"]);
  });

  it("ignores extra parameters", () => {
    const { isValid, missingParams } = URLTemplateEngine.validate(
      "/simulation/{{CONTRACT_KIND}}",
      { CONTRACT_KIND: "PER", EXTRA: "extra", ANOTHER: 123 }
    );
    expect(isValid).toBe(true);
    expect(missingParams).toEqual([]);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("URLTemplateEngine edge cases", () => {
  it("ignores malformed single-brace placeholders", () => {
    expect(
      URLTemplateEngine.format(
        "/test/{SINGLE_BRACE}/{{NORMAL}}/{{INCOMPLETE",
        { SINGLE_BRACE: "single", NORMAL: "normal", INCOMPLETE: "incomplete" }
      )
    ).toBe("/test/{SINGLE_BRACE}/normal/{{INCOMPLETE");
  });

  it("handles special characters in values", () => {
    expect(
      URLTemplateEngine.format("/search/{{QUERY}}/{{FILTER}}", {
        QUERY: "hello world & special chars!",
        FILTER: "type=PER&status=active",
      })
    ).toBe("/search/hello world & special chars!/type=PER&status=active");
  });

  it("does not recursively replace nested-looking values", () => {
    expect(
      URLTemplateEngine.format("/template/{{VALUE}}", {
        VALUE: "contains {{NESTED}} placeholder",
      })
    ).toBe("/template/contains {{NESTED}} placeholder");
  });
});

// ── Performance ───────────────────────────────────────────────────────────────

describe("URLTemplateEngine performance", () => {
  it("handles 100 replacements in under 10ms", () => {
    const template = Array.from({ length: 100 }, (_, i) => `{{PARAM_${i}}}`).join("/");
    const params = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`PARAM_${i}`, `value_${i}`])
    );

    const start = performance.now();
    const result = URLTemplateEngine.format(template, params);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
    expect(result).toBe(
      Array.from({ length: 100 }, (_, i) => `value_${i}`).join("/")
    );
  });
});
