import type { Page } from "@playwright/test";

export class CreateFlashcardsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/create-flashcards");
  }

  async pasteSourceText(text: string) {
    const textarea = this.page.locator("#source-text");
    await textarea.click();
    await textarea.fill(text);
    await textarea.blur();
  }

  async clickGenerate() {
    await this.page.getByTestId("generate-button").click();
  }

  async waitForCandidates(timeout = 90000) {
    await this.page.waitForSelector('[data-testid="flashcard-accept-button"]', { timeout });
  }

  async isErrorVisible() {
    return this.page.getByTestId("candidate-error-card").isVisible();
  }

  async isEmptyStateVisible() {
    return this.page.getByTestId("candidate-empty-state").isVisible();
  }

  async clickManualAdd() {
    await this.page.getByTestId("manual-add-button").click();
  }

  async acceptCard(index = 0) {
    const acceptButtons = this.page.getByTestId("flashcard-accept-button");
    await acceptButtons.nth(index).click();
  }

  async editCard(index = 0) {
    const editButtons = this.page.getByTestId("flashcard-edit-button");
    await editButtons.nth(index).click();
  }

  async deleteCard(index = 0) {
    const deleteButtons = this.page.getByTestId("flashcard-delete-button");
    await deleteButtons.nth(index).click();
  }

  async fillCardModal(front: string, back: string) {
    await this.page.locator("#front").fill(front);
    await this.page.locator("#back").fill(back);
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async clickSaveAll() {
    await this.page.getByTestId("save-all-button").click();
  }

  async confirmPartialSave() {
    await this.page.getByRole("button", { name: "Discard & Save" }).click();
  }

  async getCandidateCount() {
    return this.page.getByTestId("flashcard-accept-button").count();
  }
}
