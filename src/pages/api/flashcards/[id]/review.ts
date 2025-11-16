import type { APIRoute } from "astro";
import { flashcardIdSchema, reviewFlashcardSchema } from "../../../../lib/validation/flashcard.schemas";
import { reviewFlashcard } from "../../../../lib/services/flashcard.service";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // validate id parameter
    const idResult = flashcardIdSchema.safeParse(params.id);
    if (!idResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: idResult.error.errors.map((e) => e.message),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // verify authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // parse and validate request body
    const body = await request.json();
    const validationResult = reviewFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // update flashcard with SRS metadata
    const result = await reviewFlashcard(locals.supabase, idResult.data, validationResult.data);

    if (!result) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PATCH /api/flashcards/:id/review error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
