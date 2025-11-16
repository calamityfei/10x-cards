import type { Page } from "@playwright/test";

export class PasswordRecoveryPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/password-recovery");
  }

  async submitRecoveryRequest(email: string) {
    await this.page.fill("#email", email);
    await this.page.getByTestId("password-recovery-submit-button").click();
  }

  async isSuccessMessageVisible() {
    return this.page.getByTestId("password-recovery-success").isVisible();
  }

  async clickBackToLogin() {
    await this.page.getByRole("link", { name: "Back to Login" }).click();
  }
}
