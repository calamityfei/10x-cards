import type { Page } from "@playwright/test";

export class RegisterPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/register");
  }

  async register(email: string, password: string, confirmPassword: string) {
    await this.page.locator("#email").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.locator("#confirmPassword").fill(confirmPassword);
    await this.page.getByTestId("register-submit-button").click();
    await this.page.waitForLoadState("networkidle");
  }

  async getErrorMessage() {
    return this.page.getByTestId("register-error-alert").textContent();
  }

  async clickLoginLink() {
    await this.page.getByRole("link", { name: "Login" }).click();
  }
}
