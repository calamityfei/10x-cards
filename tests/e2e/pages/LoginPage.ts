import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.waitForLoadState("networkidle");
    const emailInput = this.page.locator("#email");
    const passwordInput = this.page.locator("#password");
    const submitButton = this.page.getByTestId("login-submit-button");

    await emailInput.waitFor({ state: "visible" });
    await emailInput.click();
    await emailInput.fill(email);

    await passwordInput.click();
    await passwordInput.fill(password);

    await Promise.all([
      this.page.waitForResponse((response) => response.url().includes("/api/auth/login") && response.status() === 200),
      submitButton.click(),
    ]);
    await this.page.waitForURL("/my-flashcards", { timeout: 15000 });
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
