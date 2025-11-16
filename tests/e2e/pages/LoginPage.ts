import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.locator("#email").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.getByTestId("login-submit-button").click();
    await this.page.waitForLoadState("networkidle");
  }

  async getErrorMessage() {
    return this.page.getByTestId("login-error-alert").textContent();
  }

  async clickForgotPassword() {
    await this.page.getByRole("link", { name: "Forgot password?" }).click();
  }

  async clickRegisterLink() {
    await this.page.getByRole("link", { name: "Register" }).click();
  }
}
