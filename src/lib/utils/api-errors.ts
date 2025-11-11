import { z } from "zod";

/**
 * Creates a standardized error response
 */
export function createErrorResponse(status: number, message: string, details?: unknown) {
  const body = details ? { error: message, details } : { error: message };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Handles API errors and returns appropriate response
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return createErrorResponse(400, "Validation failed", error.errors);
  }

  console.error("API error:", error);
  return createErrorResponse(500, "Internal server error");
}
