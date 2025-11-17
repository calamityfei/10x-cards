import type { APIContext } from "astro";
import { z } from "zod";
import type { GenerateCandidatesCommand, GenerateCandidatesResponseDto } from "../../../types";
import { generateFlashcards } from "../../../lib/services/ai-generation.service";
import { OpenRouterError } from "../../../lib/services/openrouter.types";

export const prerender = false;

const generateCandidatesSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1,000 characters")
    .max(10000, "Source text must not exceed 10,000 characters"),
  model: z.string().optional(),
  max_cards: z.number().int().min(1).max(50).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

export const POST = async (context: APIContext) => {
  try {
    if (!context.locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Parse and validate request body
    const body = (await context.request.json()) as GenerateCandidatesCommand;

    const trimmedBody = {
      source_text: body.source_text?.trim() || "",
      model: body.model,
      max_cards: body.max_cards,
      temperature: body.temperature,
    };

    const validation = generateCandidatesSchema.safeParse(trimmedBody);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Call service
    const options = {
      model: validation.data.model,
      maxCards: validation.data.max_cards,
      temperature: validation.data.temperature,
    };
    const result = await generateFlashcards(validation.data.source_text, options, context.locals.runtime?.env);

    // 3. Format response
    const response: GenerateCandidatesResponseDto = {
      candidates: result.candidates,
      metadata: result.metadata,
    };

    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // 4. Error handling
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle OpenRouterError with specific messages
    if (error instanceof OpenRouterError) {
      let userMessage: string;

      switch (error.code) {
        case "VALIDATION_ERROR":
          userMessage = error.message;
          break;
        case "AUTH_ERROR":
          userMessage = "Authentication failed. Please contact support.";
          break;
        case "PAYMENT_ERROR":
          userMessage = "AI service requires credits. Please contact support.";
          break;
        case "RATE_LIMIT_ERROR":
          userMessage = "Service is busy. Please try again in a few moments.";
          break;
        case "SERVICE_ERROR":
          userMessage = "AI service is temporarily unavailable. Please try again later.";
          break;
        case "NETWORK_ERROR":
          userMessage = "Connection error. Please check your internet connection.";
          break;
        case "PARSE_ERROR":
        case "INVALID_RESPONSE":
          userMessage = "Failed to process AI response. Please try again.";
          break;
        default:
          userMessage = "Failed to generate flashcards. Please try again.";
      }

      return new Response(
        JSON.stringify({
          error: "Generation failed",
          details: userMessage,
        }),
        { status: error.statusCode || 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const err = error as { name?: string; code?: string };
    if (err.name === "TimeoutError" || err.code === "ECONNREFUSED") {
      return new Response(
        JSON.stringify({
          error: "AI service unavailable",
          details: "The external AI service failed or timed out",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

    return new Response(
      JSON.stringify({
        error: "Generation failed",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
