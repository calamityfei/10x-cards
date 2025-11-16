import { test, expect } from "@playwright/test";
import { LoginPage, CreateFlashcardsPage, MyFlashcardsPage } from "../pages";

const TEST_EMAIL = process.env.E2E_USERNAME || "";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "";

test.describe("Manual Flashcard Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await expect(page).toHaveURL("/my-flashcards");
  });

  test("should create flashcard manually", async ({ page }) => {
    const createPage = new CreateFlashcardsPage(page);
    const myFlashcardsPage = new MyFlashcardsPage(page);

    await createPage.navigate();
    await createPage.clickManualAdd();

    await createPage.fillCardModal("What is TypeScript?", "TypeScript is a typed superset of JavaScript");

    const candidateCount = await createPage.getCandidateCount();
    expect(candidateCount).toBe(1);

    await createPage.clickSaveAll();
    await page.waitForSelector('[data-testid="save-all-button"]', { state: "hidden", timeout: 60000 });

    await myFlashcardsPage.navigate();
    const flashcardCount = await myFlashcardsPage.getFlashcardCount();
    expect(flashcardCount).toBeGreaterThanOrEqual(1);
  });
});
