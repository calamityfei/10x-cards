import type { Page } from "@playwright/test";

export class AccountSettingsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/my-account");
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    await this.page.fill("#currentPassword", currentPassword);
    await this.page.fill("#newPassword", newPassword);
    await this.page.fill("#confirmPassword", confirmPassword);
    await this.page.getByTestId("change-password-submit-button").click();
  }

  async isPasswordChangeSuccessVisible() {
    return this.page.getByTestId("change-password-success-alert").isVisible();
  }

  async clickDeleteAccount() {
    await this.page.getByTestId("delete-account-button").click();
  }

  async confirmDeleteAccount(password: string) {
    await this.page.fill("#password", password);
    await this.page.getByTestId("delete-account-confirm-button").click();
  }

  async cancelDeleteAccount() {
    await this.page.getByTestId("delete-account-cancel-button").click();
  }
}
