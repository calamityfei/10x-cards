import type { APIRoute } from "astro";
import { z } from "zod";
import { getFlashcardsQuerySchema, createFlashcardsSchema } from "../../../lib/validation/flashcard.schemas";
import { getFlashcards, createFlashcards } from "../../../lib/services/flashcard.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validatedQuery = getFlashcardsQuerySchema.parse(queryParams);

    const result = await getFlashcards(locals.supabase, DEFAULT_USER_ID, validatedQuery);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Validation failed", details: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("GET /api/flashcards error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validatedBody = createFlashcardsSchema.parse(body);

    const flashcards = await createFlashcards(locals.supabase, DEFAULT_USER_ID, validatedBody.flashcards);

    return new Response(JSON.stringify({ flashcards }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Validation failed", details: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("POST /api/flashcards error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
