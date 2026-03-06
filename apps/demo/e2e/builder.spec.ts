import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoBuilder(page: Page) {
  await page.goto("/builder");
  await expect(page.getByText("Steps (0)")).toBeVisible();
}

/** Click a step card in the StepList by its exact title */
async function clickStep(page: Page, title: string) {
  // Step cards are clickable divs in the list column.
  // We filter by text to avoid matching similar text in other columns.
  await page.locator("div").filter({ hasText: new RegExp(`^${title}$`) }).first().click();
}

/** Click a field card in the FieldList by its exact label */
async function clickField(page: Page, label: string) {
  await page.locator("span").filter({ hasText: new RegExp(`^${label}$`) }).first().click();
}

// ---------------------------------------------------------------------------
// 1. Page load & initial state
// ---------------------------------------------------------------------------

test.describe("Initial state", () => {
  test("redirects / to /builder", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/builder/);
  });

  test("renders the builder with empty state", async ({ page }) => {
    await gotoBuilder(page);
    await expect(page.getByText("Steps (0)")).toBeVisible();
    await expect(page.getByText("No steps yet")).toBeVisible();
    // Logo in nav
    await expect(page.getByRole("navigation").getByText("◈ waypoint")).toBeVisible();
    // Logo in toolbar (dark bar)
    await expect(page.getByRole("main").getByText("◈ waypoint")).toBeVisible();
  });

  test("examples bar is visible with 4 examples", async ({ page }) => {
    await gotoBuilder(page);
    await expect(page.getByText("User Onboarding")).toBeVisible();
    await expect(page.getByText("Insurance Quote")).toBeVisible();
    await expect(page.getByText("Loan Application")).toBeVisible();
    await expect(page.getByText("E-commerce Checkout")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Load an example schema
// ---------------------------------------------------------------------------

test.describe("Load example schema", () => {
  test("loads User Onboarding example", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
    await expect(page.getByText("Account").first()).toBeVisible();
    await expect(page.getByText("Profile").first()).toBeVisible();
    await expect(page.getByText("Preferences").first()).toBeVisible();
  });

  test("shows conditional badge on step with visibleWhen", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await expect(page.getByText("conditional").first()).toBeVisible();
  });

  test("loads Insurance Quote example with external variable", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /Insurance Quote/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
    await expect(page.getByText("$ext.customerId")).toBeVisible();
  });

  test("switching examples resets the schema", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
    await page.getByRole("button", { name: /E-commerce Checkout/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
    await expect(page.getByText("Shipping address").first()).toBeVisible();
    await expect(page.getByText("Account")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Step management
// ---------------------------------------------------------------------------

test.describe("Step management", () => {
  test("adds a new step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: "+ Add step" }).click();
    await expect(page.getByText("Steps (1)")).toBeVisible();
  });

  test("selects a step and shows its config", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Account");
    await expect(page.getByText("Step Config")).toBeVisible();
    await expect(page.getByText("id: account")).toBeVisible();
  });

  test("edits step title inline via StepEditor", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: "+ Add step" }).click();
    // New step is auto-selected — use placeholder to target step title input
    const titleInput = page.getByPlaceholder("Step title");
    await titleInput.clear();
    await titleInput.fill("My Custom Step");
    await expect(page.getByText("My Custom Step").first()).toBeVisible();
  });

  test("removes a step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
    await page.getByTitle("Remove step").first().click();
    await expect(page.getByText("Steps (3)")).toBeVisible();
  });

  test("marks schema as dirty after adding a step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: "+ Add step" }).click();
    await expect(page.locator("[title='Unsaved changes']")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Field management
// ---------------------------------------------------------------------------

test.describe("Field management", () => {
  test("shows fields when a step is selected", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Account");
    await expect(page.getByText("2 fields").first()).toBeVisible();
    await expect(page.getByText("Email address").first()).toBeVisible();
    await expect(page.getByText("Password", { exact: true }).first()).toBeVisible();
  });

  test("adds a new field to a step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Account");
    await expect(page.getByText("2 fields").first()).toBeVisible();
    await page.getByRole("button", { name: "+ Add field" }).click();
    await expect(page.getByText("3 fields").first()).toBeVisible();
  });

  test("selects a field and shows the field editor", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Account");
    await clickField(page, "Email address");
    await expect(page.getByText("Field Editor")).toBeVisible();
  });

  test("shows required badge on fields with required validation", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Account");
    await expect(page.getByText("required").first()).toBeVisible();
  });

  test("removes a field", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Account");
    await expect(page.getByText("2 fields").first()).toBeVisible();
    await page.getByTitle("Remove field").first().click();
    await expect(page.getByText("1 field").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Step dependency enforcement
// ---------------------------------------------------------------------------

test.describe("Step dependency enforcement", () => {
  test("shows 'needs' badge on dependent step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await expect(page.getByText("needs:")).toBeVisible();
  });

  test("blocked ↑ button has cant-move title on dependent step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    // Company (index 2) depends on Profile — its ↑ button that would move it before Profile is blocked
    await expect(page.getByTitle(/Can't move up/).first()).toBeVisible();
  });

  test("no error banner on load", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /Loan Application/ }).click();
    await expect(page.getByText("⚠")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Conditions
// ---------------------------------------------------------------------------

test.describe("Conditions", () => {
  test("shows condition summary on a conditional step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Company");
    await expect(page.getByText("Step Config")).toBeVisible();
    await expect(page.getByText(/1 rule.*AND/i)).toBeVisible();
  });

  test("opens condition modal when clicking Edit", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Company");
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByText(/Condition — "Company"/)).toBeVisible();
    await expect(page.getByText("+ Add rule")).toBeVisible();
  });

  test("closes condition modal with Done button", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Company");
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByText(/Condition — "Company"/)).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText(/Condition — "Company"/)).not.toBeVisible();
  });

  test("closes condition modal with Escape key", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Company");
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByText(/Condition — "Company"/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText(/Condition — "Company"/)).not.toBeVisible();
  });

  test("adds a condition rule to a new step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: "+ Add step" }).click();
    // New step is auto-selected
    await page.getByRole("button", { name: "Add condition" }).click();
    await expect(page.getByText(/Condition — "New Step"/)).toBeVisible();
    await page.getByRole("button", { name: "+ Add rule" }).click();
    await page.getByRole("button", { name: "Done" }).click();
    // Step should now show conditional badge
    await expect(page.getByText("conditional").first()).toBeVisible();
  });

  test("clears a condition from a step", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await clickStep(page, "Company");
    await expect(page.getByText(/1 rule.*AND/i)).toBeVisible();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("Always visible")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. External variables panel
// ---------------------------------------------------------------------------

test.describe("External variables panel", () => {
  test("shows declared variables from loaded example", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /Insurance Quote/ }).click();
    await expect(page.getByText("$ext.customerId")).toBeVisible();
    await expect(page.getByText("string").first()).toBeVisible();
    await expect(page.getByText("blocking")).toBeVisible();
  });

  test("adds a new external variable", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByTitle("Add external variable").click();
    await page.getByPlaceholder("e.g. userId").fill("tenantId");
    await page.getByPlaceholder("Human-readable description").fill("Tenant identifier");
    await page.getByRole("button", { name: "Add" }).last().click();
    await expect(page.getByText("$ext.tenantId")).toBeVisible();
    await expect(page.getByText("Tenant identifier")).toBeVisible();
  });

  test("validates empty id", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByTitle("Add external variable").click();
    await page.getByRole("button", { name: "Add" }).last().click();
    await expect(page.getByText("ID is required")).toBeVisible();
  });

  test("validates duplicate variable id", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /Insurance Quote/ }).click();
    await page.getByTitle("Add external variable").click();
    await page.getByPlaceholder("e.g. userId").fill("customerId");
    await page.getByPlaceholder("Human-readable description").fill("Duplicate");
    await page.getByRole("button", { name: "Add" }).last().click();
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test("cancels the add form", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByTitle("Add external variable").click();
    await expect(page.getByPlaceholder("e.g. userId")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByPlaceholder("e.g. userId")).not.toBeVisible();
  });

  test("removes an external variable", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /Insurance Quote/ }).click();
    await expect(page.getByText("$ext.customerId")).toBeVisible();
    await page.getByTitle("Remove variable").click();
    await expect(page.getByText("$ext.customerId")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Export / Import JSON round-trip
// ---------------------------------------------------------------------------

test.describe("Export / Import JSON", () => {
  test("export triggers a download with correct filename", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export JSON" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("onboarding.waypoint.json");
  });

  test("import round-trip: export → reset → import restores schema", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /E-commerce Checkout/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();

    // Export
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export JSON" }).click(),
    ]);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const json = Buffer.concat(chunks).toString();
    const schema = JSON.parse(json);

    expect(schema.version).toBe("1");
    expect(schema.id).toBe("checkout");
    expect(schema.steps).toHaveLength(4);

    // Reset
    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Steps (0)")).toBeVisible();

    // Re-import
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Import" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "checkout.waypoint.json",
      mimeType: "application/json",
      buffer: Buffer.from(json),
    });

    await expect(page.getByText("Steps (4)")).toBeVisible();
    await expect(page.getByText("Shipping address").first()).toBeVisible();
  });

  test("import rejects malformed JSON", async ({ page }) => {
    await gotoBuilder(page);
    page.on("dialog", async (d) => {
      expect(d.message()).toContain("Invalid");
      await d.accept();
    });

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Import" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ not valid json }"),
    });
  });

  test("import rejects schema with unsupported version", async ({ page }) => {
    await gotoBuilder(page);
    page.on("dialog", async (d) => {
      expect(d.message()).toContain("Invalid schema");
      expect(d.message()).toContain("version");
      await d.accept();
    });

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Import" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "bad-version.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ version: "99", id: "x", name: "X", steps: [] })),
    });
  });
});

// ---------------------------------------------------------------------------
// 9. Toolbar
// ---------------------------------------------------------------------------

test.describe("Toolbar", () => {
  test("edits the journey name inline", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    const nameInput = page.getByPlaceholder("Journey name");
    await nameInput.clear();
    await nameInput.fill("My Journey");
    await expect(page.getByPlaceholder("Journey name")).toHaveValue("My Journey");
    // Dirty dot should appear
    await expect(page.locator("[title='Unsaved changes']")).toBeVisible();
  });

  test("Save button triggers onSave callback", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    page.on("dialog", async (d) => {
      expect(d.message()).toContain("console");
      await d.accept();
    });
    await page.getByRole("button", { name: "Save" }).click();
  });

  test("Reset button clears the schema after confirmation", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Steps (0)")).toBeVisible();
  });

  test("Reset button does nothing if cancelled", async ({ page }) => {
    await gotoBuilder(page);
    await page.getByRole("button", { name: /User Onboarding/ }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
    page.on("dialog", (d) => d.dismiss());
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Steps (4)")).toBeVisible();
  });
});
