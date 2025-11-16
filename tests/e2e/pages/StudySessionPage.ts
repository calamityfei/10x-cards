import type { Page } from "@playwright/test";

export class StudySessionPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/study-session");
  }

  async isEmptyStateVisible() {
    return this.page.getByTestId("study-session-empty").isVisible();
  }

  async isCompleteStateVisible() {
    return this.page.getByTestId("study-session-complete").isVisible();
  }

  async clickShowAnswer() {
    await this.page.getByTestId("show-answer-button").click();
  }

  async clickForgot() {
    await this.page.getByTestId("grade-forgot-button").click();
  }

  async clickKnew() {
    await this.page.getByTestId("grade-knew-button").click();
  }

  async pressSpace() {
    await this.page.keyboard.press("Space");
  }

  async press1() {
    await this.page.keyboard.press("1");
  }

  async press2() {
    await this.page.keyboard.press("2");
  }

  async getCurrentCardProgress() {
    return this.page.locator('[aria-live="polite"]').textContent();
  }

  async clickReturnToFlashcards() {
    await this.page.getByTestId("return-to-flashcards-button").click();
  }

  async clickCreateFlashcardsLink() {
    await this.page.getByRole("link", { name: "Create Flashcards" }).click();
  }
}
