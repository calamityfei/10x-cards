import type { Page } from "@playwright/test";

export class RegisterPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/register");
  }

  async register(email: string, password: string, confirmPassword: string) {
    await this.page.fill("#email", email);
    await this.page.fill("#password", password);
    await this.page.fill("#confirmPassword", confirmPassword);
    await this.page.getByTestId("register-submit-button").click();
  }

  async getErrorMessage() {
    return this.page.getByTestId("register-error-alert").textContent();
  }

  async clickLoginLink() {
    await this.page.getByRole("link", { name: "Login" }).click();
  }
}
