import type { APIContext } from "astro";
import { z } from "zod";
import type { GenerateCandidatesCommand, GenerateCandidatesResponseDto } from "../../../types";
import { generateFlashcards } from "../../../lib/services/ai-generation.service";

export const prerender = false;

const generateCandidatesSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1,000 characters")
    .max(10000, "Source text must not exceed 10,000 characters"),
});

export const POST = async (context: APIContext) => {
  try {
    // 1. Parse and validate request body
    const body = (await context.request.json()) as GenerateCandidatesCommand;

    const trimmedBody = {
      source_text: body.source_text?.trim() || "",
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
    const result = await generateFlashcards(validation.data.source_text);

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

    console.error("Unexpected error in generate-candidates:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
