import type { Page } from "@playwright/test";

export class AccountSettingsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/my-account");
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    await this.page.locator("#currentPassword").fill(currentPassword);
    await this.page.locator("#newPassword").fill(newPassword);
    await this.page.locator("#confirmPassword").fill(confirmPassword);
    await this.page.getByTestId("change-password-submit-button").click();
    await this.page.waitForLoadState("networkidle");
  }

  async isPasswordChangeSuccessVisible() {
    return this.page.getByTestId("change-password-success-alert").isVisible();
  }

  async clickDeleteAccount() {
    await this.page.getByTestId("delete-account-button").click();
  }

  async confirmDeleteAccount(password: string) {
    await this.page.locator("#password").fill(password);
    await this.page.getByTestId("delete-account-confirm-button").click();
    await this.page.waitForLoadState("networkidle");
  }

  async cancelDeleteAccount() {
    await this.page.getByTestId("delete-account-cancel-button").click();
  }
}
