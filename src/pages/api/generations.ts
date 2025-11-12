import type { APIContext } from "astro";
import { z } from "zod";
import type { CreateGenerationCommand, CreateGenerationResponseDto } from "../../types";
import { createGenerationLog } from "../../lib/services/generation.service";

export const prerender = false;

/**
 * Validation schema for POST /api/generations request body.
 * Ensures all generation log fields meet database constraints.
 */
const createGenerationSchema = z.object({
  generation_log: z.object({
    model: z.string().max(100).optional(),
    generation_duration: z.number().int().positive().optional(),
    source_text_hash: z.string().length(64).optional(),
    source_text_length: z.number().int().min(1000).max(10000),
    generated_count: z.number().int().min(0),
    accepted_unedited_count: z.number().int().min(0),
    accepted_edited_count: z.number().int().min(0),
    deleted_count: z.number().int().min(0),
  }),
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
    const body = (await context.request.json()) as CreateGenerationCommand;
    const validation = createGenerationSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Call service to create generation log
    const generationLog = await createGenerationLog(
      context.locals.supabase,
      context.locals.user.id,
      validation.data.generation_log
    );

    // 3. Return created generation log
    const response: CreateGenerationResponseDto = generationLog;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Error handling
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: error.errors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Error creating generation log:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
