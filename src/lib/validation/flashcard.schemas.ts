import { z } from "zod";

/**
 * Validation schema for GET /flashcards query parameters
 */
export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  sort: z.enum(["created_at", "updated_at", "front", "back"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Validation schema for POST /flashcards request body
 */
export const createFlashcardsSchema = z.object({
  flashcards: z
    .array(
      z.object({
        front: z.string().min(1).max(200),
        back: z.string().min(1).max(500),
        source: z.enum(["manual", "ai_full", "ai_edited"]),
        generation_id: z.number().int().positive().nullable().optional(),
      })
    )
    .min(1)
    .max(50),
});

/**
 * Validation schema for PATCH /flashcards/:id request body
 */
export const updateFlashcardSchema = z
  .object({
    front: z.string().min(1).max(200).optional(),
    back: z.string().min(1).max(500).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

/**
 * Validation schema for flashcard ID path parameter
 */
export const flashcardIdSchema = z.coerce.number().int().positive();
