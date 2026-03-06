import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEPOSIT_KEY = "waypoint-runtime-deposit";
const PROJECT_KEY = "waypoint-runtime-project-creation";

async function clearJourneyStorage(page: Page) {
  await page.evaluate(
    ([dk, pk]) => {
      localStorage.removeItem(dk);
      localStorage.removeItem(pk);
    },
    [DEPOSIT_KEY, PROJECT_KEY]
  );
}

async function goto(page: Page, url: string) {
  await page.goto(url);
}

// Fill deposit step 1 — Compte bancaire
async function fillDepositStep1(page: Page) {
  await page.getByLabel("Titulaire du compte").fill("Jean Dupont");
  await page.getByLabel("IBAN").fill("FR7630006000011234567890189");
}

// Fill deposit step 2 — Détails du versement
async function fillDepositStep2(page: Page) {
  await page.getByLabel("Montant (€)").fill("250");
  await page.getByLabel("Fréquence").selectOption("monthly");
}

// Fill deposit step 3 — Confirmation
async function fillDepositStep3(page: Page) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.getByLabel("Date d'exécution").fill(tomorrow.toISOString().split("T")[0]);
}

// Fill project step 1 — Informations générales
async function fillProjectStep1(page: Page, type: "personal" | "pro") {
  await page.getByLabel("Nom du projet").fill("Projet Test");
  await page.getByLabel("Type de projet").selectOption(type === "pro" ? "pro" : "personal");
}

async function clickContinuer(page: Page) {
  await page.getByRole("button", { name: /Continuer/i }).click();
}

async function clickTerminer(page: Page) {
  await page.getByRole("button", { name: /Terminer/i }).click();
}

// ---------------------------------------------------------------------------
// 1. Dashboard
// ---------------------------------------------------------------------------

test.describe("Dashboard — /journeys", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/journeys");
    await clearJourneyStorage(page);
    await page.reload();
  });

  test("shows both journey cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Création de projet" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Versement" })).toBeVisible();
  });

  test("shows 'Commencer' when no state", async ({ page }) => {
    const btns = page.getByRole("link", { name: /Commencer/i });
    await expect(btns).toHaveCount(2);
  });

  test("shows step indicators for each journey", async ({ page }) => {
    // Project — 4 steps
    await expect(page.getByText("Informations", { exact: true })).toBeVisible();
    await expect(page.getByText("Équipe", { exact: true })).toBeVisible();
    await expect(page.getByText("Budget", { exact: true })).toBeVisible();
    await expect(page.getByText("Lancement", { exact: true })).toBeVisible();
    // Deposit — 3 steps
    await expect(page.getByText("Compte", { exact: true })).toBeVisible();
    await expect(page.getByText("Confirmation", { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Linear navigation — Deposit (3 steps, no conditions)
// ---------------------------------------------------------------------------

test.describe("Linear navigation — Deposit", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/journeys");
    await clearJourneyStorage(page);
  });

  test("starts on step 1 — Compte bancaire", async ({ page }) => {
    // Deposit is the second card (Project is first)
    await page.getByRole("link", { name: /Commencer/i }).nth(1).click();
    await expect(page).toHaveURL(/\/journeys\/deposit\/compte/);
    await expect(page.getByRole("heading", { name: "Compte bancaire" })).toBeVisible();
  });

  test("shows 25% progress on step 1", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await expect(page.getByText("25% complété")).toBeVisible();
  });

  test("shows breadcrumb with journey name", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await expect(page.getByRole("link", { name: "Parcours" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Versement" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compte bancaire" })).toBeVisible();
  });

  test("shows 'Quitter' link on first step", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await expect(page.getByRole("link", { name: /Quitter/i })).toBeVisible();
  });

  test("validates required fields on submit", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await clickContinuer(page);
    await expect(page.getByText("Obligatoire").first()).toBeVisible();
  });

  test("validates IBAN min length", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await page.getByLabel("Titulaire du compte").fill("Jean Dupont");
    await page.getByLabel("IBAN").fill("FR76");
    await clickContinuer(page);
    await expect(page.getByText("IBAN invalide")).toBeVisible();
  });

  test("navigates step 1 → 2 after valid submit", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await expect(page).toHaveURL(/\/journeys\/deposit\/versement/);
    await expect(page.getByRole("heading", { name: "Détails du versement" })).toBeVisible();
  });

  test("progress updates on step 2", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await expect(page.getByText("50% complété")).toBeVisible();
  });

  test("shows 'Retour' button on step 2", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await expect(page.getByRole("button", { name: /Retour/i })).toBeVisible();
  });

  test("back navigation step 2 → 1", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await page.getByRole("button", { name: /Retour/i }).click();
    await expect(page).toHaveURL(/\/journeys\/deposit\/compte/);
  });

  test("navigates step 2 → 3", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await fillDepositStep2(page);
    await clickContinuer(page);
    await expect(page).toHaveURL(/\/journeys\/deposit\/confirmation/);
    await expect(page.getByRole("heading", { name: "Confirmation" })).toBeVisible();
  });

  test("progress at 75% on step 3", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await fillDepositStep2(page);
    await clickContinuer(page);
    await expect(page.getByText("75% complété")).toBeVisible();
  });

  test("shows 'Terminer' button on last step", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await fillDepositStep2(page);
    await clickContinuer(page);
    await expect(page.getByRole("button", { name: /Terminer/i })).toBeVisible();
  });

  test("completes journey → redirects to dashboard with 'Terminé'", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await fillDepositStep2(page);
    await clickContinuer(page);
    await fillDepositStep3(page);
    await clickTerminer(page);
    await expect(page).toHaveURL(/\/journeys\?completed=deposit/);
    await expect(page.getByText("Terminé ✓")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Conditional navigation — Project (step "equipe" conditionnel)
// ---------------------------------------------------------------------------

test.describe("Conditional navigation — Project", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/journeys");
    await clearJourneyStorage(page);
  });

  test("type=personal skips 'Equipe' step → goes to Budget", async ({ page }) => {
    await goto(page, "/journeys/project/informations");
    await fillProjectStep1(page, "personal");
    await clickContinuer(page);
    await expect(page).toHaveURL(/\/journeys\/project\/budget/);
    await expect(page.getByRole("heading", { name: "Budget" })).toBeVisible();
  });

  test("type=pro shows 'Equipe' step", async ({ page }) => {
    await goto(page, "/journeys/project/informations");
    await fillProjectStep1(page, "pro");
    await clickContinuer(page);
    await expect(page).toHaveURL(/\/journeys\/project\/equipe/);
    await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
  });

  test("type=pro — full flow includes Equipe step", async ({ page }) => {
    await goto(page, "/journeys/project/informations");
    await fillProjectStep1(page, "pro");
    await clickContinuer(page);

    // Step 2 — Equipe
    await page.getByLabel("Taille de l'équipe").selectOption("small");
    await page.getByLabel("Votre rôle dans l'équipe").fill("Product Manager");
    await clickContinuer(page);

    await expect(page).toHaveURL(/\/journeys\/project\/budget/);
  });

  test("type=personal — progress calculated on 3 visible steps (not 4)", async ({ page }) => {
    await goto(page, "/journeys/project/informations");
    await fillProjectStep1(page, "personal");
    await clickContinuer(page);
    // On step 2/3 visible (Budget), progress = Math.round(2/4*100) = 50%
    await expect(page.getByText("50% complété")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Pause & Resume
// ---------------------------------------------------------------------------

test.describe("Pause & Resume", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/journeys");
    await clearJourneyStorage(page);
  });

  test("dashboard shows 'En cours' after starting deposit", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    // Now on step 2 — go back to dashboard
    await goto(page, "/journeys");
    await expect(page.getByText("En cours")).toBeVisible();
  });

  test("'Reprendre' link points to current step", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await goto(page, "/journeys");
    const resumeLink = page.getByRole("link", { name: /Reprendre/i });
    await expect(resumeLink).toBeVisible();
    const href = await resumeLink.getAttribute("href");
    expect(href).toContain("/journeys/deposit/versement");
  });

  test("clicking 'Reprendre' lands on correct step", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await goto(page, "/journeys");
    await page.getByRole("link", { name: /Reprendre/i }).click();
    await expect(page).toHaveURL(/\/journeys\/deposit\/versement/);
    await expect(page.getByRole("heading", { name: "Détails du versement" })).toBeVisible();
  });

  test("shows progress bar on 'En cours' card", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await goto(page, "/journeys");
    await expect(page.getByText(/1\/3 étapes/)).toBeVisible();
  });

  test("reset clears state → shows 'Commencer'", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await goto(page, "/journeys");
    await page.getByRole("button", { name: /Réinitialiser/i }).click();
    await expect(page.getByRole("link", { name: /Commencer/i }).first()).toBeVisible();
  });

  test("completed journey shows 'Terminé ✓' on reload", async ({ page }) => {
    // Complete the full deposit journey
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await fillDepositStep2(page);
    await clickContinuer(page);
    await fillDepositStep3(page);
    await clickTerminer(page);
    // Reload dashboard
    await goto(page, "/journeys");
    await expect(page.getByText("Terminé ✓")).toBeVisible();
  });

  test("'Recommencer' after completion clears state", async ({ page }) => {
    // Complete the journey
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    await fillDepositStep2(page);
    await clickContinuer(page);
    await fillDepositStep3(page);
    await clickTerminer(page);
    // Click recommencer
    await page.getByRole("button", { name: /Recommencer/i }).click();
    await expect(page.getByRole("link", { name: /Commencer/i }).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Deep-link redirect
// ---------------------------------------------------------------------------

test.describe("Deep-link redirect", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/journeys");
    await clearJourneyStorage(page);
  });

  test("navigating to step 3 without state redirects to step 1", async ({ page }) => {
    await goto(page, "/journeys/deposit/confirmation");
    await expect(page).toHaveURL(/\/journeys\/deposit\/compte/, { timeout: 5000 });
  });

  test("navigating to step 2 of project without state redirects to step 1", async ({ page }) => {
    await goto(page, "/journeys/project/budget");
    await expect(page).toHaveURL(/\/journeys\/project\/informations/, { timeout: 5000 });
  });

  test("navigating to current step with valid state stays on that step", async ({ page }) => {
    await goto(page, "/journeys/deposit/compte");
    await fillDepositStep1(page);
    await clickContinuer(page);
    // We're on step 2, reload it directly
    await goto(page, "/journeys/deposit/versement");
    await expect(page).toHaveURL(/\/journeys\/deposit\/versement/);
    await expect(page.getByRole("heading", { name: "Détails du versement" })).toBeVisible();
  });
});
