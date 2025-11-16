import type { Page } from "@playwright/test";

export class PasswordResetPage {
  constructor(private page: Page) {}

  async navigate(token?: string) {
    const url = token ? `/password-reset?token=${token}` : "/password-reset";
    await this.page.goto(url);
  }

  async resetPassword(newPassword: string, confirmPassword: string) {
    await this.page.fill("#password", newPassword);
    await this.page.fill("#confirmPassword", confirmPassword);
    await this.page.getByTestId("password-reset-submit-button").click();
  }

  async isSuccessMessageVisible() {
    return this.page.getByTestId("password-reset-success").isVisible();
  }
}
