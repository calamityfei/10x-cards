import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { createErrorResponse, handleApiError } from "@/lib/utils/api-errors";

describe("api-errors", () => {
  describe("createErrorResponse", () => {
    it("should create error response with status and message", async () => {
      const response = createErrorResponse(400, "Bad request");

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body).toEqual({ error: "Bad request" });
    });

    it("should create error response with details", async () => {
      const details = { field: "email", issue: "invalid format" };
      const response = createErrorResponse(422, "Validation error", details);

      expect(response.status).toBe(422);

      const body = await response.json();
      expect(body).toEqual({
        error: "Validation error",
        details: { field: "email", issue: "invalid format" },
      });
    });

    it("should handle 500 status code", async () => {
      const response = createErrorResponse(500, "Internal server error");

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toEqual({ error: "Internal server error" });
    });

    it("should handle 404 status code", async () => {
      const response = createErrorResponse(404, "Not found");

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({ error: "Not found" });
    });

    it("should not include details when not provided", async () => {
      const response = createErrorResponse(400, "Error message");

      const body = await response.json();
      expect(body).not.toHaveProperty("details");
    });
  });

  describe("handleApiError", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock implementation
      });
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should handle ZodError with validation details", async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: "invalid", age: 15 });
      } catch (error) {
        const response = handleApiError(error);

        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body.error).toBe("Validation failed");
        expect(body.details).toBeDefined();
        expect(Array.isArray(body.details)).toBe(true);
      }
    });

    it("should handle generic Error", async () => {
      const error = new Error("Something went wrong");
      const response = handleApiError(error);

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith("API error:", error);

      const body = await response.json();
      expect(body).toEqual({ error: "Internal server error" });
    });

    it("should handle unknown error types", async () => {
      const error = "String error";
      const response = handleApiError(error);

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith("API error:", error);

      const body = await response.json();
      expect(body).toEqual({ error: "Internal server error" });
    });

    it("should handle null error", async () => {
      const response = handleApiError(null);

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith("API error:", null);

      const body = await response.json();
      expect(body).toEqual({ error: "Internal server error" });
    });

    it("should log all errors to console", () => {
      const error = new Error("Test error");
      handleApiError(error);

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(consoleErrorSpy).toHaveBeenCalledWith("API error:", error);
    });

    it("should include ZodError details in response", async () => {
      const schema = z.object({
        name: z.string().min(3),
      });

      try {
        schema.parse({ name: "ab" });
      } catch (error) {
        const response = handleApiError(error);
        const body = await response.json();

        expect(body.details).toBeDefined();
        expect(body.details[0]).toHaveProperty("path");
        expect(body.details[0]).toHaveProperty("message");
      }
    });
  });
});
