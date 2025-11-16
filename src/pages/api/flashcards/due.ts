import type { APIRoute } from "astro";
import { getDueFlashcards } from "../../../lib/services/flashcard.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
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

    // fetch due flashcards
    const result = await getDueFlashcards(locals.supabase);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/flashcards/due error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
