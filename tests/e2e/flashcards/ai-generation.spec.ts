import { test, expect } from "@playwright/test";
import { LoginPage, CreateFlashcardsPage, MyFlashcardsPage } from "../pages";

const TEST_EMAIL = process.env.E2E_USERNAME || "";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "";

const SAMPLE_TEXT_1500_CHARS = `
The mitochondrion is a double-membrane-bound organelle found in most eukaryotic organisms. 
Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy. 
They were first discovered by Albert von Kölliker in 1857 in the voluntary muscles of insects.
The mitochondrion is popularly nicknamed the "powerhouse of the cell", a phrase coined by Philip Siekevitz in a 1957 article.
Mitochondria contain their own DNA, which is separate and distinct from nuclear DNA and resembles bacterial DNA.
This has led to the endosymbiotic theory, which suggests that mitochondria originated from ancient bacteria.
The number of mitochondria in a cell can vary widely by organism, tissue, and cell type.
For instance, red blood cells have no mitochondria, whereas liver cells can have more than 2000.
Mitochondria have two membranes: an outer membrane and an inner membrane with numerous folds called cristae.
The cristae increase the surface area available for chemical reactions.
The space between the two membranes is called the intermembrane space.
The inner compartment is called the mitochondrial matrix and contains enzymes for the citric acid cycle.
`.trim();

const SAMPLE_TEXT_500_CHARS =
  "This text is too short to generate flashcards. It needs to be at least 1000 characters long.";

const SAMPLE_TEXT_15000_CHARS = SAMPLE_TEXT_1500_CHARS.repeat(10);

const POETRY_TEXT = `
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate.
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.
`.trim();

test.describe("AI Flashcard Generation Flow", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await expect(page).toHaveURL("/my-flashcards");
  });

  test("should generate and save AI flashcards", async ({ page }) => {
    test.setTimeout(120000);
    const createPage = new CreateFlashcardsPage(page);
    const myFlashcardsPage = new MyFlashcardsPage(page);

    await createPage.navigate();
    await createPage.pasteSourceText(SAMPLE_TEXT_1500_CHARS);
    await createPage.clickGenerate();
    await createPage.waitForCandidates();

    const candidateCount = await createPage.getCandidateCount();
    expect(candidateCount).toBeGreaterThan(0);

    await createPage.acceptCard(0);

    await createPage.editCard(1);
    await createPage.fillCardModal("Edited Front", "Edited Back");

    await createPage.deleteCard(2);

    await createPage.clickSaveAll();
    await createPage.confirmPartialSave();
    await page.waitForSelector('[data-testid="save-all-button"]', { state: "hidden", timeout: 60000 });

    await myFlashcardsPage.navigate();
    const flashcardCount = await myFlashcardsPage.getFlashcardCount();
    expect(flashcardCount).toEqual(2);
  });

  test("should show error for text below minimum characters", async ({ page }) => {
    const createPage = new CreateFlashcardsPage(page);

    await createPage.navigate();
    await createPage.pasteSourceText(SAMPLE_TEXT_500_CHARS);

    const generateButton = page.getByTestId("generate-button");
    await expect(generateButton).toBeDisabled();
  });

  test("should show error for text above maximum characters", async ({ page }) => {
    const createPage = new CreateFlashcardsPage(page);

    await createPage.navigate();
    await createPage.pasteSourceText(SAMPLE_TEXT_15000_CHARS);

    const generateButton = page.getByTestId("generate-button");
    await expect(generateButton).toBeDisabled();
  });

  test("should show message when AI returns no candidates", async ({ page }) => {
    test.setTimeout(120000);
    const createPage = new CreateFlashcardsPage(page);

    await createPage.navigate();
    await createPage.pasteSourceText(POETRY_TEXT.repeat(15));
    await createPage.clickGenerate();

    const isEmptyStateVisible = await createPage.isEmptyStateVisible();
    expect(isEmptyStateVisible).toBe(true);
  });
});
