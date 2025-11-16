import type { Page } from "@playwright/test";

export class MyFlashcardsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/my-flashcards");
  }

  async isEmptyStateVisible() {
    return this.page.getByTestId("flashcards-empty-state").isVisible();
  }

  async search(query: string) {
    await this.page.locator("#search").fill(query);
  }

  async clearSearch() {
    await this.page.getByLabel("Clear search").click();
  }

  async isNoResultsVisible() {
    return this.page.getByTestId("flashcards-no-results").isVisible();
  }

  async selectSort(value: string) {
    await this.page.getByRole("combobox").click();
    await this.page.getByRole("option", { name: value }).click();
  }

  async getFlashcardCount() {
    await this.page.waitForSelector('[data-testid="flashcard-edit-button"]', { timeout: 15000 }).catch(() => undefined);
    return this.page.locator('[data-testid="flashcard-edit-button"]').count();
  }

  async editCard(index = 0) {
    const editButtons = this.page.getByTestId("flashcard-edit-button");
    await editButtons.nth(index).click();
  }

  async deleteCard(index = 0) {
    const deleteButtons = this.page.getByTestId("flashcard-delete-button");
    await deleteButtons.nth(index).click();
  }

  async confirmDelete() {
    await this.page.getByRole("button", { name: "Delete" }).click();
  }

  async cancelDelete() {
    await this.page.getByRole("button", { name: "Cancel" }).click();
  }

  async fillEditModal(front: string, back: string) {
    await this.page.locator("#front").fill(front);
    await this.page.locator("#back").fill(back);
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async clickNextPage() {
    await this.page.getByLabel("Next page").click();
  }

  async clickPreviousPage() {
    await this.page.getByLabel("Previous page").click();
  }

  async clickCreateFlashcardsLink() {
    await this.page.getByRole("link", { name: "Create Flashcards" }).click();
  }
}
