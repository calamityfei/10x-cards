import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  passwordRecoverySchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "@/lib/validation/auth.schemas";

describe("auth.schemas", () => {
  describe("loginSchema", () => {
    it("should parse valid login credentials", () => {
      const result = loginSchema.parse({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.email).toBe("user@example.com");
      expect(result.password).toBe("password123");
    });

    it("should reject invalid email format", () => {
      expect(() => loginSchema.parse({ email: "invalid", password: "password" })).toThrow();
    });

    it("should reject email without @", () => {
      expect(() => loginSchema.parse({ email: "userexample.com", password: "password" })).toThrow();
    });

    it("should reject email without domain", () => {
      expect(() => loginSchema.parse({ email: "user@", password: "password" })).toThrow();
    });

    it("should reject empty password", () => {
      expect(() => loginSchema.parse({ email: "user@example.com", password: "" })).toThrow();
    });

    it("should accept any non-empty password", () => {
      const result = loginSchema.parse({ email: "user@example.com", password: "x" });
      expect(result.password).toBe("x");
    });

    it("should reject missing email", () => {
      expect(() => loginSchema.parse({ password: "password" })).toThrow();
    });

    it("should reject missing password", () => {
      expect(() => loginSchema.parse({ email: "user@example.com" })).toThrow();
    });
  });

  describe("registerSchema", () => {
    it("should parse valid registration data", () => {
      const result = registerSchema.parse({
        email: "newuser@example.com",
        password: "password123",
      });

      expect(result.email).toBe("newuser@example.com");
      expect(result.password).toBe("password123");
    });

    it("should reject invalid email format", () => {
      expect(() => registerSchema.parse({ email: "invalid", password: "password123" })).toThrow();
    });

    it("should reject password shorter than 8 characters", () => {
      expect(() => registerSchema.parse({ email: "user@example.com", password: "pass" })).toThrow();
    });

    it("should reject password with exactly 7 characters", () => {
      expect(() => registerSchema.parse({ email: "user@example.com", password: "1234567" })).toThrow();
    });

    it("should accept password with exactly 8 characters", () => {
      const result = registerSchema.parse({ email: "user@example.com", password: "12345678" });
      expect(result.password).toBe("12345678");
    });

    it("should accept long passwords", () => {
      const longPassword = "a".repeat(100);
      const result = registerSchema.parse({ email: "user@example.com", password: longPassword });
      expect(result.password).toBe(longPassword);
    });

    it("should reject empty password", () => {
      expect(() => registerSchema.parse({ email: "user@example.com", password: "" })).toThrow();
    });
  });

  describe("passwordRecoverySchema", () => {
    it("should parse valid email", () => {
      const result = passwordRecoverySchema.parse({ email: "user@example.com" });
      expect(result.email).toBe("user@example.com");
    });

    it("should reject invalid email format", () => {
      expect(() => passwordRecoverySchema.parse({ email: "invalid" })).toThrow();
    });

    it("should reject email without @", () => {
      expect(() => passwordRecoverySchema.parse({ email: "userexample.com" })).toThrow();
    });

    it("should reject missing email", () => {
      expect(() => passwordRecoverySchema.parse({})).toThrow();
    });

    it("should accept email with subdomain", () => {
      const result = passwordRecoverySchema.parse({ email: "user@mail.example.com" });
      expect(result.email).toBe("user@mail.example.com");
    });

    it("should accept email with plus addressing", () => {
      const result = passwordRecoverySchema.parse({ email: "user+tag@example.com" });
      expect(result.email).toBe("user+tag@example.com");
    });
  });

  describe("changePasswordSchema", () => {
    it("should parse valid password change data", () => {
      const result = changePasswordSchema.parse({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
      });

      expect(result.currentPassword).toBe("oldpassword");
      expect(result.newPassword).toBe("newpassword123");
    });

    it("should reject empty current password", () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: "",
          newPassword: "newpassword123",
        })
      ).toThrow();
    });

    it("should reject new password shorter than 8 characters", () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: "oldpassword",
          newPassword: "short",
        })
      ).toThrow();
    });

    it("should accept new password with exactly 8 characters", () => {
      const result = changePasswordSchema.parse({
        currentPassword: "oldpassword",
        newPassword: "12345678",
      });
      expect(result.newPassword).toBe("12345678");
    });

    it("should reject missing current password", () => {
      expect(() =>
        changePasswordSchema.parse({
          newPassword: "newpassword123",
        })
      ).toThrow();
    });

    it("should reject missing new password", () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: "oldpassword",
        })
      ).toThrow();
    });
  });

  describe("deleteAccountSchema", () => {
    it("should parse valid password", () => {
      const result = deleteAccountSchema.parse({ password: "mypassword" });
      expect(result.password).toBe("mypassword");
    });

    it("should reject empty password", () => {
      expect(() => deleteAccountSchema.parse({ password: "" })).toThrow();
    });

    it("should reject missing password", () => {
      expect(() => deleteAccountSchema.parse({})).toThrow();
    });

    it("should accept any non-empty password", () => {
      const result = deleteAccountSchema.parse({ password: "x" });
      expect(result.password).toBe("x");
    });
  });
});
