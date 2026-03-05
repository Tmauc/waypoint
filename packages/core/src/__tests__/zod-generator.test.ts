import { describe, it, expect, beforeEach } from "vitest";

import { buildZodSchema, registerCustomValidator } from "../zod-generator";
import type { ResolvedField } from "../tree-resolver";
import type { FieldDefinition } from "../schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeField(
  partial: Partial<FieldDefinition> & { id: string; type: FieldDefinition["type"]; label: string }
): ResolvedField {
  return {
    definition: { ...partial } as FieldDefinition,
    visible: true,
    dependenciesMet: true,
  };
}

// ---------------------------------------------------------------------------
// required
// ---------------------------------------------------------------------------

describe("required rule", () => {
  it("rejects empty string on required text field", () => {
    const schema = buildZodSchema([
      makeField({
        id: "name",
        type: "text",
        label: "Name",
        validation: [{ type: "required", message: "Name is required" }],
      }),
    ]);

    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.formErrors.fieldErrors.name?.[0]).toBe("Name is required");
    }
  });

  it("accepts non-empty string on required text field", () => {
    const schema = buildZodSchema([
      makeField({
        id: "name",
        type: "text",
        label: "Name",
        validation: [{ type: "required", message: "Required" }],
      }),
    ]);

    expect(schema.safeParse({ name: "Alice" }).success).toBe(true);
  });

  it("makes field optional when no required rule", () => {
    const schema = buildZodSchema([
      makeField({ id: "note", type: "text", label: "Note" }),
    ]);

    expect(schema.safeParse({ note: undefined }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// minLength / maxLength
// ---------------------------------------------------------------------------

describe("minLength / maxLength rules", () => {
  it("enforces minLength", () => {
    const schema = buildZodSchema([
      makeField({
        id: "pwd",
        type: "password",
        label: "Password",
        validation: [
          { type: "required", message: "Required" },
          { type: "minLength", value: "8", message: "At least 8 chars" },
        ],
      }),
    ]);

    expect(schema.safeParse({ pwd: "short" }).success).toBe(false);
    expect(schema.safeParse({ pwd: "longenough" }).success).toBe(true);
  });

  it("enforces maxLength", () => {
    const schema = buildZodSchema([
      makeField({
        id: "code",
        type: "text",
        label: "Code",
        validation: [
          { type: "required", message: "Required" },
          { type: "maxLength", value: "5", message: "Max 5 chars" },
        ],
      }),
    ]);

    expect(schema.safeParse({ code: "toolong" }).success).toBe(false);
    expect(schema.safeParse({ code: "ok" }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// email / url
// ---------------------------------------------------------------------------

describe("email rule", () => {
  it("rejects invalid email", () => {
    const schema = buildZodSchema([
      makeField({
        id: "email",
        type: "email",
        label: "Email",
        validation: [
          { type: "required", message: "Required" },
          { type: "email", message: "Invalid email" },
        ],
      }),
    ]);

    expect(schema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(schema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });
});

describe("url rule", () => {
  it("rejects invalid URL", () => {
    const schema = buildZodSchema([
      makeField({
        id: "website",
        type: "url",
        label: "Website",
        validation: [
          { type: "required", message: "Required" },
          { type: "url", message: "Invalid URL" },
        ],
      }),
    ]);

    expect(schema.safeParse({ website: "not-a-url" }).success).toBe(false);
    expect(schema.safeParse({ website: "https://example.com" }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// regex
// ---------------------------------------------------------------------------

describe("regex rule", () => {
  it("enforces regex pattern", () => {
    const schema = buildZodSchema([
      makeField({
        id: "zip",
        type: "text",
        label: "Zip code",
        validation: [
          { type: "required", message: "Required" },
          { type: "regex", value: "^\\d{5}$", message: "5 digits required" },
        ],
      }),
    ]);

    expect(schema.safeParse({ zip: "1234" }).success).toBe(false);
    expect(schema.safeParse({ zip: "12345" }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// number fields (min / max)
// ---------------------------------------------------------------------------

describe("number fields", () => {
  it("coerces string input to number", () => {
    const schema = buildZodSchema([
      makeField({
        id: "age",
        type: "number",
        label: "Age",
        validation: [{ type: "required", message: "Required" }],
      }),
    ]);

    expect(schema.safeParse({ age: "25" }).success).toBe(true);
  });

  it("enforces min", () => {
    const schema = buildZodSchema([
      makeField({
        id: "age",
        type: "number",
        label: "Age",
        validation: [
          { type: "required", message: "Required" },
          { type: "min", value: "18", message: "Must be 18 or older" },
        ],
      }),
    ]);

    expect(schema.safeParse({ age: 16 }).success).toBe(false);
    expect(schema.safeParse({ age: 18 }).success).toBe(true);
  });

  it("enforces max", () => {
    const schema = buildZodSchema([
      makeField({
        id: "score",
        type: "number",
        label: "Score",
        validation: [
          { type: "required", message: "Required" },
          { type: "max", value: "100", message: "Max 100" },
        ],
      }),
    ]);

    expect(schema.safeParse({ score: 150 }).success).toBe(false);
    expect(schema.safeParse({ score: 80 }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkbox fields
// ---------------------------------------------------------------------------

describe("checkbox fields", () => {
  it("accepts boolean value", () => {
    const schema = buildZodSchema([
      makeField({ id: "accept", type: "checkbox", label: "Accept" }),
    ]);

    expect(schema.safeParse({ accept: true }).success).toBe(true);
    expect(schema.safeParse({ accept: false }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true); // optional
  });
});

// ---------------------------------------------------------------------------
// Invisible fields excluded
// ---------------------------------------------------------------------------

describe("invisible fields", () => {
  it("excludes invisible fields from schema", () => {
    const visibleField: ResolvedField = {
      definition: {
        id: "visible",
        type: "text",
        label: "Visible",
        validation: [{ type: "required", message: "Required" }],
      },
      visible: true,
      dependenciesMet: true,
    };

    const hiddenField: ResolvedField = {
      definition: {
        id: "hidden",
        type: "text",
        label: "Hidden",
        validation: [{ type: "required", message: "Required" }],
      },
      visible: false,
      dependenciesMet: true,
    };

    const schema = buildZodSchema([visibleField, hiddenField]);

    // "hidden" is not in the schema → not validated
    expect(schema.safeParse({ visible: "value" }).success).toBe(true);
    // "visible" is required
    expect(schema.safeParse({ visible: "" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// custom validator
// ---------------------------------------------------------------------------

describe("custom validator", () => {
  beforeEach(() => {
    registerCustomValidator("noSpaces", (val) => {
      return typeof val === "string" && !val.includes(" ");
    });
  });

  it("applies custom validator", () => {
    const schema = buildZodSchema([
      makeField({
        id: "username",
        type: "text",
        label: "Username",
        validation: [
          { type: "required", message: "Required" },
          {
            type: "custom",
            customValidatorId: "noSpaces",
            message: "No spaces allowed",
          },
        ],
      }),
    ]);

    expect(schema.safeParse({ username: "valid" }).success).toBe(true);
    expect(schema.safeParse({ username: "has space" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Multiple fields
// ---------------------------------------------------------------------------

describe("multiple fields", () => {
  it("validates all fields in one schema", () => {
    const schema = buildZodSchema([
      makeField({
        id: "firstName",
        type: "text",
        label: "First name",
        validation: [{ type: "required", message: "Required" }],
      }),
      makeField({
        id: "email",
        type: "email",
        label: "Email",
        validation: [
          { type: "required", message: "Required" },
          { type: "email", message: "Invalid email" },
        ],
      }),
      makeField({ id: "bio", type: "textarea", label: "Bio" }),
    ]);

    // All valid
    expect(
      schema.safeParse({ firstName: "Alice", email: "alice@example.com" }).success
    ).toBe(true);

    // firstName missing
    const r1 = schema.safeParse({ firstName: "", email: "alice@example.com" });
    expect(r1.success).toBe(false);

    // email invalid
    const r2 = schema.safeParse({ firstName: "Alice", email: "not-email" });
    expect(r2.success).toBe(false);
  });
});
