import type { Page } from "@playwright/test";

export class HeaderComponent {
  constructor(private page: Page) {}

  async logout() {
    await this.page.getByTestId("logout-button").click();
  }

  async navigateToMyFlashcards() {
    await this.page.getByRole("link", { name: "My Flashcards" }).click();
  }

  async navigateToCreateFlashcards() {
    await this.page.getByRole("link", { name: "Create Flashcards" }).click();
  }

  async navigateToStudySession() {
    await this.page.getByRole("link", { name: "Study Session" }).click();
  }

  async navigateToMyAccount() {
    await this.page.getByRole("link", { name: "My Account" }).click();
  }
}
